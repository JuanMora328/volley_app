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
export enum PaymentMethod {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
}
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';
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
  winnerTeamId: string;
  loserTeamId: string;
}
export interface BalanceMetrics {
  maxAverageDiff: number;
  averageVariance: number;
  sizeDiff: number;
  normalizedStrengthDiff: number;
  score: number;
}
export function distributeIntegerAmount(
  total: number,
  participantIds: string[],
): Record<string, number> {
  if (!Number.isInteger(total) || total < 0)
    throw new Error('El total debe ser un entero no negativo');
  if (participantIds.length === 0) throw new Error('Debe existir al menos un participante');
  const sorted = [...participantIds].sort();
  if (new Set(sorted).size !== sorted.length)
    throw new Error('No se permiten participantes duplicados');
  const base = Math.floor(total / sorted.length);
  const remainder = total % sorted.length;
  return Object.fromEntries(sorted.map((id, index) => [id, base + (index < remainder ? 1 : 0)]));
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
const shuffle = <T>(items: T[]) => [...items].sort(() => Math.random() - 0.5);
function metrics(teams: GeneratedTeam[]): BalanceMetrics {
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
  return { maxAverageDiff, averageVariance, sizeDiff, normalizedStrengthDiff, score };
}
export function generateBalancedTeams(
  players: TeamCandidatePlayer[],
  teamCount: number,
  iterations = 300,
): { teams: GeneratedTeam[]; metrics: BalanceMetrics } {
  if (teamCount < 2) throw new Error('Se requieren al menos dos equipos');
  if (players.length < teamCount) throw new Error('Debe haber al menos un jugador por equipo');
  const candidates: { teams: GeneratedTeam[]; metrics: BalanceMetrics; key: string }[] = [];
  for (let i = 0; i < Math.max(300, iterations); i++) {
    const ordered = shuffle([...players].sort((a, b) => b.level - a.level));
    const teams = Array.from({ length: teamCount }, (_, idx) => ({
      name: `Equipo ${String.fromCharCode(65 + idx)}`,
      players: [] as TeamCandidatePlayer[],
    }));
    for (const p of ordered) {
      teams
        .sort(
          (a, b) =>
            a.players.reduce((s, x) => s + x.level, 0) / (a.players.length || 1) -
              b.players.reduce((s, x) => s + x.level, 0) / (b.players.length || 1) ||
            a.players.length - b.players.length,
        )[0]
        .players.push(p);
    }
    const m = metrics(teams);
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
  const pool = unique.slice(0, Math.max(1, Math.ceil(unique.length * 0.1)));
  const chosen = pool[Math.floor(Math.random() * pool.length)];
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
    const winner = court.find((t) => t.id === match.winnerTeamId)!;
    const loser = court.find((t) => t.id === match.loserTeamId)!;
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
export function derivePaymentStatus(amountDue: number, amountPaid: number): PaymentStatus {
  if (amountPaid <= 0) return 'PENDING';
  if (amountPaid < amountDue) return 'PARTIAL';
  return 'PAID';
}
