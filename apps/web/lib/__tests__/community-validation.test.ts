import { describe, expect, it } from 'vitest';
import { formatCopInput, parseCopInput, playerSchema, venueSchema } from '../community';
describe('formularios de comunidad', () => {
  it('valida creación y edición de jugador', () => {
    expect(playerSchema.parse({ name: ' Ana ', defaultLevel: '3', notes: '' })).toMatchObject({
      name: 'Ana',
      defaultLevel: 3,
    });
    expect(playerSchema.safeParse({ name: 'Ana', defaultLevel: 6 }).success).toBe(false);
  });
  it('valida precios enteros y no negativos', () => {
    expect(
      venueSchema.parse({
        name: 'Central',
        address: '',
        defaultCourtPrice: '100000',
        defaultGatoradePrice: '5000',
      }).defaultCourtPrice,
    ).toBe(100000);
    expect(
      venueSchema.safeParse({ name: 'Central', defaultCourtPrice: -1, defaultGatoradePrice: 0 })
        .success,
    ).toBe(false);
    expect(
      venueSchema.safeParse({ name: 'Central', defaultCourtPrice: 1.5, defaultGatoradePrice: 0 })
        .success,
    ).toBe(false);
  });
  it('formatea valores COP con puntos de miles y dos unidades decimales', () => {
    expect(formatCopInput(120000)).toBe('120.000,00');
    expect(parseCopInput('1.250.000')).toBe(1250000);
  });
});
