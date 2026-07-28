'use client';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Plus,
  Sparkles,
  Users,
  Wallet,
  Volleyball,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { api, DashboardResponse, getToken } from '../lib/api';
import { formatDateEs } from '../lib/presentation';
import { sessionStatusLabel } from '../lib/sessions';
const statusTone: Record<string, string> = {
  FINISHED: 'bg-lime-200 text-lime-950',
  CANCELLED: 'bg-red-100 text-red-800',
  DRAFT: 'bg-slate-200 text-slate-800',
  TEAMS_CREATED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-green-100 text-green-800',
  SETTLEMENT: 'bg-amber-100 text-amber-900',
};
const money = (v: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(v || 0);
export default function Dashboard() {
  const router = useRouter();
  useEffect(() => {
    if (!getToken()) router.replace('/login');
  }, [router]);
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ name: string }>('/auth/me'),
    retry: false,
  });
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardResponse>('/dashboard'),
    retry: false,
  });
  const data = dashboard.data;
  if (me.isLoading || dashboard.isLoading) return <DashboardSkeleton />;
  if (me.isError || dashboard.isError)
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
        <b className="text-lg">No pudimos cargar el inicio</b>
        <p className="mt-1 text-sm">Vuelve a iniciar sesión o inténtalo nuevamente.</p>
      </div>
    );
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-4">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#091426] via-[#102446] to-[#0051d5] p-6 text-white shadow-xl shadow-blue-950/10 md:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#acf847]/15 blur-2xl" />
        <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-blue-300/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold ring-1 ring-white/20">
              <Sparkles size={14} className="text-[#acf847]" />
              CENTRO DE CONTROL
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              ¡Hola, {me.data?.name ?? 'Organizador'}!
            </h1>
            <p className="mt-2 max-w-xl text-blue-100">
              Todo listo para organizar la próxima jornada y mantener tu comunidad al día.
            </p>
          </div>
          <button
            onClick={() => router.push('/sessions/new')}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#acf847] px-5 font-extrabold text-[#102000] shadow-lg transition hover:-translate-y-0.5 hover:bg-lime-300"
          >
            <Plus size={20} />
            Nueva jornada
          </button>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          title="Jugadores activos"
          value={data?.stats.activePlayers ?? 0}
          icon={Users}
          gradient="from-blue-500 to-blue-700"
        />
        <Stat
          title="Jornadas finalizadas"
          value={data?.stats.completedSessions ?? 0}
          icon={CalendarCheck}
          gradient="from-lime-500 to-green-600"
        />
        <Stat
          title="Pagos pendientes"
          value={money(data?.stats.pendingPayments ?? 0)}
          icon={Wallet}
          gradient="from-rose-500 to-red-600"
        />
        <Stat
          title="Partidos registrados"
          value={data?.stats.registeredMatches ?? 0}
          icon={Volleyball}
          gradient="from-amber-400 to-orange-500"
        />
      </section>
      <section className="grid gap-5 lg:grid-cols-5">
        <article className="relative overflow-hidden rounded-3xl bg-[#1e293b] p-6 text-white shadow-lg lg:col-span-3">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/20 blur-xl" />
          {data?.activeSession ? (
            <ActiveSession session={data.activeSession} />
          ) : (
            <div className="relative flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-white/25 bg-white/[.03] px-6 text-center">
              <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#acf847] text-[#102000] shadow-lg">
                <Volleyball size={28} />
              </span>
              <h2 className="text-xl font-extrabold">No hay una jornada activa</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">
                Crea una jornada, selecciona participantes y genera equipos equilibrados.
              </p>
              <button
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-bold text-[#091426] transition hover:bg-blue-50"
                onClick={() => router.push('/sessions/new')}
              >
                Comenzar ahora <ArrowRight size={17} />
              </button>
            </div>
          )}
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <CircleDollarSign size={22} />
            </span>
            <div>
              <h2 className="font-extrabold text-[#091426]">Estado de pagos</h2>
              <p className="text-xs text-slate-500">Resumen general por recaudar</p>
            </div>
          </div>
          <div
            className={`mt-5 rounded-2xl p-5 ${data?.stats.pendingPayments ? 'bg-red-50' : 'bg-green-50'}`}
          >
            <small className={data?.stats.pendingPayments ? 'text-red-600' : 'text-green-700'}>
              Saldo pendiente
            </small>
            <b
              className={`mt-1 block text-3xl ${data?.stats.pendingPayments ? 'text-red-700' : 'text-green-800'}`}
            >
              {money(data?.stats.pendingPayments ?? 0)}
            </b>
            <p className="mt-2 text-sm text-slate-600">
              {data?.stats.pendingPayments
                ? 'Hay pagos que necesitan seguimiento.'
                : 'Excelente, no hay pagos pendientes.'}
            </p>
          </div>
          <Link
            href="/sessions?financialStatus=PENDING"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 font-bold text-blue-700 transition hover:bg-blue-50"
          >
            Revisar jornadas <ChevronRight size={17} />
          </Link>
        </article>
      </section>
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#091426]">Jornadas recientes</h2>
            <p className="text-sm text-slate-500">
              Continúa trabajando o consulta las últimas actividades
            </p>
          </div>
          <Link
            href="/sessions"
            className="hidden items-center gap-1 text-sm font-bold text-blue-700 sm:inline-flex"
          >
            Ver historial <ChevronRight size={17} />
          </Link>
        </div>
        {data?.recentSessions.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.recentSessions.map((session, index) => (
              <RecentSession session={session} index={index} key={session.id} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <CalendarDays size={24} />
            </span>
            <b className="text-[#091426]">Todavía no hay jornadas registradas</b>
            <p className="mt-1 text-sm text-slate-500">Tu actividad reciente aparecerá aquí.</p>
          </div>
        )}
      </section>
    </div>
  );
}
function Stat({
  title,
  value,
  icon: Icon,
  gradient,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/60 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`absolute -right-5 -top-5 h-20 w-20 rounded-full bg-gradient-to-br ${gradient} opacity-10`}
      />
      <span
        className={`mb-3 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white ${gradient}`}
      >
        <Icon size={19} />
      </span>
      <b className="block truncate text-2xl text-[#091426]">{value}</b>
      <small className="font-semibold text-slate-500">{title}</small>
    </article>
  );
}
function ActiveSession({ session }: { session: NonNullable<DashboardResponse['activeSession']> }) {
  return (
    <div className="relative">
      <span className="inline-flex items-center gap-1 rounded-full bg-green-300 px-3 py-1 text-xs font-extrabold text-green-950">
        <span className="h-2 w-2 animate-pulse rounded-full bg-green-700" />
        JORNADA ACTIVA
      </span>
      <h2 className="mt-4 text-2xl font-extrabold">{session.title}</h2>
      <p className="mt-1 flex items-center gap-2 text-slate-300">
        <CalendarDays size={16} />
        {formatDateEs(session.date)} · {session.venueName}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/10 p-3">
          <small className="text-slate-300">Participantes</small>
          <b className="block text-xl">
            {session.participantCount}{' '}
            {session.participantCount === 1 ? 'registrado' : 'registrados'}
          </b>
        </div>
        <div className="rounded-2xl bg-white/10 p-3">
          <small className="text-slate-300">Estado</small>
          <b className="block text-lg">{session.statusLabel}</b>
        </div>
      </div>
      <Link
        href={`/sessions/${session.id}`}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-bold text-[#091426]"
      >
        Abrir jornada <ArrowRight size={17} />
      </Link>
    </div>
  );
}
function RecentSession({
  session,
  index,
}: {
  session: DashboardResponse['recentSessions'][number];
  index: number;
}) {
  return (
    <Link
      href={`/sessions/${session.id}`}
      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
    >
      <div
        className={`h-1.5 ${index === 0 ? 'bg-gradient-to-r from-[#0051d5] to-cyan-400' : 'bg-slate-200'}`}
      />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700">
            <CalendarDays size={21} />
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${statusTone[session.status] || statusTone.DRAFT}`}
          >
            {sessionStatusLabel(session.status)}
          </span>
        </div>
        <h3 className="mt-4 truncate text-lg font-extrabold text-[#091426]">{session.title}</h3>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500">
          <Clock3 size={15} />
          {formatDateEs(session.date)}
        </p>
        <div className="mt-4 flex items-center justify-end gap-1 border-t border-slate-100 pt-3 text-sm font-bold text-blue-700">
          Abrir detalle <ChevronRight size={17} className="transition group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-label="Cargando inicio">
      <div className="h-52 animate-pulse rounded-3xl bg-slate-200" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200" key={i} />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />
    </div>
  );
}
