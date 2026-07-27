import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VenueEntity } from '../database/entities';
import { RecordStatus } from '../players/players.dto';
import { CreateVenueDto, ListVenuesDto, UpdateVenueDto } from './venues.dto';
@Injectable()
export class VenuesService {
  constructor(@InjectRepository(VenueEntity) private readonly repo: Repository<VenueEntity>) {}
  async list(query: ListVenuesDto) {
    const qb = this.repo.createQueryBuilder('venue');
    if (query.search)
      qb.andWhere('(venue.name ILIKE :search OR venue.address ILIKE :search)', {
        search: `%${query.search}%`,
      });
    if (query.status !== RecordStatus.ALL)
      qb.andWhere('venue.active = :active', { active: query.status === RecordStatus.ACTIVE });
    qb.orderBy(`venue.${query.sortBy}`, query.sortOrder)
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
  create(dto: CreateVenueDto) {
    return this.repo.save(
      this.repo.create({
        ...dto,
        name: this.name(dto.name),
        address: this.optional(dto.address),
        active: true,
      }),
    );
  }
  async get(id: string) {
    const venue = await this.repo.findOneBy({ id });
    if (!venue) throw new NotFoundException('Cancha no encontrada');
    return venue;
  }
  async update(id: string, dto: UpdateVenueDto) {
    const venue = await this.get(id);
    if (dto.name !== undefined) venue.name = this.name(dto.name);
    if (dto.address !== undefined) venue.address = this.optional(dto.address);
    if (dto.defaultCourtPrice !== undefined) venue.defaultCourtPrice = dto.defaultCourtPrice;
    if (dto.defaultGatoradePrice !== undefined)
      venue.defaultGatoradePrice = dto.defaultGatoradePrice;
    return this.repo.save(venue);
  }
  async status(id: string, active: boolean) {
    const venue = await this.get(id);
    venue.active = active;
    return this.repo.save(venue);
  }
  private name(value: string) {
    const result = value.trim();
    if (!result) throw new BadRequestException('El nombre es obligatorio');
    return result;
  }
  private optional(value?: string | null) {
    const result = value?.trim();
    return result ? result : null;
  }
}
