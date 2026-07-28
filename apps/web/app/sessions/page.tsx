/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '../../lib/api';
import { sessionStatusLabel } from '../../lib/sessions';
const money = (v: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(v || 0);
export default function SessionsPage() {
  const [filters, setFilters] = useState({
    search: '',
    participantSearch: '',
    status: '',
    financialStatus: '',
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
  return (
    <div className="space-y-5">
      <header className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold">Historial de jornadas</h1>
          <p className="text-slate-500">Consulta deportiva y financiera</p>
        </div>
        <Link className="btn" href="/sessions/new">
          Nueva
        </Link>
      </header>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {[
          ['Total', summary.data?.totalSessions],
          ['Finalizadas', summary.data?.finishedSessions],
          ['Activas', summary.data?.activeSessions],
          ['Partidos', summary.data?.finishedMatches],
          ['Saldo', money(summary.data?.totalPending)],
        ].map((x) => (
          <div className="card" key={x[0]}>
            <small>{x[0]}</small>
            <b className="block">{x[1] ?? '—'}</b>
          </div>
        ))}
      </div>
      <section className="card grid gap-3 md:grid-cols-4">
        <input
          className="input"
          placeholder="Buscar cancha"
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
        />
        <input
          className="input"
          placeholder="Buscar participante"
          value={filters.participantSearch}
          onChange={(e) => set('participantSearch', e.target.value)}
        />
        <select
          className="input"
          value={filters.status}
          onChange={(e) => set('status', e.target.value)}
        >
          <option value="">Todos los estados</option>
          {['DRAFT', 'TEAMS_CREATED', 'IN_PROGRESS', 'SETTLEMENT', 'FINISHED', 'CANCELLED'].map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
        <select
          className="input"
          value={filters.financialStatus}
          onChange={(e) => set('financialStatus', e.target.value)}
        >
          <option value="">Todos los pagos</option>
          <option value="UNSETTLED">Sin liquidar</option>
          <option value="CLEAR">Sin deuda</option>
          <option value="PENDING">Pendientes</option>
          <option value="PARTIAL">Parciales</option>
          <option value="CREDIT">Con crédito</option>
        </select>
        <button
          className="secondary-btn"
          onClick={() =>
            setFilters({
              search: '',
              participantSearch: '',
              status: '',
              financialStatus: '',
              page: 1,
            })
          }
        >
          Limpiar filtros
        </button>
      </section>
      {q.isLoading ? (
        <div className="card animate-pulse">Cargando...</div>
      ) : q.isError ? (
        <div className="card text-red-700">No pudimos cargar el historial.</div>
      ) : (
        <div className="space-y-3">
          {q.data.items.map((s: any) => (
            <Link
              className={`card block ${s.status === 'CANCELLED' ? 'border-red-300' : ''}`}
              href={`/sessions/${s.id}`}
              key={s.id}
            >
              <div className="flex justify-between">
                <b>{s.venueNameSnapshot}</b>
                <b className="text-blue-700">{sessionStatusLabel(s.status)}</b>
              </div>
              <p className="text-sm text-slate-500">
                {s.date} · {s.participantCount ?? s.participantcount} participantes ·{' '}
                {s.finishedMatches ?? s.finishedmatches} partidos
              </p>
              <div className="mt-2 flex justify-between text-sm">
                <span>
                  {s.championTeam ? `Campeón: ${s.championTeam}` : 'Sin campeón confirmado'}
                </span>
                <span>
                  Pendiente: <b>{money(s.totalPending ?? s.totalpending)}</b>
                </span>
              </div>
            </Link>
          ))}
          {!q.data.items.length && (
            <div className="card text-center">No hay jornadas que coincidan.</div>
          )}
          <div className="flex justify-between">
            <button
              className="secondary-btn"
              disabled={filters.page <= 1}
              onClick={() => setFilters((x) => ({ ...x, page: x.page - 1 }))}
            >
              Anterior
            </button>
            <span>
              Página {q.data.page} de {q.data.totalPages || 1}
            </span>
            <button
              className="secondary-btn"
              disabled={filters.page >= q.data.totalPages}
              onClick={() => setFilters((x) => ({ ...x, page: x.page + 1 }))}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
