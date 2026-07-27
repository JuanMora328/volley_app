import { describe, expect, it } from 'vitest';
import { calculateRotation, calculateStandings, MatchDto, TeamDto } from './index.js';
const teams = ['A', 'B', 'C', 'D'].map((name, initialRotationPosition) => ({
  id: name,
  name,
  players: [],
  initialRotationPosition,
}));
const match = (
  sequence: number,
  a: string,
  b: string,
  winner: string,
  scoreA = 10,
  scoreB = 5,
): MatchDto => ({
  id: String(sequence),
  sequence,
  teamAId: a,
  teamBId: b,
  teamAScore: scoreA,
  teamBScore: scoreB,
  targetScore: 10,
  winnerTeamId: winner,
  loserTeamId: winner === a ? b : a,
});
describe('competición', () => {
  it('mantiene al ganador y rota perdedor al final con cuatro equipos', () => {
    const state = calculateRotation(teams, [
      match(1, 'A', 'B', 'A'),
      match(2, 'A', 'C', 'C', 4, 10),
    ]);
    expect([state.teamA.id, state.teamB.id]).toEqual(['C', 'D']);
    expect(state.queue.map((t) => t.id)).toEqual(['B', 'A']);
    expect(state.nextSequence).toBe(3);
  });
  it('permite la repetición indefinida con dos equipos', () => {
    const state = calculateRotation(teams.slice(0, 2), [
      match(1, 'A', 'B', 'B', 5, 10),
      match(2, 'B', 'A', 'A', 5, 10),
    ]);
    expect(new Set([state.teamA.id, state.teamB.id])).toEqual(new Set(['A', 'B']));
    expect(state.queue).toEqual([]);
  });
  it('deriva posiciones solamente de resultados suministrados', () => {
    const rows = calculateStandings(teams.slice(0, 3) as TeamDto[], [
      match(1, 'A', 'B', 'A'),
      match(2, 'A', 'C', 'C', 4, 10),
    ]);
    expect(rows.map((r) => r.team.id)).toEqual(['C', 'A', 'B']);
    expect(rows.find((r) => r.team.id === 'A')).toMatchObject({
      played: 2,
      won: 1,
      lost: 1,
      points: 1,
      pointsFor: 14,
      pointsAgainst: 15,
      difference: -1,
    });
  });
  it('rechaza un historial incoherente', () =>
    expect(() => calculateRotation(teams, [match(1, 'A', 'C', 'A')])).toThrow('historial'));
});
