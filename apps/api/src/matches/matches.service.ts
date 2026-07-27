import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  calculateRotation,
  calculateStandings,
  GameSessionStatus,
  MatchStatus,
  TeamDto,
} from '@volleyflow/shared';
import { DataSource, EntityManager } from 'typeorm';
import { GameSessionEntity, MatchEntity, TeamEntity, TeamPlayerEntity } from '../database/entities';
import { MatchListDto, ResultDto } from './matches.dto';

@Injectable()
export class MatchesService {
  constructor(private readonly db: DataSource) {}
  async draw(id: string, seed?: string | number) {
    return this.db.transaction(async (m) => {
      const session = await this.session(m, id, true);
      this.playable(session);
      if (session.status !== GameSessionStatus.TEAMS_CREATED)
        throw new BadRequestException('El sorteo solo está disponible con equipos confirmados');
      if (await m.count(MatchEntity, { where: { session: { id } } }))
        throw new ConflictException('No se puede repetir el sorteo después de iniciar');
      const teams = await m.find(TeamEntity, {
        where: { session: { id } },
        order: { createdAt: 'ASC' },
      });
      if (teams.length < 2 || teams.some((t) => !t.confirmedAt))
        throw new BadRequestException('Se requieren al menos dos equipos confirmados');
      const random = this.random(seed);
      const shuffled = [...teams];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      shuffled.forEach((team, position) => (team.initialRotationPosition = position));
      await m.save(shuffled);
      return this.rotationWith(m, session);
    });
  }
  async rotation(id: string) {
    const m = this.db.manager;
    const session = await this.session(m, id);
    return this.rotationWith(m, session);
  }
  async start(id: string) {
    return this.db.transaction(async (m) => {
      const session = await this.session(m, id, true);
      this.playable(session);
      if (
        ![GameSessionStatus.TEAMS_CREATED, GameSessionStatus.IN_PROGRESS].includes(session.status)
      )
        throw new BadRequestException('La jornada no admite partidos');
      if (
        await m.count(MatchEntity, { where: { session: { id }, status: MatchStatus.IN_PROGRESS } })
      )
        throw new ConflictException('Ya existe un partido activo');
      const state = await this.rotationWith(m, session);
      if (!state.drawn) throw new BadRequestException('Primero debe realizarse el sorteo');
      const match = await m.save(
        MatchEntity,
        m.create(MatchEntity, {
          session,
          sequence: state.nextSequence,
          teamA: state.courtTeam,
          teamB: state.challengerTeam,
          targetScore: session.currentTargetScore,
          status: MatchStatus.IN_PROGRESS,
          startedAt: new Date(),
        }),
      );
      session.status = GameSessionStatus.IN_PROGRESS;
      await m.save(session);
      return { match, rotation: await this.rotationWith(m, session) };
    });
  }
  async result(id: string, matchId: string, dto: ResultDto) {
    return this.db.transaction(async (m) => {
      const session = await this.session(m, id, true);
      this.playable(session);
      const match = await m.findOne(MatchEntity, {
        where: { id: matchId, session: { id } },
        relations: { teamA: true, teamB: true },
      });
      if (!match) throw new NotFoundException('Partido no encontrado');
      if (match.status !== MatchStatus.IN_PROGRESS)
        throw new ConflictException('El partido ya terminó');
      if (dto.teamAScore === dto.teamBScore)
        throw new BadRequestException('El resultado no puede ser empate');
      if (Math.max(dto.teamAScore, dto.teamBScore) < match.targetScore)
        throw new BadRequestException('Un equipo debe alcanzar el puntaje objetivo');
      match.teamAScore = dto.teamAScore;
      match.teamBScore = dto.teamBScore;
      match.winnerTeam = dto.teamAScore > dto.teamBScore ? match.teamA : match.teamB;
      match.loserTeam = dto.teamAScore > dto.teamBScore ? match.teamB : match.teamA;
      match.status = MatchStatus.FINISHED;
      match.finishedAt = new Date();
      await m.save(match);
      return { match, rotation: await this.rotationWith(m, session) };
    });
  }
  async target(id: string, score: number) {
    return this.db.transaction(async (m) => {
      const s = await this.session(m, id, true);
      this.playable(s);
      s.currentTargetScore = score;
      await m.save(s);
      return { currentTargetScore: score, message: 'Este cambio se aplicará al siguiente partido' };
    });
  }
  async list(id: string, q: MatchListDto) {
    await this.session(this.db.manager, id);
    const [items, total] = await this.db.getRepository(MatchEntity).findAndCount({
      where: { session: { id }, ...(q.status ? { status: q.status } : {}) },
      relations: { teamA: true, teamB: true, winnerTeam: true, loserTeam: true },
      order: { sequence: q.order },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    });
    const latest = items
      .filter((x) => x.status === MatchStatus.FINISHED)
      .sort((a, b) => b.sequence - a.sequence)[0]?.id;
    return {
      items: items.map((x) => ({ ...x, canUndo: x.id === latest })),
      meta: { page: q.page, limit: q.limit, total },
    };
  }
  async standings(id: string) {
    const state = await this.data(id);
    return calculateStandings(state.teams as unknown as TeamDto[], state.finished.map(this.dto));
  }
  async undo(id: string) {
    return this.db.transaction(async (m) => {
      const session = await this.session(m, id, true);
      this.playable(session);
      const active = await m.find(MatchEntity, {
        where: { session: { id }, status: MatchStatus.IN_PROGRESS },
      });
      if (active.length) await m.remove(active);
      const latest = await m.findOne(MatchEntity, {
        where: { session: { id }, status: MatchStatus.FINISHED },
        order: { sequence: 'DESC' },
      });
      if (!latest) throw new NotFoundException('No existe un resultado para deshacer');
      await m.remove(latest);
      if (
        !(await m.count(MatchEntity, { where: { session: { id }, status: MatchStatus.FINISHED } }))
      ) {
        session.status = GameSessionStatus.TEAMS_CREATED;
        await m.save(session);
      }
      return {
        rotation: await this.rotationWith(m, session),
        standings: await this.standingsWith(m, id),
      };
    });
  }
  private async rotationWith(m: EntityManager, session: GameSessionEntity) {
    const teams = await m.find(TeamEntity, {
      where: { session: { id: session.id } },
      order: { initialRotationPosition: 'ASC' },
      relations: {},
    });
    const drawn = teams.length >= 2 && teams.every((t) => t.initialRotationPosition !== null);
    const matches = await m.find(MatchEntity, {
      where: { session: { id: session.id } },
      relations: { teamA: true, teamB: true, winnerTeam: true, loserTeam: true },
      order: { sequence: 'ASC' },
    });
    const active = matches.find((x) => x.status === MatchStatus.IN_PROGRESS);
    if (!drawn)
      return {
        drawn: false,
        activeMatch: active ?? null,
        currentTargetScore: session.currentTargetScore,
        canDraw: matches.length === 0,
      };
    const finished = matches.filter((x) => x.status === MatchStatus.FINISHED);
    const r = calculateRotation(teams as unknown as TeamDto[], finished.map(this.dto));
    return {
      drawn: true,
      courtTeam: r.teamA,
      challengerTeam: r.teamB,
      waitingQueue: r.queue,
      nextTeam: r.nextTeam,
      nextSequence: r.nextSequence,
      activeMatch: active ?? null,
      hasActiveMatch: !!active,
      canStartMatch: !active,
      canUndoLastResult: finished.length > 0,
      currentTargetScore: session.currentTargetScore,
      canRedraw: matches.length === 0,
    };
  }
  private dto = (x: MatchEntity) => ({
    id: x.id,
    sequence: x.sequence,
    teamAId: x.teamA.id,
    teamBId: x.teamB.id,
    teamAScore: x.teamAScore,
    teamBScore: x.teamBScore,
    targetScore: x.targetScore,
    winnerTeamId: x.winnerTeam?.id ?? null,
    loserTeamId: x.loserTeam?.id ?? null,
    status: x.status,
  });
  private async data(id: string) {
    const m = this.db.manager;
    await this.session(m, id);
    const teams = await m.find(TeamEntity, { where: { session: { id } } });
    const finished = await m.find(MatchEntity, {
      where: { session: { id }, status: MatchStatus.FINISHED },
      relations: { teamA: true, teamB: true, winnerTeam: true, loserTeam: true },
    });
    return { teams, finished };
  }
  private async standingsWith(m: EntityManager, id: string) {
    const teams = await m.find(TeamEntity, { where: { session: { id } } });
    const matches = await m.find(MatchEntity, {
      where: { session: { id }, status: MatchStatus.FINISHED },
      relations: { teamA: true, teamB: true, winnerTeam: true, loserTeam: true },
    });
    return calculateStandings(teams as unknown as TeamDto[], matches.map(this.dto));
  }
  private random(seed?: string | number) {
    if (seed === undefined) return Math.random;
    let s = [...String(seed)].reduce(
      (a, c) => Math.imul(a ^ c.charCodeAt(0), 16777619),
      2166136261,
    );
    return () => {
      s += 0x6d2b79f5;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  private playable(s: GameSessionEntity) {
    if (s.status === GameSessionStatus.CANCELLED)
      throw new ConflictException('La jornada cancelada es de solo lectura');
  }
  private async session(m: EntityManager, id: string, lock = false) {
    const s = await m.findOne(GameSessionEntity, {
      where: { id },
      ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!s) throw new NotFoundException('Jornada no encontrada');
    return s;
  }
}
