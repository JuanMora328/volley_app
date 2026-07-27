import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { DashboardController } from './dashboard.module';
describe('DashboardController', () => {
  it('combina jugadores y jornadas reales', async () => {
    const players = { countBy: async () => 7 };
    const sessions = { findOne: async () => null, find: async () => [], countBy: async () => 2 };
    const response = await new DashboardController(
      players as never,
      sessions as never,
    ).getDashboard();
    expect(response.stats.activePlayers).toBe(7);
    expect(response.stats.completedSessions).toBe(2);
    expect(response.recentSessions).toEqual([]);
  });
});
