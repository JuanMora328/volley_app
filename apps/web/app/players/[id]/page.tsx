/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
const money = (v: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(v || 0);
const labels: Record<string, string> = {
  FINISHED: 'Finalizada',
  CANCELLED: 'Cancelada',
  DRAFT: 'Borrador',
  TEAMS_CREATED: 'Equipos creados',
  IN_PROGRESS: 'En juego',
  SETTLEMENT: 'Liquidación',
  PAID: 'Pagado',
  PARTIAL: 'Parcial',
  PENDING: 'Pendiente',
  CREDIT: 'Crédito',
  NOT_REQUIRED: 'No requerido',
};
export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({
    queryKey: ['player-profile', id],
    queryFn: () => api<any>(`/players/${id}/profile`),
  });
  if (q.isLoading) return <div className="card animate-pulse">Cargando perfil...</div>;
  if (q.isError)
    return <div className="card text-red-700">No pudimos cargar el perfil del jugador.</div>;
  const d = q.data,
    p = d.player,
    s = d.participation,
    c = d.competition;
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link href="/players" className="inline-flex gap-2 text-blue-700">
        <ArrowLeft /> Volver a jugadores
      </Link>
      <header className="card bg-[#091426] text-white">
        <div className="flex justify-between">
          <div>
            <h1 className="text-3xl font-bold">{p.name}</h1>
            <p>
              Nivel {p.defaultLevel} · {p.active ? 'Activo' : 'Inactivo'}
            </p>
          </div>
          <span className="rounded-full bg-lime-300 px-3 py-1 self-start text-slate-900">
            {d.hasDebt ? money(s.totalPending) + ' pendiente' : 'Al día'}
          </span>
        </div>
        {p.notes && <p className="mt-4 text-white/70">{p.notes}</p>}
      </header>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {[
          ['Jornadas', s.totalParticipations],
          ['Partidos', c.matchesPlayed],
          ['Victorias', c.matchesWon],
          ['Rendimiento', `${c.winRate}%`],
          ['Campeonatos', c.championships],
          ['Saldo', money(s.totalPending)],
        ].map((x) => (
          <div className="card" key={x[0]}>
            <small>{x[0]}</small>
            <b className="block text-xl">{x[1]}</b>
          </div>
        ))}
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card">
          <h2 className="text-xl font-bold">Rendimiento</h2>
          <dl className="mt-3 grid grid-cols-2 gap-2">
            <Stat n="Ganados" v={c.matchesWon} />
            <Stat n="Perdidos" v={c.matchesLost} />
            <Stat n="Puntos a favor" v={c.pointsFor} />
            <Stat n="Puntos en contra" v={c.pointsAgainst} />
            <Stat n="Diferencia" v={c.pointDifference} />
            <Stat n="Nivel promedio" v={d.historicalLevel.averageLevel ?? '—'} />
          </dl>
        </section>
        <section className="card">
          <h2 className="text-xl font-bold">Finanzas</h2>
          <dl className="mt-3 grid grid-cols-2 gap-2">
            <Stat n="Total debido" v={money(s.totalDue)} />
            <Stat n="Total pagado" v={money(s.totalPaid)} />
            <Stat n="Pendiente" v={money(s.totalPending)} />
            <Stat n="Créditos" v={money(s.totalCredit)} />
            <Stat n="Efectivo" v={money(s.cashPaid)} />
            <Stat n="Transferencia" v={money(s.transferPaid)} />
          </dl>
        </section>
      </div>
      <section>
        <h2 className="mb-3 text-xl font-bold">Historial de jornadas</h2>
        <div className="space-y-3">
          {d.recentParticipations.map((x: any) => (
            <Link href={`/sessions/${x.id}`} className="card block" key={x.id}>
              <div className="flex justify-between">
                <b>{x.venueNameSnapshot}</b>
                <span>{labels[x.status] || x.status}</span>
              </div>
              <p className="text-sm text-slate-500">
                {new Date(x.date + 'T00:00:00').toLocaleDateString('es-CO')} ·{' '}
                {x.teamName || 'Sin equipo'} · Nivel {x.levelSnapshot}
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                <span>
                  {x.wins} V / {x.losses} D
                </span>
                {x.champion && (
                  <span className="text-amber-600">
                    <Trophy className="inline" size={15} /> Campeón
                  </span>
                )}
                <span>
                  {money(x.amountPaid)} / {money(x.amountDue)}
                </span>
                <b>{labels[x.paymentStatus]}</b>
              </div>
            </Link>
          ))}
          {!d.recentParticipations.length && (
            <div className="card text-center">Este jugador aún no tiene participaciones.</div>
          )}
        </div>
      </section>
    </div>
  );
}
function Stat({ n, v }: { n: string; v: any }) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{n}</dt>
      <dd className="font-bold">{v}</dd>
    </div>
  );
}
