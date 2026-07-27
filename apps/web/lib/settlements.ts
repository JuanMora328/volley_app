import { z } from 'zod';
export const settlementSchema = z.object({
  championTeamId: z.string().uuid('Selecciona un campeón'),
  courtPrice: z.coerce.number().int().min(0),
  gatoradePrice: z.coerce.number().int().min(0),
});
export const paymentSchema = z
  .object({
    amountPaid: z.coerce.number().int().min(0),
    paymentMethod: z.enum(['CASH', 'TRANSFER']).nullable(),
  })
  .refine((value) => value.amountPaid === 0 || value.paymentMethod, {
    message: 'Selecciona un método',
    path: ['paymentMethod'],
  });
export type FinancialPlayer = {
  id: string;
  name: string;
  team: { id: string; name: string } | null;
  isChampion: boolean;
  includedInCourtSplit: boolean;
  includedInGatoradeSplit: boolean;
  courtAmount: number;
  gatoradeAmount: number;
  amountDue: number;
  amountPaid: number;
  pendingAmount: number;
  creditAmount: number;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'NOT_REQUIRED';
  paymentMethod?: 'CASH' | 'TRANSFER' | null;
};
export type PaymentSummary = {
  session: {
    id: string;
    status: string;
    date: string;
    venueName: string;
    settledAt?: string;
    finishedAt?: string;
  };
  champion: { id: string; name: string } | null;
  courtPrice: number;
  gatoradePrice: number;
  expectedTotal: number;
  paidTotal: number;
  pendingTotal: number;
  creditTotal: number;
  counts: { pending: number; partial: number; paid: number; notRequired: number };
  participants: FinancialPlayer[];
};
export const statusLabel = {
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
  PAID: 'Pagado',
  NOT_REQUIRED: 'No requerido',
};
