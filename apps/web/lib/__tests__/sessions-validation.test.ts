import { describe, expect, it } from 'vitest';
import { localDateInputValue, money, sessionSchema, sessionStatusLabel } from '../sessions';
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
  it('elimina el UUID vacío al seleccionar una ubicación manual', () =>
    expect(sessionSchema.parse({ ...valid, venueId: '' }).venueId).toBeUndefined());
  it('rechaza precios negativos, menos de dos equipos y puntaje inválido', () =>
    expect(
      sessionSchema.safeParse({ ...valid, courtPrice: -1, teamCount: 1, defaultTargetScore: 0 })
        .success,
    ).toBe(false));
  it('formatea COP en es-CO', () => expect(money(120000)).toContain('120.000'));
  it('genera la fecha del calendario en la zona horaria local', () => {
    const date = new Date('2026-07-28T02:00:00.000Z');
    date.getTimezoneOffset = () => 300;
    expect(localDateInputValue(date)).toBe('2026-07-27');
  });
  it('presenta los estados de la jornada en español', () => {
    expect(sessionStatusLabel('DRAFT')).toBe('Borrador');
    expect(sessionStatusLabel('TEAMS_CREATED')).toBe('Equipos confirmados');
    expect(sessionStatusLabel('IN_PROGRESS')).toBe('En progreso');
    expect(sessionStatusLabel('FINISHED')).toBe('Finalizada');
    expect(sessionStatusLabel('CANCELLED')).toBe('Cancelada');
  });
});
