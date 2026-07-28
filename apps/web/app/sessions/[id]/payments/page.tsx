'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, Search, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { api } from '../../../../lib/api';
import { money } from '../../../../lib/sessions';
import { FinancialPlayer, PaymentSummary, statusLabel } from '../../../../lib/settlements';
export default function PaymentsPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [editing, setEditing] = useState<FinancialPlayer | null>(null);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['payments', id],
    queryFn: () => api<PaymentSummary>(`/sessions/${id}/payments`),
  });
  const save = useMutation({
    mutationFn: () =>
      api(`/sessions/${id}/payments/${editing!.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ amountPaid: amount, paymentMethod: amount ? method : null }),
      }),
    onSuccess: async () => {
      setEditing(null);
      await qc.invalidateQueries({ queryKey: ['payments', id] });
    },
    onError: (e: Error) => setError(e.message),
  });
  if (!query.data)
    return (
      <div className="card">
        {query.isLoading ? 'Cargando pagos…' : 'No se pudieron cargar los pagos.'}
      </div>
    );
  const data = query.data;
  const players = data.participants.filter(
    (p) =>
      (filter === 'ALL' || p.paymentStatus === filter) &&
      p.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-20">
      <header className="flex items-center gap-3">
        <Link href={`/sessions/${id}`}>
          <ArrowLeft />
        </Link>
        <div>
          <p className="text-sm font-bold text-secondary">{data.session.venueName}</p>
          <h1 className="text-3xl font-extrabold">Estado de pagos</h1>
        </div>
      </header>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="Por recaudar" value={money(data.expectedTotal)} />
        <Metric label="Recaudado" value={money(data.paidTotal)} />
        <Metric label="Pendiente" value={money(data.pendingTotal)} danger />
      </section>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="relative block">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            className="input !pl-12"
            aria-label="Buscar jugador"
            placeholder="Buscar jugador…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="relative block min-w-52">
          <span className="sr-only">Filtrar por estado</span>
          <select
            className="input appearance-none border-slate-300 bg-white !pr-11 font-semibold text-slate-700 shadow-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="PARTIAL">Parciales</option>
            <option value="PAID">Pagados</option>
            <option value="NOT_REQUIRED">No requeridos</option>
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary"
            size={19}
          />
        </label>
      </div>
      <section className="grid gap-3 md:grid-cols-2">
        {players.map((p) => (
          <article className={`card border-l-4 ${paymentCardClass[p.paymentStatus]}`} key={p.id}>
            <div className="flex justify-between">
              <div>
                <h2 className="text-lg font-bold">{p.name}</h2>
                <p className="text-sm text-slate-500">
                  {p.team?.name}{' '}
                  {p.isChampion && <Trophy className="inline text-amber-500" size={16} />}
                </p>
              </div>
              <span
                className={`inline-flex h-7 shrink-0 self-start items-center rounded-full px-2.5 text-[11px] font-extrabold leading-none ${paymentBadgeClass[p.paymentStatus]}`}
              >
                {statusLabel[p.paymentStatus]}
              </span>
            </div>
            <div className="my-4 grid grid-cols-2 gap-2 rounded-xl bg-white/80 p-3 text-sm sm:grid-cols-4">
              <span className="text-slate-600">
                Cancha<b className="block text-slate-950">{money(p.courtAmount)}</b>
              </span>
              <span className="text-slate-600">
                Gatorade<b className="block text-slate-950">{money(p.gatoradeAmount)}</b>
              </span>
              <span className="text-slate-600">
                Pagado<b className="block text-green-700">{money(p.amountPaid)}</b>
              </span>
              <span className="text-slate-600">
                Pendiente<b className="block text-red-700">{money(p.pendingAmount)}</b>
              </span>
            </div>
            {p.creditAmount > 0 && (
              <p className="mb-2 text-sm font-bold text-blue-700">
                Crédito: {money(p.creditAmount)}
              </p>
            )}
            <button
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-blue-200 bg-blue-100 px-4 font-bold text-secondary transition hover:border-blue-300 hover:bg-blue-200 active:scale-95"
              onClick={() => {
                setEditing(p);
                setAmount(p.amountPaid);
                setMethod(p.paymentMethod ?? 'CASH');
                setError('');
              }}
            >
              {p.amountPaid ? 'Editar pago' : 'Registrar pago'}
            </button>
          </article>
        ))}
      </section>
      {editing && (
        <div
          className="fixed inset-0 z-50 grid place-items-end bg-slate-950/60 p-4 backdrop-blur-sm sm:place-items-center"
          role="dialog"
          aria-modal="true"
        >
          <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-bold">Pago de {editing.name}</h2>
            <p className="mb-4 text-slate-500">
              Debe {money(editing.amountDue)} · pagado {money(amount)}
            </p>
            <label className="font-bold">
              Valor pagado
              <input
                className="input mt-1 text-lg font-bold tabular-nums"
                inputMode="numeric"
                value={formatInteger(amount)}
                onChange={(e) => setAmount(parseInteger(e.target.value))}
              />
              <small className="mt-1 block font-normal text-slate-500">
                Valor en COP con dos unidades decimales.
              </small>
            </label>
            <div className="my-3 grid grid-cols-2 gap-2">
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-green-100 px-4 font-bold text-green-800 transition hover:bg-green-200 active:scale-95"
                onClick={() => setAmount(editing.amountDue)}
              >
                Pago total
              </button>
              <select
                className="input"
                value={method}
                onChange={(e) => setMethod(e.target.value as 'CASH' | 'TRANSFER')}
              >
                <option value="CASH">Efectivo</option>
                <option value="TRANSFER">Transferencia</option>
              </select>
            </div>
            {amount > editing.amountDue && (
              <p className="rounded-xl bg-blue-50 p-3 text-blue-800">
                Sobrepago: crédito de {money(amount - editing.amountDue)}
              </p>
            )}
            {error && <p className="text-red-700">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-red-300 bg-red-50 px-4 font-bold text-red-700 transition hover:bg-red-100 active:scale-95"
                disabled={save.isPending}
                onClick={() => setEditing(null)}
              >
                Cancelar
              </button>
              <button
                className="btn flex-1"
                disabled={save.isPending}
                onClick={() => save.mutate()}
              >
                {save.isPending ? 'Guardando…' : 'Guardar pago'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

const paymentCardClass: Record<FinancialPlayer['paymentStatus'], string> = {
  PAID: 'border-l-green-500 border-green-200 bg-green-50/70',
  PENDING: 'border-l-slate-500 border-slate-300 bg-slate-100/80',
  PARTIAL: 'border-l-amber-500 border-amber-200 bg-amber-50/80',
  NOT_REQUIRED: 'border-l-blue-500 border-blue-200 bg-blue-50/70',
};

const paymentBadgeClass: Record<FinancialPlayer['paymentStatus'], string> = {
  PAID: 'bg-green-200 text-green-900',
  PENDING: 'bg-slate-200 text-slate-800',
  PARTIAL: 'bg-amber-200 text-amber-900',
  NOT_REQUIRED: 'bg-blue-200 text-blue-900',
};

function parseInteger(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.');
  return Math.round(Number(normalized.replace(/[^\d.]/g, ''))) || 0;
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}
function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="card">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className={`text-xl font-extrabold ${danger ? 'text-red-700' : 'text-secondary'}`}>
        {value}
      </p>
    </div>
  );
}
