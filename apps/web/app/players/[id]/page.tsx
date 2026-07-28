/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Crown,
  Medal,
  Star,
  Target,
  TrendingUp,
  Trophy,
  UserRound,
  Volleyball,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
import {
  formatDateEs,
  paymentPresentation,
  PaymentPresentationStatus,
} from '../../../lib/presentation';
const money = (v: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(v || 0);
const sessionLabel: Record<string, string> = {
  FINISHED: 'Finalizada',
  CANCELLED: 'Cancelada',
  DRAFT: 'Borrador',
  TEAMS_CREATED: 'Equipos listos',
  IN_PROGRESS: 'En juego',
  SETTLEMENT: 'Liquidación',
};
const sessionStyle: Record<string, string> = {
  FINISHED: 'bg-lime-200 text-lime-950',
  CANCELLED: 'bg-red-100 text-red-800',
  DRAFT: 'bg-slate-200 text-slate-700',
  TEAMS_CREATED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-green-100 text-green-800',
  SETTLEMENT: 'bg-amber-100 text-amber-900',
};
export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({
    queryKey: ['player-profile', id],
    queryFn: () => api<any>(`/players/${id}/profile`),
  });
  if (q.isLoading) return <ProfileSkeleton />;
  if (q.isError)
    return (
      <div className="mx-auto max-w-5xl rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
        <b className="text-lg">No pudimos cargar el perfil</b>
        <p className="mt-1 text-sm">Revisa tu conexión e intenta nuevamente.</p>
      </div>
    );
  const d = q.data,
    p = d.player,
    s = d.participation,
    c = d.competition;
  const initials = p.name
    .split(' ')
    .slice(0, 2)
    .map((x: string) => x[0])
    .join('')
    .toUpperCase();
  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-4">
      <Link
        href="/players"
        className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 font-semibold text-[#0051d5] hover:bg-blue-50"
      >
        <ArrowLeft size={20} /> Volver a jugadores
      </Link>
      <header className="relative overflow-hidden rounded-3xl bg-[#091426] p-6 text-white shadow-xl shadow-slate-900/10 md:p-8">
        <div className="absolute -right-14 -top-16 h-52 w-52 rounded-full bg-[#316bf3]/30 blur-2xl" />
        <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-[#acf847]/10 blur-2xl" />
        <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full border-4 border-white/20 bg-gradient-to-br from-[#316bf3] to-[#0051d5] text-3xl font-extrabold shadow-lg">
            {initials}
            <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-[#091426] bg-[#acf847] text-[#102000]">
              <Volleyball size={16} />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{p.name}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm font-bold ring-1 ring-white/20">
                <Star size={14} className="fill-[#acf847] text-[#acf847]" />
                Nivel {p.defaultLevel}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold ${p.active ? 'bg-[#acf847] text-[#102000]' : 'bg-slate-600 text-white'}`}
              >
                {p.active ? 'ACTIVO' : 'INACTIVO'}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${d.hasDebt ? 'bg-amber-300 text-amber-950' : 'bg-green-200 text-green-950'}`}
              >
                {d.hasDebt ? `${money(s.totalPending)} pendiente` : 'Pagos al día'}
              </span>
            </div>
            {p.notes && (
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{p.notes}</p>
            )}
          </div>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[
          ['Jornadas', s.totalParticipations, CalendarDays, 'bg-blue-50 text-blue-700'],
          ['Partidos', c.matchesPlayed, Volleyball, 'bg-indigo-50 text-indigo-700'],
          ['Victorias', c.matchesWon, Trophy, 'bg-lime-50 text-lime-700'],
          ['Rendimiento', `${c.winRate}%`, TrendingUp, 'bg-emerald-50 text-emerald-700'],
          ['Campeonatos', c.championships, Crown, 'bg-amber-50 text-amber-700'],
          [
            'Saldo',
            money(s.totalPending),
            CircleDollarSign,
            s.totalPending ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700',
          ],
        ].map(([label, value, Icon, tone]: any) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            key={label}
          >
            <span className={`mb-3 inline-grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
              <Icon size={19} />
            </span>
            <b className="block truncate text-xl text-[#091426]">{value}</b>
            <small className="font-medium text-slate-500">{label}</small>
          </article>
        ))}
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel icon={Target} title="Rendimiento" subtitle="Resultados históricos confirmados">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Ganados" value={c.matchesWon} tone="text-green-700" />
            <Metric label="Perdidos" value={c.matchesLost} tone="text-red-600" />
            <Metric label="Puntos a favor" value={c.pointsFor} />
            <Metric label="Puntos en contra" value={c.pointsAgainst} />
            <Metric
              label="Diferencia"
              value={signed(c.pointDifference)}
              tone={c.pointDifference >= 0 ? 'text-green-700' : 'text-red-600'}
            />
            <Metric label="Nivel promedio" value={d.historicalLevel.averageLevel ?? '—'} />
          </div>
        </Panel>
        <Panel
          icon={Banknote}
          title="Resumen financiero"
          subtitle="Liquidaciones y pagos registrados"
        >
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Total debido" value={money(s.totalDue)} />
            <Metric label="Total pagado" value={money(s.totalPaid)} tone="text-green-700" />
            <Metric
              label="Pendiente"
              value={money(s.totalPending)}
              tone={s.totalPending ? 'text-red-600' : 'text-green-700'}
            />
            <Metric label="Créditos" value={money(s.totalCredit)} tone="text-blue-700" />
            <Metric label="Efectivo" value={money(s.cashPaid)} />
            <Metric label="Transferencia" value={money(s.transferPaid)} />
          </div>
        </Panel>
      </div>
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#091426]">Historial de jornadas</h2>
            <p className="text-sm text-slate-500">Últimas participaciones con datos históricos</p>
          </div>
        </div>
        <div className="space-y-3">
          {d.recentParticipations.map((x: any) => (
            <Participation key={x.id} item={x} />
          ))}
          {!d.recentParticipations.length && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <UserRound className="mx-auto mb-3 text-slate-400" size={38} />
              <b className="text-[#091426]">Sin participaciones todavía</b>
              <p className="mt-1 text-sm text-slate-500">
                Su historial aparecerá cuando sea agregado a una jornada.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
function Participation({ item: x }: { item: any }) {
  const payment = paymentPresentation[(x.paymentStatus || 'PENDING') as PaymentPresentationStatus];
  return (
    <Link
      href={`/sessions/${x.id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex">
        <div className={`w-1.5 shrink-0 ${payment.dot}`} />
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {formatDateEs(x.date)}
              </p>
              <h3 className="mt-1 truncate text-lg font-extrabold text-[#091426]">
                {x.venueNameSnapshot}
              </h3>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${sessionStyle[x.status] || sessionStyle.DRAFT}`}
            >
              {sessionLabel[x.status] || x.status}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm min-[380px]:grid-cols-2 lg:grid-cols-4">
            <Info label="Equipo" value={x.teamName || 'Sin equipo'} />
            <Info label="Nivel histórico" value={`Nivel ${x.levelSnapshot}`} />
            <Info label="Resultado" value={`${x.wins} V · ${x.losses} D`} />
            <Info label="Liquidación" value={`${money(x.amountPaid)} / ${money(x.amountDue)}`} />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ring-inset ${payment.badge}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${payment.dot}`} />
                {payment.label}
              </span>
              {x.champion && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-extrabold text-amber-900">
                  <Medal size={13} />
                  Campeón
                </span>
              )}
            </div>
            <ChevronRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
          </div>
        </div>
      </div>
    </Link>
  );
}
function Panel({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: any;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-[#0051d5]">
          <Icon size={21} />
        </span>
        <div>
          <h2 className="font-extrabold text-[#091426]">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
function Metric({
  label,
  value,
  tone = 'text-[#091426]',
}: {
  label: string;
  value: any;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <small className="block text-slate-500">{label}</small>
      <b className={`mt-1 block text-lg ${tone}`}>{value}</b>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2">
      <small className="block text-slate-400">{label}</small>
      <b className="block break-words leading-5 text-slate-700">{value}</b>
    </div>
  );
}
function signed(v: number) {
  return v > 0 ? `+${v}` : String(v);
}
function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-4" aria-label="Cargando perfil">
      <div className="h-11 w-40 animate-pulse rounded-xl bg-slate-200" />
      <div className="h-52 animate-pulse rounded-3xl bg-slate-200" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div className="h-28 animate-pulse rounded-2xl bg-slate-200" key={i} />
        ))}
      </div>
    </div>
  );
}
