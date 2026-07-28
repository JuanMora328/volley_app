export enum UserRole {
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
}
export enum GameSessionStatus {
  DRAFT = 'DRAFT',
  TEAMS_CREATED = 'TEAMS_CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  SETTLEMENT = 'SETTLEMENT',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}
export enum MatchStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}
export enum PaymentMethod {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
}
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'NOT_REQUIRED' | 'CREDIT';
export interface PlayerDto {
  id: string;
  name: string;
  defaultLevel: number;
  notes?: string | null;
  active: boolean;
}
export interface VenueDto {
  id: string;
  name: string;
  address?: string | null;
  defaultCourtPrice: number;
  defaultGatoradePrice: number;
  active: boolean;
}
export interface SessionPlayerDto {
  id: string;
  playerId: string;
  playerNameSnapshot: string;
  levelSnapshot: number;
  amountDue: number;
  amountPaid: number;
}
export interface TeamDto {
  id: string;
  name: string;
  color?: string | null;
  players: SessionPlayerDto[];
  initialRotationPosition?: number | null;
}
export interface MatchDto {
  id: string;
  sequence: number;
  teamAId: string;
  teamBId: string;
  teamAScore: number;
  teamBScore: number;
  targetScore: number;
  winnerTeamId: string | null;
  loserTeamId: string | null;
  status?: MatchStatus;
}
export interface BalanceMetrics {
  maxAverageDiff: number;
  averageVariance: number;
  sizeDiff: number;
  normalizedStrengthDiff: number;
  score: number;
  label: 'EXCELENTE' | 'BUENO' | 'MEJORABLE';
}
export function distributeIntegerAmount(
  total: number,
  participantIds: string[],
): Record<string, number> {
  if (!Number.isInteger(total) || total < 0)
    throw new Error('El total debe ser un entero no negativo');
  if (participantIds.length === 0) {
    if (total === 0) return {};
    throw new Error('Debe existir al menos un participante');
  }
  const sorted = [...participantIds].sort();
  if (new Set(sorted).size !== sorted.length)
    throw new Error('No se permiten participantes duplicados');
  const base = Math.floor(total / sorted.length);
  const remainder = total % sorted.length;
  return Object.fromEntries(sorted.map((id, index) => [id, base + (index < remainder ? 1 : 0)]));
}

export function calculateCourtTotal(hourlyPrice: number, durationMinutes: number): number {
  if (!Number.isInteger(hourlyPrice) || hourlyPrice < 0)
    throw new Error('La tarifa por hora debe ser un entero no negativo');
  if (!Number.isInteger(durationMinutes) || durationMinutes < 30 || durationMinutes % 30 !== 0)
    throw new Error('La duración debe estar en intervalos de 30 minutos');
  const product = hourlyPrice * durationMinutes;
  if (!Number.isSafeInteger(product) || product % 60 !== 0)
    throw new Error('La tarifa no permite un total exacto para esa duración');
  return product / 60;
}

export function calculateGatoradeTotal(unitPrice: number, winnerCount: number): number {
  if (!Number.isSafeInteger(unitPrice) || unitPrice < 0)
    throw new Error('El precio unitario debe ser un entero no negativo');
  if (!Number.isSafeInteger(winnerCount) || winnerCount <= 0)
    throw new Error('La cantidad de ganadores debe ser un entero positivo');
  const total = unitPrice * winnerCount;
  if (!Number.isSafeInteger(total)) throw new Error('El total de Gatorades no es un entero seguro');
  return total;
}
export interface TeamCandidatePlayer {
  id: string;
  level: number;
  name?: string;
}
export interface GeneratedTeam {
  name: string;
  players: TeamCandidatePlayer[];
  metrics?: BalanceMetrics;
}
function seededRandom(seed?: string | number) {
  if (seed === undefined) return Math.random;
  let state = String(seed)
    .split('')
    .reduce((value, character) => Math.imul(value ^ character.charCodeAt(0), 16777619), 2166136261);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(items: T[], random: () => number) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
export function calculateBalanceMetrics(teams: GeneratedTeam[]): BalanceMetrics {
  const sizes = teams.map((t) => t.players.length);
  const sums = teams.map((t) => t.players.reduce((a, p) => a + p.level, 0));
  const avgs = sums.map((s, i) => s / (sizes[i] || 1));
  const mean = avgs.reduce((a, b) => a + b, 0) / avgs.length;
  const maxAverageDiff = Math.max(...avgs) - Math.min(...avgs);
  const averageVariance = avgs.reduce((a, b) => a + (b - mean) ** 2, 0) / avgs.length;
  const sizeDiff = Math.max(...sizes) - Math.min(...sizes);
  const normalized = sums.map((s, i) => s / Math.max(1, sizes[i]));
  const normalizedStrengthDiff = Math.max(...normalized) - Math.min(...normalized);
  const score = maxAverageDiff * 4 + averageVariance * 2 + sizeDiff * 3 + normalizedStrengthDiff;
  const label = score <= 0.35 ? 'EXCELENTE' : score <= 1.5 ? 'BUENO' : 'MEJORABLE';
  return { maxAverageDiff, averageVariance, sizeDiff, normalizedStrengthDiff, score, label };
}
export function generateBalancedTeams(
  players: TeamCandidatePlayer[],
  teamCount: number,
  options: number | { iterations?: number; seed?: string | number } = 300,
): { teams: GeneratedTeam[]; metrics: BalanceMetrics } {
  if (teamCount < 2) throw new Error('Se requieren al menos dos equipos');
  if (players.length < teamCount) throw new Error('Debe haber al menos un jugador por equipo');
  if (
    players.some(
      (player) => !Number.isInteger(player.level) || player.level < 1 || player.level > 5,
    )
  )
    throw new Error('Los niveles deben estar entre 1 y 5');
  if (new Set(players.map((player) => player.id)).size !== players.length)
    throw new Error('No se permiten participantes duplicados');
  const settings = typeof options === 'number' ? { iterations: options } : options;
  const random = seededRandom(settings.seed);
  const capacities = Array.from(
    { length: teamCount },
    (_, index) =>
      Math.floor(players.length / teamCount) + (index < players.length % teamCount ? 1 : 0),
  );
  const candidates: { teams: GeneratedTeam[]; metrics: BalanceMetrics; key: string }[] = [];
  for (let i = 0; i < Math.max(300, settings.iterations ?? 300); i++) {
    const levelGroups = new Map<number, TeamCandidatePlayer[]>();
    players.forEach((player) =>
      levelGroups.set(player.level, [...(levelGroups.get(player.level) ?? []), player]),
    );
    const ordered = [...levelGroups.entries()]
      .sort((a, b) => b[0] - a[0])
      .flatMap(([, group]) => shuffle(group, random));
    const teams = Array.from({ length: teamCount }, (_, idx) => ({
      name: `Equipo ${String.fromCharCode(65 + idx)}`,
      players: [] as TeamCandidatePlayer[],
    }));
    const shuffledCapacities = shuffle(capacities, random);
    for (const player of ordered) {
      const available = teams.filter(
        (team, index) => team.players.length < shuffledCapacities[index],
      );
      const minimum = Math.min(
        ...available.map(
          (team) =>
            team.players.reduce((sum, item) => sum + item.level, 0) /
            Math.max(1, team.players.length),
        ),
      );
      const best = available.filter(
        (team) =>
          Math.abs(
            team.players.reduce((sum, item) => sum + item.level, 0) /
              Math.max(1, team.players.length) -
              minimum,
          ) < 0.00001,
      );
      best[Math.floor(random() * best.length)].players.push(player);
    }
    // Intercambios locales: conserva tamaños y acepta solo mejoras.
    let improved = true;
    while (improved) {
      improved = false;
      const baseline = calculateBalanceMetrics(teams).score;
      outer: for (let a = 0; a < teams.length; a++)
        for (let b = a + 1; b < teams.length; b++)
          for (let x = 0; x < teams[a].players.length; x++)
            for (let y = 0; y < teams[b].players.length; y++) {
              [teams[a].players[x], teams[b].players[y]] = [
                teams[b].players[y],
                teams[a].players[x],
              ];
              if (calculateBalanceMetrics(teams).score + 1e-9 < baseline) {
                improved = true;
                break outer;
              }
              [teams[a].players[x], teams[b].players[y]] = [
                teams[b].players[y],
                teams[a].players[x],
              ];
            }
    }
    const m = calculateBalanceMetrics(teams);
    const key = teams
      .map((t) =>
        t.players
          .map((p) => p.id)
          .sort()
          .join(','),
      )
      .sort()
      .join('|');
    candidates.push({ teams, metrics: m, key });
  }
  const unique = [...new Map(candidates.map((c) => [c.key, c])).values()].sort(
    (a, b) => a.metrics.score - b.metrics.score,
  );
  const bestScore = unique[0].metrics.score;
  const pool = unique
    .filter((candidate) => candidate.metrics.score <= bestScore + 0.15)
    .slice(0, 20);
  const chosen = pool[Math.floor(random() * pool.length)];
  return {
    teams: chosen.teams.map((t) => ({ ...t, metrics: chosen.metrics })),
    metrics: chosen.metrics,
  };
}
export function calculateRotation(teams: TeamDto[], matches: MatchDto[]) {
  const order = [...teams].sort(
    (a, b) => (a.initialRotationPosition ?? 0) - (b.initialRotationPosition ?? 0),
  );
  if (order.length < 2) throw new Error('Se requieren al menos dos equipos confirmados');
  let court = [order[0], order[1]];
  let queue = order.slice(2);
  for (const match of [...matches].sort((a, b) => a.sequence - b.sequence)) {
    if (!match.winnerTeamId || !match.loserTeamId) continue;
    const winner = court.find((t) => t.id === match.winnerTeamId);
    const loser = court.find((t) => t.id === match.loserTeamId);
    if (!winner || !loser) throw new Error('El historial no coincide con la rotación');
    if (queue.length === 0) {
      court = [winner, loser];
    } else {
      const next = queue.shift()!;
      queue.push(loser);
      court = [winner, next];
    }
  }
  return {
    teamA: court[0],
    teamB: court[1],
    queue,
    nextTeam: queue[0] ?? court[1],
    nextSequence: matches.length + 1,
  };
}

export interface Standing {
  position: number;
  team: TeamDto;
  played: number;
  won: number;
  lost: number;
  points: number;
  pointsFor: number;
  pointsAgainst: number;
  difference: number;
}
export function calculateStandings(teams: TeamDto[], matches: MatchDto[]): Standing[] {
  const rows = new Map(
    teams.map((team) => [
      team.id,
      { team, played: 0, won: 0, lost: 0, points: 0, pointsFor: 0, pointsAgainst: 0 },
    ]),
  );
  matches
    .filter((match) => match.winnerTeamId && match.loserTeamId)
    .forEach((match) => {
      const a = rows.get(match.teamAId);
      const b = rows.get(match.teamBId);
      if (!a || !b) throw new Error('El partido contiene equipos externos');
      a.played++;
      b.played++;
      a.pointsFor += match.teamAScore;
      a.pointsAgainst += match.teamBScore;
      b.pointsFor += match.teamBScore;
      b.pointsAgainst += match.teamAScore;
      const winner = rows.get(match.winnerTeamId!);
      const loser = rows.get(match.loserTeamId!);
      if (!winner || !loser) throw new Error('Ganador o perdedor inválido');
      winner.won++;
      winner.points++;
      loser.lost++;
    });
  return [...rows.values()]
    .map((row) => ({ ...row, difference: row.pointsFor - row.pointsAgainst, position: 0 }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.difference - a.difference ||
        b.pointsFor - a.pointsFor ||
        a.team.name.localeCompare(b.team.name),
    )
    .map((row, index) => ({ ...row, position: index + 1 }));
}
export function derivePaymentStatus(amountDue: number, amountPaid: number): PaymentStatus {
  if (amountDue === 0) return 'NOT_REQUIRED';
  if (amountPaid <= 0) return 'PENDING';
  if (amountPaid < amountDue) return 'PARTIAL';
  if (amountPaid === amountDue) return 'PAID';
  return 'CREDIT';
}
