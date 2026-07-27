'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search, Trophy } from 'lucide-react';
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
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Por recaudar" value={money(data.expectedTotal)} />
        <Metric label="Recaudado" value={money(data.paidTotal)} />
        <Metric label="Pendiente" value={money(data.pendingTotal)} danger />
        <Metric label="Créditos" value={money(data.creditTotal)} />
      </section>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" />
          <input
            className="input pl-11"
            placeholder="Buscar jugador…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="ALL">Todos</option>
          <option value="PENDING">Pendientes</option>
          <option value="PARTIAL">Parciales</option>
          <option value="PAID">Pagados</option>
          <option value="NOT_REQUIRED">No requeridos</option>
        </select>
      </div>
      <section className="grid gap-3 md:grid-cols-2">
        {players.map((p) => (
          <article className="card" key={p.id}>
            <div className="flex justify-between">
              <div>
                <h2 className="text-lg font-bold">{p.name}</h2>
                <p className="text-sm text-slate-500">
                  {p.team?.name}{' '}
                  {p.isChampion && <Trophy className="inline text-amber-500" size={16} />}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
                {statusLabel[p.paymentStatus]}
              </span>
            </div>
            <div className="my-4 grid grid-cols-3 text-sm">
              <span>
                Cancha<b className="block">{money(p.courtAmount)}</b>
              </span>
              <span>
                Gatorade<b className="block">{money(p.gatoradeAmount)}</b>
              </span>
              <span>
                Pendiente<b className="block text-red-700">{money(p.pendingAmount)}</b>
              </span>
            </div>
            {p.creditAmount > 0 && (
              <p className="mb-2 text-sm font-bold text-blue-700">
                Crédito: {money(p.creditAmount)}
              </p>
            )}
            <button
              className="btn-secondary w-full"
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
          className="fixed inset-0 z-50 grid place-items-end bg-slate-950/50 p-4 sm:place-items-center"
          role="dialog"
          aria-modal="true"
        >
          <section className="w-full max-w-md rounded-3xl bg-white p-6">
            <h2 className="text-2xl font-bold">Pago de {editing.name}</h2>
            <p className="mb-4 text-slate-500">
              Debe {money(editing.amountDue)} · pagado {money(amount)}
            </p>
            <label className="font-bold">
              Valor pagado
              <input
                className="input mt-1"
                type="number"
                min="0"
                step="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </label>
            <div className="my-3 grid grid-cols-2 gap-2">
              <button className="btn-secondary" onClick={() => setAmount(editing.amountDue)}>
                Marcar completo
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
              <button className="btn-secondary flex-1" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button className="btn-primary flex-1" onClick={() => save.mutate()}>
                Guardar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
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
