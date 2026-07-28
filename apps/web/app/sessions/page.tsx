/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarCheck,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Filter,
  Search,
  Trophy,
  Users,
  Volleyball,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '../../lib/api';
import { formatDateEs } from '../../lib/presentation';
import { sessionStatusLabel } from '../../lib/sessions';
const money = (v: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v || 0);
const stateTone: Record<string, string> = {
  FINISHED: 'bg-lime-200 text-lime-950 ring-lime-600/20',
  CANCELLED: 'bg-red-100 text-red-800 ring-red-500/20',
  DRAFT: 'bg-slate-200 text-slate-800 ring-slate-500/20',
  TEAMS_CREATED: 'bg-blue-100 text-blue-800 ring-blue-500/20',
  IN_PROGRESS: 'bg-green-100 text-green-800 ring-green-500/20',
  SETTLEMENT: 'bg-amber-100 text-amber-900 ring-amber-500/20',
};
export default function SessionsPage() {
  const [filters, setFilters] = useState({
    search: '',
    participantSearch: '',
    status: '',
    financialStatus: '',
    sortOrder: 'DESC',
    page: 1,
  });
  const qs = new URLSearchParams(
    Object.entries(filters)
      .filter(([, v]) => v !== '' && v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  );
  const q = useQuery({
    queryKey: ['sessions-history', filters],
    queryFn: () => api<any>(`/sessions?${qs}`),
  });
  const summary = useQuery({
    queryKey: ['sessions-summary'],
    queryFn: () => api<any>('/sessions/history/summary'),
  });
  const set = (k: string, v: any) => setFilters((x) => ({ ...x, [k]: v, page: 1 }));
  const clear = () =>
    setFilters({
      search: '',
      participantSearch: '',
      status: '',
      financialStatus: '',
      sortOrder: 'DESC',
      page: 1,
    });
  const hasFilters =
    filters.search || filters.participantSearch || filters.status || filters.financialStatus;
  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-4">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#091426] via-[#102446] to-[#0051d5] p-6 text-white shadow-xl shadow-blue-950/10 md:p-8">
        <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full bg-[#acf847]/15 blur-2xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold ring-1 ring-white/20">
              <CalendarClock size={14} />
              MEMORIA DEPORTIVA
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Historial de jornadas
            </h1>
            <p className="mt-2 max-w-xl text-sm text-blue-100 md:text-base">
              Resultados, participación y estado financiero en un solo lugar.
            </p>
          </div>
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#acf847] px-5 font-extrabold text-[#102000] shadow-lg transition hover:-translate-y-0.5 hover:bg-lime-300"
            href="/sessions/new"
          >
            <Volleyball size={19} />
            Nueva jornada
          </Link>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Total', summary.data?.totalSessions, CalendarClock, 'from-blue-500 to-blue-700'],
          [
            'Finalizadas',
            summary.data?.finishedSessions,
            CalendarCheck,
            'from-lime-500 to-green-600',
          ],
          ['Activas', summary.data?.activeSessions, Volleyball, 'from-cyan-500 to-blue-600'],
          ['Partidos', summary.data?.finishedMatches, Trophy, 'from-amber-400 to-orange-500'],
          [
            'Saldo pendiente',
            money(summary.data?.totalPending),
            CircleDollarSign,
            'from-rose-500 to-red-600',
          ],
        ].map(([label, value, Icon, gradient]: any) => (
          <article
            className="relative overflow-hidden rounded-2xl border border-white/60 bg-white p-4 shadow-sm"
            key={label}
          >
            <div
              className={`absolute -right-5 -top-5 h-20 w-20 rounded-full bg-gradient-to-br ${gradient} opacity-10`}
            />
            <span
              className={`mb-3 inline-grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white ${gradient}`}
            >
              <Icon size={18} />
            </span>
            <b className="block text-xl text-[#091426]">{value ?? '—'}</b>
            <small className="font-semibold text-slate-500">{label}</small>
          </article>
        ))}
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <Filter size={17} />
            </span>
            <div>
              <h2 className="font-extrabold text-[#091426]">Filtros</h2>
              <p className="text-xs text-slate-500">Combina criterios para encontrar una jornada</p>
            </div>
          </div>
          {hasFilters && (
            <button
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
              onClick={clear}
            >
              <X size={15} />
              Limpiar
            </button>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <SearchInput
            placeholder="Buscar cancha"
            value={filters.search}
            onChange={(v) => set('search', v)}
          />
          <SearchInput
            placeholder="Buscar participante"
            value={filters.participantSearch}
            onChange={(v) => set('participantSearch', v)}
          />
          <Select
            value={filters.status}
            onChange={(v) => set('status', v)}
            options={[
              ['', 'Todos los estados'],
              ['DRAFT', 'Borrador'],
              ['TEAMS_CREATED', 'Equipos listos'],
              ['IN_PROGRESS', 'En juego'],
              ['SETTLEMENT', 'Liquidación'],
              ['FINISHED', 'Finalizada'],
              ['CANCELLED', 'Cancelada'],
            ]}
          />
          <Select
            value={filters.financialStatus}
            onChange={(v) => set('financialStatus', v)}
            options={[
              ['', 'Todos los pagos'],
              ['UNSETTLED', 'Sin liquidar'],
              ['CLEAR', 'Sin deuda'],
              ['PENDING', 'Pagos pendientes'],
              ['PARTIAL', 'Pagos parciales'],
              ['CREDIT', 'Con crédito'],
            ]}
          />
          <Select
            value={filters.sortOrder}
            onChange={(v) => set('sortOrder', v)}
            options={[
              ['DESC', 'Más recientes'],
              ['ASC', 'Más antiguas'],
            ]}
          />
        </div>
      </section>
      {q.isLoading ? (
        <HistorySkeleton />
      ) : q.isError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
          <b>No pudimos cargar el historial</b>
          <p className="mt-1 text-sm">Intenta nuevamente en unos segundos.</p>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">
              {q.data.totalItems}{' '}
              {q.data.totalItems === 1 ? 'jornada encontrada' : 'jornadas encontradas'}
            </p>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              Página {q.data.page} de {q.data.totalPages || 1}
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {q.data.items.map((s: any) => (
              <SessionCard session={s} key={s.id} />
            ))}
          </div>
          {!q.data.items.length && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <Search className="mx-auto mb-3 text-slate-400" size={38} />
              <b className="text-[#091426]">No encontramos jornadas</b>
              <p className="mt-1 text-sm text-slate-500">
                Prueba con otros criterios o limpia los filtros.
              </p>
              {hasFilters && (
                <button
                  className="mt-4 rounded-xl bg-blue-50 px-4 py-2 font-bold text-blue-700"
                  onClick={clear}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
          <nav className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-35"
              disabled={filters.page <= 1}
              onClick={() => setFilters((x) => ({ ...x, page: x.page - 1 }))}
            >
              <ChevronLeft size={18} />
              Anterior
            </button>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0051d5] px-4 font-bold text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
              disabled={filters.page >= q.data.totalPages}
              onClick={() => setFilters((x) => ({ ...x, page: x.page + 1 }))}
            >
              Siguiente
              <ChevronRight size={18} />
            </button>
          </nav>
        </section>
      )}
    </div>
  );
}
function SessionCard({ session: s }: { session: any }) {
  const participants = s.participantCount ?? s.participantcount ?? 0,
    matches = s.finishedMatches ?? s.finishedmatches ?? 0,
    pending = s.totalPending ?? s.totalpending ?? 0,
    collected = s.totalCollected ?? s.totalcollected ?? 0;
  return (
    <Link
      href={`/sessions/${s.id}`}
      className={`group relative overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${s.status === 'CANCELLED' ? 'border-red-200' : 'border-slate-200'}`}
    >
      <div
        className={`h-2 ${s.status === 'CANCELLED' ? 'bg-red-500' : s.status === 'FINISHED' ? 'bg-gradient-to-r from-lime-400 to-green-500' : 'bg-gradient-to-r from-[#0051d5] to-cyan-400'}`}
      />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-blue-700">
              {formatDateEs(s.date, {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-[#091426]">{s.venueNameSnapshot}</h2>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ring-inset ${stateTone[s.status] || stateTone.DRAFT}`}
          >
            {sessionStatusLabel(s.status)}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <Users size={17} className="text-blue-600" />
            <b>{participants}</b> participantes
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Volleyball size={17} className="text-blue-600" />
            <b>{matches}</b> partidos
          </span>
          {s.championTeam && (
            <span className="inline-flex items-center gap-1.5">
              <Trophy size={17} className="text-amber-500" />
              <b>{s.championTeam}</b>
            </span>
          )}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <div className="rounded-2xl bg-green-50 p-3">
            <small className="text-green-700">Recaudado</small>
            <b className="block text-lg text-green-800">{money(collected)}</b>
          </div>
          <div className={`rounded-2xl p-3 ${pending ? 'bg-red-50' : 'bg-slate-50'}`}>
            <small className={pending ? 'text-red-600' : 'text-slate-500'}>Saldo pendiente</small>
            <b className={`block text-lg ${pending ? 'text-red-700' : 'text-slate-700'}`}>
              {money(pending)}
            </b>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-1 text-sm font-bold text-blue-700">
          Abrir detalle <ChevronRight size={17} className="transition group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
function SearchInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex min-h-12 w-full items-center overflow-hidden rounded-xl border border-slate-300 bg-white transition focus-within:border-[#0051d5] focus-within:ring-2 focus-within:ring-blue-100">
      <span className="grid h-full w-11 shrink-0 place-items-center text-slate-400">
        <Search size={18} aria-hidden="true" />
      </span>
      <input
        className="min-w-0 flex-1 border-0 bg-transparent py-3 pr-3 text-sm outline-none placeholder:text-slate-400"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[][];
}) {
  return (
    <label className="relative block">
      <select
        className="min-h-12 w-full cursor-pointer appearance-none rounded-xl border border-slate-300 bg-gradient-to-b from-white to-slate-50 py-3 pl-4 pr-11 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-400 focus:border-[#0051d5] focus:ring-2 focus:ring-blue-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, l]) => (
          <option value={v} key={v}>
            {l}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg bg-blue-50 text-blue-700">
        <ChevronDown size={16} aria-hidden="true" />
      </span>
    </label>
  );
}
function HistorySkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2" aria-label="Cargando jornadas">
      {Array.from({ length: 4 }, (_, i) => (
        <div className="h-64 animate-pulse rounded-3xl bg-slate-200" key={i} />
      ))}
    </div>
  );
}
