import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { DashboardController } from './dashboard.module';
describe('DashboardController', () => {
  it('cuenta únicamente jugadores activos', async () => {
    const repository = { countBy: async (where: { active: boolean }) => where.active ? 7 : 99 };
    const response = await new DashboardController(repository as never).getDashboard();
    expect(response.stats.activePlayers).toBe(7);
    expect(response.stats.completedSessions).toBe(0);
  });
});
