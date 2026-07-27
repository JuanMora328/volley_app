import { describe, expect, it } from 'vitest';
import { calculateCourtTotal, derivePaymentStatus, distributeIntegerAmount } from './index.js';

describe('distributeIntegerAmount', () => {
  it.each([
    [100000, 12],
    [37000, 8],
    [3, 5],
    [9, 2],
    [0, 4],
  ])('reparte %i entre %i sin perder pesos', (total, count) => {
    const result = distributeIntegerAmount(
      total,
      Array.from({ length: count }, (_, i) => `p-${i}`),
    );
    expect(Object.values(result).reduce((sum: number, value: number) => sum + value, 0)).toBe(
      total,
    );
    expect(Object.values(result).every(Number.isInteger)).toBe(true);
  });
  it('acepta una lista vacía solo para total cero', () => {
    expect(distributeIntegerAmount(0, [])).toEqual({});
    expect(() => distributeIntegerAmount(1, [])).toThrow();
  });
  it('rechaza duplicados y es determinístico por identificador', () => {
    expect(() => distributeIntegerAmount(2, ['a', 'a'])).toThrow();
    expect(distributeIntegerAmount(5, ['c', 'a', 'b'])).toEqual(
      distributeIntegerAmount(5, ['b', 'c', 'a']),
    );
  });
});

describe('derivePaymentStatus', () => {
  it.each([
    [0, 0, 'NOT_REQUIRED'],
    [10, 0, 'PENDING'],
    [10, 5, 'PARTIAL'],
    [10, 10, 'PAID'],
    [10, 12, 'PAID'],
  ])('deriva el estado', (due, paid, status) =>
    expect(derivePaymentStatus(due as number, paid as number)).toBe(status),
  );
});

describe('calculateCourtTotal', () => {
  it.each([
    [70000, 60, 70000],
    [70000, 90, 105000],
    [70000, 120, 140000],
  ])('calcula %i por %i minutos', (hourly, minutes, total) => {
    expect(calculateCourtTotal(hourly, minutes)).toBe(total);
  });
  it('rechaza duraciones fuera de intervalos de media hora', () => {
    expect(() => calculateCourtTotal(70000, 75)).toThrow();
  });
});
