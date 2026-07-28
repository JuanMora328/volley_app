import { z } from 'zod';
export type Player = {
  id: string;
  name: string;
  defaultLevel: number;
  notes: string | null;
  active: boolean;
  createdAt: string;
};
export type Venue = {
  id: string;
  name: string;
  address: string | null;
  defaultCourtPrice: number;
  defaultGatoradePrice: number;
  active: boolean;
  createdAt: string;
};
export type Paginated<T> = {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};
export const playerSchema = z.object({
  name: z.string().trim().min(1, 'Ingresa el nombre'),
  defaultLevel: z.coerce
    .number()
    .int()
    .min(1, 'El nivel mínimo es 1')
    .max(5, 'El nivel máximo es 5'),
  notes: z.string().trim().optional(),
});
export const venueSchema = z.object({
  name: z.string().trim().min(1, 'Ingresa el nombre'),
  address: z.string().trim().optional(),
  defaultCourtPrice: z.coerce
    .number()
    .int('Usa pesos enteros')
    .min(0, 'El valor no puede ser negativo'),
  defaultGatoradePrice: z.coerce
    .number()
    .int('Usa pesos enteros')
    .min(0, 'El valor no puede ser negativo'),
});
export const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function parseCopInput(value: string): number {
  const normalized = value.replace(/\s|\$/g, '').replace(/\./g, '').replace(',', '.');
  const amount = Number(normalized.replace(/[^\d.]/g, ''));
  return Number.isFinite(amount) ? Math.round(amount) : 0;
}

export function formatCopInput(value: string | number | undefined): string {
  const amount = typeof value === 'number' ? value : parseCopInput(value ?? '');
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
