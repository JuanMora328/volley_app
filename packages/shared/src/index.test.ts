import { describe, expect, it } from 'vitest';
import { calculateRotation, distributeIntegerAmount, generateBalancedTeams } from './index.js';
describe('dinero', () => {
  it('distribuye pesos exactos determinísticamente', () => {
    expect(distributeIntegerAmount(10, ['b', 'a', 'c'])).toEqual({ a: 4, b: 3, c: 3 });
  });
});
describe('equipos', () => {
  it('genera equipos balanceados', () => {
    const r = generateBalancedTeams(
      Array.from({ length: 8 }, (_, i) => ({ id: String(i), level: (i % 5) + 1 })),
      2,
    );
    expect(r.teams).toHaveLength(2);
    expect(Math.abs(r.teams[0].players.length - r.teams[1].players.length)).toBeLessThanOrEqual(1);
  });
});
describe('rotación', () => {
  it('reconstruye la cola', () => {
    const teams: any = [0, 1, 2].map((i) => ({
      id: String(i),
      name: `E${i}`,
      players: [],
      initialRotationPosition: i,
    }));
    const r = calculateRotation(teams, [
      {
        id: 'm',
        sequence: 1,
        teamAId: '0',
        teamBId: '1',
        teamAScore: 21,
        teamBScore: 10,
        targetScore: 21,
        winnerTeamId: '0',
        loserTeamId: '1',
      },
    ]);
    expect(r.teamA.id).toBe('0');
    expect(r.teamB.id).toBe('2');
  });
});

describe('generateBalancedTeams', () => {
  const players = (levels: number[]) => levels.map((level, index) => ({ id: `p-${index}`, level }));
  it.each([
    [5, 2],
    [10, 2],
    [10, 3],
    [13, 4],
  ])('distribuye %i jugadores en %i equipos', (count, teams) => {
    const result = generateBalancedTeams(
      players(Array.from({ length: count }, (_, index) => (index % 5) + 1)),
      teams,
      { seed: 'sizes' },
    );
    const assigned = result.teams.flatMap((team) => team.players.map((player) => player.id));
    const sizes = result.teams.map((team) => team.players.length);
    expect(new Set(assigned).size).toBe(count);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
    expect(Math.min(...sizes)).toBeGreaterThan(0);
  });
  it('es reproducible con semilla', () => {
    const input = players([5, 4, 4, 3, 3, 2, 2, 1, 1, 1]);
    expect(generateBalancedTeams(input, 3, { seed: 'vf' })).toEqual(
      generateBalancedTeams(input, 3, { seed: 'vf' }),
    );
  });
  it('calcula métricas para niveles iguales y un jugador dominante', () => {
    const equal = generateBalancedTeams(players(Array(10).fill(3)), 2, { seed: 1 });
    expect(equal.metrics.maxAverageDiff).toBe(0);
    const skewed = generateBalancedTeams(players([5, 1, 1, 1, 1, 1, 1, 1, 1, 1]), 2, { seed: 2 });
    expect(skewed.metrics.sizeDiff).toBe(0);
    expect(skewed.metrics.score).toBeGreaterThanOrEqual(0);
  });
});
