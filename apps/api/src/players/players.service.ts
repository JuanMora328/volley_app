import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerEntity } from '../database/entities';
import { CreatePlayerDto, ListPlayersDto, RecordStatus, UpdatePlayerDto } from './players.dto';

@Injectable()
export class PlayersService {
  constructor(@InjectRepository(PlayerEntity) private readonly repo: Repository<PlayerEntity>) {}
  async list(query: ListPlayersDto) {
    const qb = this.repo.createQueryBuilder('player');
    if (query.search) qb.andWhere('player.name ILIKE :search', { search: `%${query.search}%` });
    if (query.status !== RecordStatus.ALL)
      qb.andWhere('player.active = :active', { active: query.status === RecordStatus.ACTIVE });
    qb.orderBy(`player.${query.sortBy}`, query.sortOrder)
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    const [items, total] = await qb.getManyAndCount();
    return {
      items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
  create(dto: CreatePlayerDto) {
    const name = this.requiredName(dto.name);
    return this.repo.save(
      this.repo.create({ ...dto, name, notes: this.optional(dto.notes), active: true }),
    );
  }
  async get(id: string) {
    const player = await this.repo.findOneBy({ id });
    if (!player) throw new NotFoundException('Jugador no encontrado');
    return player;
  }
  async update(id: string, dto: UpdatePlayerDto) {
    const player = await this.get(id);
    if (dto.name !== undefined) player.name = this.requiredName(dto.name);
    if (dto.defaultLevel !== undefined) player.defaultLevel = dto.defaultLevel;
    if (dto.notes !== undefined) player.notes = this.optional(dto.notes);
    return this.repo.save(player);
  }
  async status(id: string, active: boolean) {
    const player = await this.get(id);
    player.active = active;
    return this.repo.save(player);
  }
  private requiredName(value: string) {
    const name = value.trim();
    if (!name) throw new BadRequestException('El nombre es obligatorio');
    return name;
  }
  private optional(value?: string | null) {
    const cleaned = value?.trim();
    return cleaned ? cleaned : null;
  }
}
