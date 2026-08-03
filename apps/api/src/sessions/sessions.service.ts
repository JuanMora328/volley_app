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
  HistorySummaryDto,
} from './sessions.dto';
@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(GameSessionEntity) private readonly sessions: Repository<GameSessionEntity>,
    private readonly dataSource: DataSource,
  ) {}
  async list(query: ListSessionsDto) {
    const qb = this.sessions.createQueryBuilder('gs');
    if (query.status) qb.andWhere('gs.status=:status', { status: query.status });
    if (query.date) qb.andWhere('gs.date=:date', { date: query.date });
    if (query.dateFrom) qb.andWhere('gs.date>=:from', { from: query.dateFrom });
    if (query.dateTo) qb.andWhere('gs.date<=:to', { to: query.dateTo });
    if (query.search)
      qb.andWhere('gs.venue_name_snapshot ILIKE :search', { search: `%${query.search}%` });
    if (query.participantSearch)
      qb.andWhere(
        `EXISTS(SELECT 1 FROM session_players sp WHERE sp.session_id=gs.id AND sp.player_name_snapshot ILIKE :participant)`,
        { participant: `%${query.participantSearch}%` },
      );
    if (query.hasChampion !== undefined)
      qb.andWhere(
        query.hasChampion ? 'gs.champion_team_id IS NOT NULL' : 'gs.champion_team_id IS NULL',
      );
    if (query.financialStatus) {
      const expression = {
        UNSETTLED: `gs.settled_at IS NULL`,
        CLEAR: `gs.settled_at IS NOT NULL AND NOT EXISTS(SELECT 1 FROM session_players sp WHERE sp.session_id=gs.id AND sp.amount_paid<>sp.amount_due)`,
        PENDING: `EXISTS(SELECT 1 FROM session_players sp WHERE sp.session_id=gs.id AND sp.amount_due>0 AND sp.amount_paid=0)`,
        PARTIAL: `EXISTS(SELECT 1 FROM session_players sp WHERE sp.session_id=gs.id AND sp.amount_paid>0 AND sp.amount_paid<sp.amount_due)`,
        CREDIT: `EXISTS(SELECT 1 FROM session_players sp WHERE sp.session_id=gs.id AND sp.amount_paid>sp.amount_due)`,
      }[query.financialStatus];
      qb.andWhere(expression!);
    }
    const total = await qb.getCount();
    const ids = (
      await qb
        .clone()
        .select('gs.id', 'id')
        .orderBy('gs.date', query.sortOrder)
        .addOrderBy('gs.created_at', query.sortOrder)
        .offset((query.page - 1) * query.limit)
        .limit(query.limit)
        .getRawMany<{ id: string }>()
    ).map((x) => x.id);
    if (!ids.length)
      return {
        items: [],
        page: query.page,
        limit: query.limit,
        totalItems: total,
        totalPages: Math.ceil(total / query.limit),
      };
    const items = await this.sessions
      .createQueryBuilder('gs')
      .leftJoin('gs.championTeam', 'champion')
      .select([
        'gs.id AS id',
        'gs.date AS date',
        'gs.venueNameSnapshot AS "venueNameSnapshot"',
        'gs.status AS status',
        'champion.name AS "championTeam"',
      ])
      .addSelect(
        '(SELECT count(*) FROM session_players sp WHERE sp.session_id=gs.id)::int',
        'participantCount',
      )
      .addSelect('(SELECT count(*) FROM teams t WHERE t.session_id=gs.id)::int', 'teamCount')
      .addSelect(
        `(SELECT count(*) FROM matches m WHERE m.session_id=gs.id AND m.status='FINISHED')::int`,
        'finishedMatches',
      )
      .addSelect(
        '(SELECT coalesce(sum(sp.amount_due),0) FROM session_players sp WHERE sp.session_id=gs.id)::int',
        'totalExpected',
      )
      .addSelect(
        '(SELECT coalesce(sum(sp.amount_paid),0) FROM session_players sp WHERE sp.session_id=gs.id)::int',
        'totalCollected',
      )
      .addSelect(
        '(SELECT coalesce(sum(greatest(sp.amount_due-sp.amount_paid,0)),0) FROM session_players sp WHERE sp.session_id=gs.id)::int',
        'totalPending',
      )
      .where('gs.id IN (:...ids)', { ids })
      .orderBy('gs.date', query.sortOrder)
      .getRawMany();
    return {
      items,
      page: query.page,
      limit: query.limit,
      totalItems: total,
      totalPages: Math.ceil(total / query.limit),
      filters: query,
    };
  }

  async historySummary(query: HistorySummaryDto) {
    const params: unknown[] = [];
    const where: string[] = [];
    if (query.dateFrom) {
      params.push(query.dateFrom);
      where.push(`gs.date >= $${params.length}`);
    }
    if (query.dateTo) {
      params.push(query.dateTo);
      where.push(`gs.date <= $${params.length}`);
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [row] = await this.dataSource.query(
      `SELECT count(*)::int AS "totalSessions",count(*) FILTER(WHERE gs.status='FINISHED')::int AS "finishedSessions",count(*) FILTER(WHERE gs.status='CANCELLED')::int AS "cancelledSessions",count(*) FILTER(WHERE gs.status IN ('DRAFT','TEAMS_CREATED','IN_PROGRESS','SETTLEMENT'))::int AS "activeSessions",coalesce(sum((SELECT count(*) FROM session_players sp WHERE sp.session_id=gs.id)),0)::int AS "totalParticipants",coalesce(sum((SELECT count(*) FROM matches m WHERE m.session_id=gs.id AND m.status='FINISHED')),0)::int AS "finishedMatches",coalesce(sum((SELECT sum(sp.amount_due) FROM session_players sp WHERE sp.session_id=gs.id)),0)::int AS "totalExpected",coalesce(sum((SELECT sum(sp.amount_paid) FROM session_players sp WHERE sp.session_id=gs.id)),0)::int AS "totalCollected",coalesce(sum((SELECT sum(greatest(sp.amount_due-sp.amount_paid,0)) FROM session_players sp WHERE sp.session_id=gs.id)),0)::int AS "totalPending" FROM game_sessions gs ${clause}`,
      params,
    );
    return row;
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
        courtHourlyPrice: dto.courtPrice,
        courtDurationMinutes: 60,
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
    if (dto.courtPrice !== undefined) session.courtHourlyPrice = dto.courtPrice;
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
  async replacePlayers(id: string, dto: AddSessionPlayersDto) {
    return this.dataSource.transaction(async (manager) => {
      const session = await this.sessionWith(manager, id);
      this.ensureDraft(session);
      const ids = dto.players.map((item) => item.playerId);
      if (new Set(ids).size !== ids.length)
        throw new ConflictException('No se puede repetir un jugador');

      const players = await manager.find(PlayerEntity, { where: { id: In(ids), active: true } });
      if (players.length !== ids.length)
        throw new BadRequestException('Todos los jugadores deben existir y estar activos');

      const existing = await manager.find(SessionPlayerEntity, {
        where: { session: { id } },
        relations: { player: true },
      });
      await this.invalidateTeams(manager, id);

      const selectedIds = new Set(ids);
      const removed = existing.filter((participant) => !selectedIds.has(participant.player.id));
      if (removed.length) await manager.remove(removed);

      const records = dto.players.map((item) => {
        const participant = existing.find((current) => current.player.id === item.playerId);
        if (participant) {
          participant.levelSnapshot =
            item.levelSnapshot ??
            players.find((player) => player.id === item.playerId)!.defaultLevel;
          return participant;
        }
        const player = players.find((current) => current.id === item.playerId)!;
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
