export type PaymentPresentationStatus = 'NOT_REQUIRED' | 'PENDING' | 'PARTIAL' | 'PAID' | 'CREDIT';

export const paymentPresentation: Record<
  PaymentPresentationStatus,
  { label: string; badge: string; dot: string }
> = {
  PAID: {
    label: 'Pagado',
    badge: 'bg-green-200 text-green-900 ring-green-600/20',
    dot: 'bg-green-600',
  },
  PARTIAL: {
    label: 'Pago parcial',
    badge: 'bg-amber-200 text-amber-950 ring-amber-600/20',
    dot: 'bg-amber-500',
  },
  PENDING: {
    label: 'Pendiente',
    badge: 'bg-slate-200 text-slate-800 ring-slate-500/20',
    dot: 'bg-slate-500',
  },
  CREDIT: {
    label: 'Con crédito',
    badge: 'bg-blue-200 text-blue-950 ring-blue-600/20',
    dot: 'bg-blue-600',
  },
  NOT_REQUIRED: {
    label: 'No requerido',
    badge: 'bg-cyan-100 text-cyan-950 ring-cyan-600/20',
    dot: 'bg-cyan-600',
  },
};

export function formatDateEs(value: unknown, options?: Intl.DateTimeFormatOptions) {
  if (!value) return 'Fecha no disponible';
  const raw = String(value);
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(raw);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat(
    'es-CO',
    options ?? { day: '2-digit', month: 'short', year: 'numeric' },
  ).format(date);
}
