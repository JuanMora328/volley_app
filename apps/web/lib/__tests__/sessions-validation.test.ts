import { describe, expect, it } from 'vitest';
import { money, sessionSchema, sessionStatusLabel } from '../sessions';
describe('formulario de jornada', () => {
  const valid = {
    date: '2026-08-01',
    startTime: '19:00',
    venueName: 'Cancha Norte',
    courtPrice: 120000,
    gatoradePrice: 30000,
    teamCount: 3,
    defaultTargetScore: 21,
  };
  it('acepta cancha manual y dinero entero', () =>
    expect(sessionSchema.safeParse(valid).success).toBe(true));
  it('rechaza precios negativos, menos de dos equipos y puntaje inválido', () =>
    expect(
      sessionSchema.safeParse({ ...valid, courtPrice: -1, teamCount: 1, defaultTargetScore: 0 })
        .success,
    ).toBe(false));
  it('formatea COP en es-CO', () => expect(money(120000)).toContain('120.000'));
  it('presenta los estados de la jornada en español', () => {
    expect(sessionStatusLabel('DRAFT')).toBe('Borrador');
    expect(sessionStatusLabel('TEAMS_CREATED')).toBe('Equipos confirmados');
    expect(sessionStatusLabel('IN_PROGRESS')).toBe('En progreso');
    expect(sessionStatusLabel('FINISHED')).toBe('Finalizada');
    expect(sessionStatusLabel('CANCELLED')).toBe('Cancelada');
  });
});
