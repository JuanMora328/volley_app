import { describe, expect, it } from 'vitest';
import { formatDateEs, paymentPresentation } from '../presentation';
describe('presentación histórica', () => {
  it('formatea fechas date-only y timestamps sin producir Invalid Date', () => {
    expect(formatDateEs('2026-07-28')).not.toContain('Invalid');
    expect(formatDateEs('2026-07-28T00:00:00.000Z')).not.toContain('Invalid');
    expect(formatDateEs('valor inválido')).toBe('Fecha no disponible');
  });
  it('mantiene la convención visual de pagos', () => {
    expect(paymentPresentation.PAID.badge).toContain('green');
    expect(paymentPresentation.PARTIAL.badge).toContain('amber');
    expect(paymentPresentation.PENDING.badge).toContain('slate');
  });
});
