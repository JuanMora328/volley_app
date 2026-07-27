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
  maximumFractionDigits: 0,
});
