import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PlayerEntity } from '../database/entities';
import {
  CreatePlayerDto,
  ListPlayersDto,
  PlayerSessionsDto,
  RecordStatus,
  UpdatePlayerDto,
} from './players.dto';

// Los resultados deportivos solo son históricos cuando la competencia ya terminó.
// Esto evita contar partidos residuales de borradores o jornadas canceladas.
const COMPETITIVE_SESSION_STATUSES = `('SETTLEMENT','FINISHED')`;

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(PlayerEntity) private readonly repo: Repository<PlayerEntity>,
    private readonly dataSource: DataSource = null as never,
  ) {}

  async profile(id: string) {
    const player = await this.get(id);
    const [stats] = await this.dataSource.query(
      `SELECT count(*)::int AS "totalParticipations", count(*) FILTER(WHERE gs.status='FINISHED')::int AS "completedSessions", count(*) FILTER(WHERE gs.status IN ('DRAFT','TEAMS_CREATED','IN_PROGRESS','SETTLEMENT'))::int AS "activeSessions", count(*) FILTER(WHERE gs.status='CANCELLED')::int AS "cancelledSessions", min(gs.date) AS "firstParticipationDate", max(gs.date) AS "lastParticipationDate", coalesce(sum(sp.amount_due),0)::int AS "totalDue", coalesce(sum(sp.amount_paid),0)::int AS "totalPaid", coalesce(sum(greatest(sp.amount_due-sp.amount_paid,0)),0)::int AS "totalPending", coalesce(sum(greatest(sp.amount_paid-sp.amount_due,0)),0)::int AS "totalCredit", count(*) FILTER(WHERE sp.amount_due>0 AND sp.amount_paid=sp.amount_due)::int AS "sessionsPaid", count(*) FILTER(WHERE sp.amount_paid>0 AND sp.amount_paid<sp.amount_due)::int AS "sessionsPartiallyPaid", count(*) FILTER(WHERE sp.amount_due>0 AND sp.amount_paid=0)::int AS "sessionsPending", coalesce(sum(sp.amount_paid) FILTER(WHERE sp.payment_method='CASH'),0)::int AS "cashPaid", coalesce(sum(sp.amount_paid) FILTER(WHERE sp.payment_method='TRANSFER'),0)::int AS "transferPaid", round(avg(sp.level_snapshot)::numeric,2)::float AS "averageLevel", min(sp.level_snapshot)::int AS "minimumLevel", max(sp.level_snapshot)::int AS "maximumLevel", (array_agg(sp.level_snapshot ORDER BY gs.date DESC,sp.created_at DESC))[1]::int AS "latestLevel" FROM session_players sp JOIN game_sessions gs ON gs.id=sp.session_id WHERE sp.player_id=$1`,
      [id],
    );
    const [competition] = await this.dataSource.query(
      `SELECT count(m.id)::int AS "matchesPlayed", count(m.id) FILTER(WHERE m.winner_team_id=t.id)::int AS "matchesWon", count(m.id) FILTER(WHERE m.loser_team_id=t.id)::int AS "matchesLost", coalesce(sum(CASE WHEN m.team_a_id=t.id THEN m.team_a_score ELSE m.team_b_score END),0)::int AS "pointsFor", coalesce(sum(CASE WHEN m.team_a_id=t.id THEN m.team_b_score ELSE m.team_a_score END),0)::int AS "pointsAgainst" FROM session_players sp JOIN game_sessions gs ON gs.id=sp.session_id LEFT JOIN team_players tp ON tp.session_player_id=sp.id LEFT JOIN teams t ON t.id=tp.team_id LEFT JOIN matches m ON m.status='FINISHED' AND gs.status IN ${COMPETITIVE_SESSION_STATUSES} AND (m.team_a_id=t.id OR m.team_b_id=t.id) WHERE sp.player_id=$1`,
      [id],
    );
    const [champ] = await this.dataSource.query(
      `SELECT count(*)::int count FROM session_players sp JOIN team_players tp ON tp.session_player_id=sp.id JOIN teams t ON t.id=tp.team_id JOIN game_sessions gs ON gs.champion_team_id=t.id WHERE sp.player_id=$1 AND gs.status IN ('SETTLEMENT','FINISHED')`,
      [id],
    );
    competition.winRate = competition.matchesPlayed
      ? Math.round((competition.matchesWon * 10000) / competition.matchesPlayed) / 100
      : 0;
    competition.pointDifference = competition.pointsFor - competition.pointsAgainst;
    competition.championships = champ.count;
    const recent = await this.sessionsHistory(id, { page: 1, limit: 5, sortOrder: 'DESC' });
    return {
      player,
      participation: stats,
      competition,
      finances: stats,
      historicalLevel: {
        currentLevel: player.defaultLevel,
        latestLevel: stats.latestLevel,
        averageLevel: stats.averageLevel,
        minimumLevel: stats.minimumLevel,
        maximumLevel: stats.maximumLevel,
      },
      recentParticipations: recent.items,
      hasDebt: stats.totalPending > 0,
    };
  }

  async sessionsHistory(id: string, query: PlayerSessionsDto) {
    await this.get(id);
    const params: unknown[] = [id];
    const where = ['sp.player_id=$1'];
    const add = (condition: string, value: unknown) => {
      params.push(value);
      where.push(condition.replace('?', `$${params.length}`));
    };
    if (query.status) add('gs.status=?', query.status);
    if (query.dateFrom) add('gs.date>=?', query.dateFrom);
    if (query.dateTo) add('gs.date<=?', query.dateTo);
    const payment = `CASE WHEN sp.amount_due=0 THEN 'NOT_REQUIRED' WHEN sp.amount_paid=0 THEN 'PENDING' WHEN sp.amount_paid<sp.amount_due THEN 'PARTIAL' WHEN sp.amount_paid=sp.amount_due THEN 'PAID' ELSE 'CREDIT' END`;
    if (query.paymentStatus) add(`${payment}=?`, query.paymentStatus);
    const [count] = await this.dataSource.query(
      `SELECT count(*)::int count FROM session_players sp JOIN game_sessions gs ON gs.id=sp.session_id WHERE ${where.join(' AND ')}`,
      params,
    );
    params.push(query.limit, (query.page - 1) * query.limit);
    const items = await this.dataSource.query(
      `SELECT gs.id,gs.date,gs.venue_name_snapshot AS "venueNameSnapshot",gs.status,sp.player_name_snapshot AS "playerNameSnapshot",sp.level_snapshot AS "levelSnapshot",t.id AS "teamId",t.name AS "teamName",sp.court_amount AS "courtAmount",sp.gatorade_amount AS "gatoradeAmount",sp.amount_due AS "amountDue",sp.amount_paid AS "amountPaid",greatest(sp.amount_due-sp.amount_paid,0)::int pending,greatest(sp.amount_paid-sp.amount_due,0)::int credit,sp.payment_method AS "paymentMethod",${payment} AS "paymentStatus",(gs.champion_team_id=t.id) champion,count(m.id)::int AS "matchesPlayed",count(m.id) FILTER(WHERE m.winner_team_id=t.id)::int wins,count(m.id) FILTER(WHERE m.loser_team_id=t.id)::int losses FROM session_players sp JOIN game_sessions gs ON gs.id=sp.session_id LEFT JOIN team_players tp ON tp.session_player_id=sp.id LEFT JOIN teams t ON t.id=tp.team_id LEFT JOIN matches m ON m.status='FINISHED' AND gs.status IN ${COMPETITIVE_SESSION_STATUSES} AND (m.team_a_id=t.id OR m.team_b_id=t.id) WHERE ${where.join(' AND ')} GROUP BY gs.id,sp.id,t.id ORDER BY gs.date ${query.sortOrder} LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      items,
      page: query.page,
      limit: query.limit,
      totalItems: count.count,
      totalPages: Math.ceil(count.count / query.limit),
    };
  }
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
