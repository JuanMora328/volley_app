import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  calculateStandings,
  derivePaymentStatus,
  distributeIntegerAmount,
  GameSessionStatus,
  MatchStatus,
  TeamDto,
} from '@volleyflow/shared';
import { DataSource, EntityManager, In } from 'typeorm';
import {
  GameSessionEntity,
  MatchEntity,
  SessionPlayerEntity,
  TeamEntity,
  TeamPlayerEntity,
} from '../database/entities';
import { FinishDto, PaymentDto, SettlementDto } from './settlements.dto';

@Injectable()
export class SettlementsService {
  constructor(private readonly db: DataSource) {}

  async setup(id: string) {
    const data = await this.load(this.db.manager, id);
    this.ensureCanPreview(data.session);
    const standings = this.standings(data.teams, data.matches);
    const first = standings[0];
    const second = standings[1];
    const tied =
      !!first &&
      !!second &&
      first.points === second.points &&
      first.difference === second.difference &&
      first.pointsFor === second.pointsFor;
    return {
      session: {
        ...this.sessionInfo(data.session),
        courtPrice: data.session.courtPrice,
        gatoradePrice: data.session.gatoradePrice,
      },
      teams: data.teams.map((team) => ({
        id: team.id,
        name: team.name,
        players: data.links
          .filter((link) => link.team.id === team.id)
          .map((link) => ({
            id: link.sessionPlayer.id,
            name: link.sessionPlayer.playerNameSnapshot,
          })),
      })),
      participants: data.players.map((player) =>
        this.playerBase(player, data.links, data.session.championTeam?.id),
      ),
      standings,
      suggestion: {
        championTeamId: tied ? null : (first?.team.id ?? null),
        requiresManualSelection: !first || tied || data.matches.length === 0,
        reason:
          data.matches.length === 0
            ? 'No hay partidos: selecciona el campeón manualmente.'
            : tied
              ? 'Existe empate deportivo; se requiere selección manual.'
              : 'Líder por puntos, diferencia y puntos a favor.',
      },
    };
  }

  async preview(id: string, dto: SettlementDto) {
    const data = await this.load(this.db.manager, id);
    this.ensureCanPreview(data.session);
    return this.calculate(data, dto);
  }

  async confirm(id: string, dto: SettlementDto) {
    return this.db.transaction(async (manager) => {
      const data = await this.load(manager, id, true);
      this.ensureCanPreview(data.session);
      const result = this.calculate(data, dto);
      data.session.courtPrice = dto.courtPrice;
      data.session.gatoradePrice = dto.gatoradePrice;
      data.session.championTeam = data.teams.find((team) => team.id === dto.championTeamId)!;
      data.session.settledAt = new Date();
      data.session.status = GameSessionStatus.SETTLEMENT;
      for (const player of data.players) {
        const item = result.participants.find((candidate) => candidate.id === player.id)!;
        player.includedInCourtSplit = item.includedInCourtSplit;
        player.includedInGatoradeSplit = item.includedInGatoradeSplit;
        player.courtAmount = item.courtAmount;
        player.gatoradeAmount = item.gatoradeAmount;
        player.amountDue = item.amountDue;
        if (player.amountPaid === 0) player.paidAt = null;
      }
      await manager.save(data.players);
      await manager.save(data.session);
      return { ...result, status: data.session.status, settledAt: data.session.settledAt };
    });
  }

  async payments(id: string) {
    const data = await this.load(this.db.manager, id);
    if (![GameSessionStatus.SETTLEMENT, GameSessionStatus.FINISHED].includes(data.session.status))
      throw new ConflictException('La jornada aún no tiene liquidación confirmada');
    return this.paymentSummary(data);
  }

  async payment(id: string, playerId: string, dto: PaymentDto) {
    return this.db.transaction(async (manager) => {
      const data = await this.load(manager, id, true);
      if (![GameSessionStatus.SETTLEMENT, GameSessionStatus.FINISHED].includes(data.session.status))
        throw new ConflictException('No se pueden registrar pagos antes de liquidar');
      const player = data.players.find((item) => item.id === playerId);
      if (!player) throw new NotFoundException('Participante no encontrado en la jornada');
      if (dto.amountPaid > 0 && !dto.paymentMethod)
        throw new BadRequestException('Selecciona efectivo o transferencia');
      player.amountPaid = dto.amountPaid;
      player.paymentMethod = dto.amountPaid === 0 ? null : dto.paymentMethod!;
      player.paidAt = dto.amountPaid === 0 ? null : new Date();
      await manager.save(player);
      return this.playerFinancial(player, data.links, data.session.championTeam?.id);
    });
  }

  async finish(id: string, dto: FinishDto) {
    return this.db.transaction(async (manager) => {
      const data = await this.load(manager, id, true);
      if (data.session.status === GameSessionStatus.FINISHED) return this.paymentSummary(data);
      if (
        data.session.status !== GameSessionStatus.SETTLEMENT ||
        !data.session.championTeam ||
        !data.session.settledAt
      )
        throw new ConflictException('La jornada debe tener una liquidación confirmada');
      if (data.matches.some((match) => match.status === MatchStatus.IN_PROGRESS))
        throw new ConflictException('Finaliza el partido activo antes de cerrar');
      const expected = data.session.courtPrice + data.session.gatoradePrice;
      if (data.players.reduce((sum, player) => sum + player.amountDue, 0) !== expected)
        throw new ConflictException('La distribución financiera no coincide con los costos');
      const pending = data.players.reduce(
        (sum, player) => sum + Math.max(player.amountDue - player.amountPaid, 0),
        0,
      );
      if (pending > 0 && !dto.confirmPendingPayments)
        throw new ConflictException(
          'Hay saldos pendientes. Confirma explícitamente para finalizar',
        );
      data.session.status = GameSessionStatus.FINISHED;
      data.session.finishedAt = new Date();
      await manager.save(data.session);
      return {
        ...(await this.paymentSummary(data)),
        status: data.session.status,
        finishedAt: data.session.finishedAt,
      };
    });
  }

  async summary(id: string) {
    const data = await this.load(this.db.manager, id);
    if (![GameSessionStatus.SETTLEMENT, GameSessionStatus.FINISHED].includes(data.session.status))
      throw new ConflictException('La jornada todavía no está liquidada');
    const finances = this.paymentSummary(data);
    return {
      ...finances,
      session: this.sessionInfo(data.session),
      championMembers: data.links
        .filter((link) => link.team.id === data.session.championTeam?.id)
        .map((link) => link.sessionPlayer.playerNameSnapshot),
      standings: this.standings(data.teams, data.matches),
      matchCount: data.matches.length,
      results: data.matches
        .filter((match) => match.status === MatchStatus.FINISHED)
        .map((match) => ({
          id: match.id,
          sequence: match.sequence,
          teamA: match.teamA.name,
          teamB: match.teamB.name,
          teamAScore: match.teamAScore,
          teamBScore: match.teamBScore,
        })),
      settledAt: data.session.settledAt,
      finishedAt: data.session.finishedAt,
    };
  }

  private calculate(data: Awaited<ReturnType<SettlementsService['load']>>, dto: SettlementDto) {
    const champion = data.teams.find((team) => team.id === dto.championTeamId);
    if (!champion) throw new BadRequestException('El campeón no pertenece a la jornada');
    const championIds = new Set(
      data.links
        .filter((link) => link.team.id === champion.id)
        .map((link) => link.sessionPlayer.id),
    );
    if (!championIds.size)
      throw new BadRequestException('El equipo campeón no tiene participantes');
    const allIds = new Set(data.players.map((player) => player.id));
    const courtIds =
      dto.courtParticipantIds ??
      data.players.filter((player) => player.includedInCourtSplit).map((player) => player.id);
    const gatoradeIds =
      dto.gatoradeParticipantIds ??
      data.players
        .filter((player) => player.includedInGatoradeSplit && !championIds.has(player.id))
        .map((player) => player.id);
    if ([...courtIds, ...gatoradeIds].some((participantId) => !allIds.has(participantId)))
      throw new BadRequestException('La selección contiene participantes externos');
    if (gatoradeIds.some((participantId) => championIds.has(participantId)))
      throw new BadRequestException('El campeón no paga Gatorades');
    let court: Record<string, number>;
    let gatorade: Record<string, number>;
    try {
      court = distributeIntegerAmount(dto.courtPrice, courtIds);
      gatorade = distributeIntegerAmount(dto.gatoradePrice, gatoradeIds);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    const participants = data.players.map((player) => {
      const courtAmount = court[player.id] ?? 0;
      const gatoradeAmount = gatorade[player.id] ?? 0;
      const amountDue = courtAmount + gatoradeAmount;
      return {
        ...this.playerBase(player, data.links, champion.id),
        includedInCourtSplit: courtIds.includes(player.id),
        includedInGatoradeSplit: gatoradeIds.includes(player.id),
        courtAmount,
        gatoradeAmount,
        amountDue,
        amountPaid: player.amountPaid,
        pendingAmount: Math.max(amountDue - player.amountPaid, 0),
        creditAmount: Math.max(player.amountPaid - amountDue, 0),
        paymentStatus: derivePaymentStatus(amountDue, player.amountPaid),
      };
    });
    const distributed = participants.reduce((sum, player) => sum + player.amountDue, 0);
    return {
      champion: { id: champion.id, name: champion.name },
      courtPrice: dto.courtPrice,
      gatoradePrice: dto.gatoradePrice,
      expectedTotal: dto.courtPrice + dto.gatoradePrice,
      distributedTotal: distributed,
      validationMatches: distributed === dto.courtPrice + dto.gatoradePrice,
      courtPayerCount: courtIds.length,
      gatoradePayerCount: gatoradeIds.length,
      participants,
      warnings: participants.filter((player) => player.creditAmount > 0).length
        ? ['Hay pagos que generan crédito después del recálculo.']
        : [],
    };
  }

  private paymentSummary(data: Awaited<ReturnType<SettlementsService['load']>>) {
    const participants = data.players.map((player) =>
      this.playerFinancial(player, data.links, data.session.championTeam?.id),
    );
    const counts = { pending: 0, partial: 0, paid: 0, notRequired: 0 };
    participants.forEach((player) => {
      const key =
        player.paymentStatus === 'NOT_REQUIRED'
          ? 'notRequired'
          : (player.paymentStatus.toLowerCase() as 'pending' | 'partial' | 'paid');
      counts[key]++;
    });
    return {
      session: this.sessionInfo(data.session),
      champion: data.session.championTeam
        ? { id: data.session.championTeam.id, name: data.session.championTeam.name }
        : null,
      courtPrice: data.session.courtPrice,
      gatoradePrice: data.session.gatoradePrice,
      expectedTotal: participants.reduce((sum, player) => sum + player.amountDue, 0),
      paidTotal: participants.reduce(
        (sum, player) => sum + Math.min(player.amountPaid, player.amountDue),
        0,
      ),
      pendingTotal: participants.reduce((sum, player) => sum + player.pendingAmount, 0),
      creditTotal: participants.reduce((sum, player) => sum + player.creditAmount, 0),
      counts,
      participants,
    };
  }
  private playerFinancial(
    player: SessionPlayerEntity,
    links: TeamPlayerEntity[],
    championId?: string,
  ) {
    return {
      ...this.playerBase(player, links, championId),
      includedInCourtSplit: player.includedInCourtSplit,
      includedInGatoradeSplit: player.includedInGatoradeSplit,
      courtAmount: player.courtAmount,
      gatoradeAmount: player.gatoradeAmount,
      amountDue: player.amountDue,
      amountPaid: player.amountPaid,
      pendingAmount: Math.max(player.amountDue - player.amountPaid, 0),
      creditAmount: Math.max(player.amountPaid - player.amountDue, 0),
      paymentStatus: derivePaymentStatus(player.amountDue, player.amountPaid),
      paymentMethod: player.paymentMethod,
      paidAt: player.paidAt,
    };
  }
  private playerBase(player: SessionPlayerEntity, links: TeamPlayerEntity[], championId?: string) {
    const team = links.find((link) => link.sessionPlayer.id === player.id)?.team;
    return {
      id: player.id,
      name: player.playerNameSnapshot,
      team: team ? { id: team.id, name: team.name } : null,
      isChampion: team?.id === championId,
    };
  }
  private sessionInfo(session: GameSessionEntity) {
    return {
      id: session.id,
      status: session.status,
      date: session.date,
      venueName: session.venueNameSnapshot,
      settledAt: session.settledAt,
      finishedAt: session.finishedAt,
    };
  }
  private standings(teams: TeamEntity[], matches: MatchEntity[]) {
    return calculateStandings(
      teams as unknown as TeamDto[],
      matches
        .filter((match) => match.status === MatchStatus.FINISHED)
        .map((match) => ({
          id: match.id,
          sequence: match.sequence,
          teamAId: match.teamA.id,
          teamBId: match.teamB.id,
          teamAScore: match.teamAScore,
          teamBScore: match.teamBScore,
          targetScore: match.targetScore,
          winnerTeamId: match.winnerTeam?.id ?? null,
          loserTeamId: match.loserTeam?.id ?? null,
        })),
    );
  }
  private ensureCanPreview(session: GameSessionEntity) {
    if (session.status === GameSessionStatus.CANCELLED)
      throw new ConflictException('Una jornada cancelada no puede liquidarse');
    if (session.status === GameSessionStatus.FINISHED)
      throw new ConflictException('Una jornada finalizada no puede recalcularse');
    if (
      ![
        GameSessionStatus.TEAMS_CREATED,
        GameSessionStatus.IN_PROGRESS,
        GameSessionStatus.SETTLEMENT,
      ].includes(session.status)
    )
      throw new ConflictException('Confirma los equipos antes de liquidar');
  }
  private async load(manager: EntityManager, id: string, lock = false) {
    const session = await manager.findOne(GameSessionEntity, {
      where: { id },
      relations: { championTeam: true },
      ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!session) throw new NotFoundException('Jornada no encontrada');
    const teams = await manager.find(TeamEntity, {
      where: { session: { id } },
      order: { name: 'ASC' },
    });
    const players = await manager.find(SessionPlayerEntity, {
      where: { session: { id } },
      order: { playerNameSnapshot: 'ASC' },
    });
    if (!teams.length || !players.length || teams.some((team) => !team.confirmedAt))
      throw new ConflictException('Se requieren equipos confirmados y participantes');
    const links = await manager.find(TeamPlayerEntity, {
      where: { team: { id: In(teams.map((team) => team.id)) } } as never,
      relations: { team: true, sessionPlayer: true },
    });
    const matches = await manager.find(MatchEntity, {
      where: { session: { id } },
      relations: { teamA: true, teamB: true, winnerTeam: true, loserTeam: true },
      order: { sequence: 'ASC' },
    });
    if (matches.some((match) => match.status === MatchStatus.IN_PROGRESS))
      throw new ConflictException('Finaliza el partido activo antes de liquidar');
    return { session, teams, players, links, matches };
  }
}
