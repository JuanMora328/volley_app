import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { DashboardController } from './dashboard.module';
describe('DashboardController', () => {
  it('combina jugadores y jornadas reales', async () => {
    const players = { countBy: async () => 7 };
    const sessions = { findOne: async () => null, find: async () => [], countBy: async () => 2 };
    const sessionPlayers = { count: async () => 0 };
    const response = await new DashboardController(
      players as never,
      sessions as never,
      sessionPlayers as never,
    ).getDashboard();
    expect(response.stats.activePlayers).toBe(7);
    expect(response.stats.completedSessions).toBe(2);
    expect(response.recentSessions).toEqual([]);
  });

  it('expone la cantidad real de participantes de la jornada activa', async () => {
    const players = { countBy: async () => 7 };
    const sessions = {
      findOne: async () => ({
        id: 'session-1',
        venueNameSnapshot: 'Cancha Central',
        date: '2026-07-28',
        status: 'DRAFT',
      }),
      find: async () => [],
      countBy: async () => 2,
    };
    const sessionPlayers = {
      count: async (options: unknown) => {
        expect(options).toEqual({ where: { session: { id: 'session-1' } } });
        return 8;
      },
    };

    const response = await new DashboardController(
      players as never,
      sessions as never,
      sessionPlayers as never,
    ).getDashboard();

    expect(response.activeSession?.participantCount).toBe(8);
  });
});
