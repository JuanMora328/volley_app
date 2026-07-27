import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  calculateBalanceMetrics,
  GameSessionStatus,
  generateBalancedTeams,
} from '@volleyflow/shared';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import {
  GameSessionEntity,
  PlayerEntity,
  SessionPlayerEntity,
  TeamEntity,
  TeamPlayerEntity,
  VenueEntity,
} from '../database/entities';
import {
  AddSessionPlayersDto,
  CreateSessionDto,
  ListSessionsDto,
  SaveTeamsDto,
  UpdateSessionPlayerDto,
} from './sessions.dto';
@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(GameSessionEntity) private readonly sessions: Repository<GameSessionEntity>,
    private readonly dataSource: DataSource,
  ) {}
  async list(query: ListSessionsDto) {
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.date ? { date: query.date } : {}),
    };
    const [items, total] = await this.sessions.findAndCount({
      where,
      relations: { venue: true },
      order: { date: 'DESC', createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return {
      items,
      meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
    };
  }
  async create(dto: CreateSessionDto) {
    const venue = dto.venueId
      ? await this.dataSource.getRepository(VenueEntity).findOneBy({ id: dto.venueId })
      : null;
    if (dto.venueId && !venue) throw new NotFoundException('La cancha seleccionada no existe');
    const snapshot = (venue?.name ?? dto.venueName ?? '').trim();
    if (!snapshot) throw new BadRequestException('El nombre de la cancha es obligatorio');
    return this.sessions.save(
      this.sessions.create({
        date: dto.date,
        startTime: dto.startTime || null,
        venue,
        venueNameSnapshot: snapshot,
        courtPrice: dto.courtPrice,
        gatoradePrice: dto.gatoradePrice,
        teamCount: dto.teamCount,
        defaultTargetScore: dto.defaultTargetScore,
        currentTargetScore: dto.defaultTargetScore,
        status: GameSessionStatus.DRAFT,
      }),
    );
  }
  async update(id: string, dto: Partial<CreateSessionDto>) {
    const session = await this.session(id);
    this.ensureDraft(session);
    let venue = session.venue;
    if (dto.venueId !== undefined) {
      venue = dto.venueId
        ? await this.dataSource.getRepository(VenueEntity).findOneBy({ id: dto.venueId })
        : null;
      if (dto.venueId && !venue) throw new NotFoundException('La cancha seleccionada no existe');
    }
    const snapshot = venue?.name ?? dto.venueName ?? session.venueNameSnapshot;
    Object.assign(session, dto, {
      venue,
      venueNameSnapshot: snapshot,
      ...(dto.defaultTargetScore ? { currentTargetScore: dto.defaultTargetScore } : {}),
    });
    return this.sessions.save(session);
  }
  async detail(id: string) {
    const session = await this.session(id);
    const participants = await this.dataSource.getRepository(SessionPlayerEntity).find({
      where: { session: { id } },
      relations: { player: true },
      order: { createdAt: 'ASC' },
    });
    const teams = await this.dataSource
      .getRepository(TeamEntity)
      .find({ where: { session: { id } }, relations: {}, order: { createdAt: 'ASC' } });
    const links = teams.length
      ? await this.dataSource.getRepository(TeamPlayerEntity).find({
          where: { team: { id: In(teams.map((t) => t.id)) } } as never,
          relations: { team: true, sessionPlayer: true },
        })
      : [];
    const mappedTeams = teams.map((team) => ({
      ...team,
      players: links.filter((link) => link.team.id === team.id).map((link) => link.sessionPlayer),
    }));
    const metrics = mappedTeams.length
      ? calculateBalanceMetrics(
          mappedTeams.map((team) => ({
            name: team.name,
            players: team.players.map((player) => ({ id: player.id, level: player.levelSnapshot })),
          })),
        )
      : null;
    return {
      ...session,
      participants,
      teams: mappedTeams,
      metrics,
      allowedActions: {
        edit: session.status === GameSessionStatus.DRAFT,
        managePlayers: session.status === GameSessionStatus.DRAFT,
        manageTeams: session.status === GameSessionStatus.DRAFT,
        confirmTeams: session.status === GameSessionStatus.DRAFT && teams.length > 0,
      },
    };
  }
  async addPlayers(id: string, dto: AddSessionPlayersDto) {
    return this.dataSource.transaction(async (manager) => {
      const session = await this.sessionWith(manager, id);
      this.ensureDraft(session);
      const ids = dto.players.map((item) => item.playerId);
      if (new Set(ids).size !== ids.length)
        throw new ConflictException('No se puede repetir un jugador');
      const existing = await manager.count(SessionPlayerEntity, {
        where: { session: { id }, player: { id: In(ids) } } as never,
      });
      if (existing) throw new ConflictException('Uno o más jugadores ya pertenecen a la jornada');
      const players = await manager.find(PlayerEntity, { where: { id: In(ids), active: true } });
      if (players.length !== ids.length)
        throw new BadRequestException('Todos los jugadores deben existir y estar activos');
      await this.invalidateTeams(manager, id);
      const records = dto.players.map((item) => {
        const player = players.find((p) => p.id === item.playerId)!;
        return manager.create(SessionPlayerEntity, {
          session,
          player,
          playerNameSnapshot: player.name,
          levelSnapshot: item.levelSnapshot ?? player.defaultLevel,
        });
      });
      return manager.save(records);
    });
  }
  async updatePlayer(id: string, spid: string, dto: UpdateSessionPlayerDto) {
    return this.dataSource.transaction(async (manager) => {
      const session = await this.sessionWith(manager, id);
      this.ensureDraft(session);
      const participant = await manager.findOne(SessionPlayerEntity, {
        where: { id: spid, session: { id } },
      });
      if (!participant) throw new NotFoundException('Participante no encontrado');
      await this.invalidateTeams(manager, id);
      Object.assign(participant, dto);
      return manager.save(participant);
    });
  }
  async removePlayer(id: string, spid: string) {
    return this.dataSource.transaction(async (manager) => {
      const session = await this.sessionWith(manager, id);
      this.ensureDraft(session);
      const participant = await manager.findOne(SessionPlayerEntity, {
        where: { id: spid, session: { id } },
      });
      if (!participant) throw new NotFoundException('Participante no encontrado');
      await this.invalidateTeams(manager, id);
      await manager.remove(participant);
      return { deleted: true };
    });
  }
  async generate(id: string, seed?: string | number) {
    return this.dataSource.transaction(async (manager) => {
      const session = await this.sessionWith(manager, id);
      this.ensureDraft(session);
      const participants = await manager.find(SessionPlayerEntity, { where: { session: { id } } });
      const generated = generateBalancedTeams(
        participants.map((p) => ({ id: p.id, name: p.playerNameSnapshot, level: p.levelSnapshot })),
        session.teamCount,
        { seed },
      );
      await this.invalidateTeams(manager, id);
      for (const candidate of generated.teams) {
        const team = await manager.save(
          TeamEntity,
          manager.create(TeamEntity, {
            session,
            name: candidate.name,
            generatedAutomatically: true,
          }),
        );
        await manager.save(
          candidate.players.map((player) =>
            manager.create(TeamPlayerEntity, {
              team,
              sessionPlayer: participants.find((item) => item.id === player.id)!,
            }),
          ),
        );
      }
      return generated;
    });
  }
  async saveTeams(id: string, dto: SaveTeamsDto) {
    return this.dataSource.transaction(async (manager) => {
      const session = await this.sessionWith(manager, id);
      this.ensureDraft(session);
      const participants = await manager.find(SessionPlayerEntity, { where: { session: { id } } });
      this.validateComposition(dto, participants, session.teamCount);
      await this.invalidateTeams(manager, id);
      for (const item of dto.teams) {
        const team = await manager.save(
          TeamEntity,
          manager.create(TeamEntity, {
            session,
            name: item.name.trim(),
            color: item.color ?? null,
            generatedAutomatically: false,
          }),
        );
        await manager.save(
          item.sessionPlayerIds.map((spid) =>
            manager.create(TeamPlayerEntity, {
              team,
              sessionPlayer: participants.find((player) => player.id === spid)!,
            }),
          ),
        );
      }
      return { saved: true };
    });
  }
  async confirm(id: string) {
    return this.dataSource.transaction(async (manager) => {
      const session = await this.sessionWith(manager, id);
      this.ensureDraft(session);
      const participants = await manager.find(SessionPlayerEntity, { where: { session: { id } } });
      const teams = await manager.find(TeamEntity, { where: { session: { id } } });
      const links = await manager.find(TeamPlayerEntity, {
        where: { team: { id: In(teams.map((t) => t.id)) } } as never,
        relations: { team: true, sessionPlayer: true },
      });
      this.validateComposition(
        {
          teams: teams.map((team) => ({
            id: team.id,
            name: team.name,
            sessionPlayerIds: links
              .filter((link) => link.team.id === team.id)
              .map((link) => link.sessionPlayer?.id),
          })),
        },
        participants,
        session.teamCount,
      );
      const now = new Date();
      teams.forEach((team) => (team.confirmedAt = now));
      await manager.save(teams);
      session.status = GameSessionStatus.TEAMS_CREATED;
      await manager.save(session);
      return { status: session.status, confirmedAt: now };
    });
  }
  async cancel(id: string) {
    return this.dataSource.transaction(async (manager) => {
      const session = await this.sessionWith(manager, id);
      if (session.status === GameSessionStatus.CANCELLED) return session;
      session.status = GameSessionStatus.CANCELLED;
      return manager.save(session);
    });
  }
  async delete(id: string, confirmation: string) {
    if (confirmation !== 'ELIMINAR')
      throw new BadRequestException('Escriba ELIMINAR para confirmar');
    return this.dataSource.transaction(async (manager) => {
      const session = await this.sessionWith(manager, id);
      await manager.remove(session);
      if (await manager.exists(GameSessionEntity, { where: { id } }))
        throw new ConflictException('No fue posible eliminar la jornada');
      return { deleted: true, id };
    });
  }
  private validateComposition(
    dto: SaveTeamsDto,
    participants: SessionPlayerEntity[],
    teamCount: number,
  ) {
    if (dto.teams.length !== teamCount)
      throw new BadRequestException(`La jornada requiere ${teamCount} equipos`);
    const assigned = dto.teams.flatMap((team) => team.sessionPlayerIds);
    if (assigned.length !== participants.length || new Set(assigned).size !== assigned.length)
      throw new BadRequestException('Todos los participantes deben asignarse exactamente una vez');
    const valid = new Set(participants.map((player) => player.id));
    if (assigned.some((id) => !valid.has(id)))
      throw new BadRequestException('La composición contiene participantes externos');
    const sizes = dto.teams.map((team) => team.sessionPlayerIds.length);
    if (Math.min(...sizes) < 1 || Math.max(...sizes) - Math.min(...sizes) > 1)
      throw new BadRequestException('Los equipos deben tener tamaños válidos');
    if (new Set(dto.teams.map((team) => team.name.trim().toLowerCase())).size !== dto.teams.length)
      throw new BadRequestException('Los nombres de equipo deben ser únicos');
  }
  private async invalidateTeams(manager: EntityManager, id: string) {
    const teams = await manager.find(TeamEntity, { where: { session: { id } } });
    if (teams.some((team) => team.confirmedAt))
      throw new BadRequestException('Los equipos confirmados no pueden reemplazarse');
    if (teams.length) await manager.remove(teams);
  }
  private ensureDraft(session: GameSessionEntity) {
    if (session.status !== GameSessionStatus.DRAFT)
      throw new BadRequestException('La jornada ya no puede modificarse');
  }
  private async session(id: string) {
    const session = await this.sessions.findOne({
      where: { id },
      relations: { venue: true, championTeam: true },
    });
    if (!session) throw new NotFoundException('Jornada no encontrada');
    return session;
  }
  private async sessionWith(manager: EntityManager, id: string) {
    const session = await manager.findOne(GameSessionEntity, {
      where: { id },
      relations: { venue: true },
    });
    if (!session) throw new NotFoundException('Jornada no encontrada');
    return session;
  }
}
