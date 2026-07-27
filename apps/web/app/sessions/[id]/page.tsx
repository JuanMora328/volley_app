'use client';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  CreditCard,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  MapPin,
  Shield,
  Trophy,
  Users,
  UsersRound,
  Volleyball,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { money, SessionDetail } from '../../../lib/sessions';
export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ['session', id],
    queryFn: () => api<SessionDetail>(`/sessions/${id}`),
  });
  if (query.isLoading)
    return (
      <div className="card animate-pulse">
        <Loader2 className="animate-spin" /> Cargando jornada...
      </div>
    );
  if (query.isError || !query.data)
    return <div className="card text-red-700">No pudimos cargar la jornada.</div>;
  const s = query.data;
  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-[#1e293b] p-6 text-white">
        <div className="flex justify-between">
          <div>
            <p className="text-lime-300">{s.status}</p>
            <h1 className="text-3xl font-bold">{s.venueNameSnapshot}</h1>
          </div>
          <Volleyball size={38} />
        </div>
        <div className="mt-5 flex flex-wrap gap-4 text-sm">
          <span className="flex gap-2">
            <Calendar />
            {s.date} {s.startTime ?? ''}
          </span>
          <span className="flex gap-2">
            <MapPin />
            {s.venueNameSnapshot}
          </span>
        </div>
      </header>
      <nav
        aria-label="Secciones de la jornada"
        className="grid grid-cols-6 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:grid-cols-5"
      >
        <Link
          aria-current="page"
          className="col-span-2 flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl bg-secondary sm:col-span-1 px-2 py-2 text-center text-white shadow-sm"
          href={`/sessions/${id}`}
        >
          <LayoutDashboard aria-hidden="true" size={20} />
          <span className="text-xs font-bold sm:text-sm">Resumen</span>
        </Link>
        <Link
          className="col-span-2 flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-2 sm:col-span-1 py-2 text-center text-slate-600 transition hover:bg-blue-50 hover:text-secondary"
          href="#players"
        >
          <UsersRound aria-hidden="true" size={20} />
          <span className="text-xs font-semibold sm:text-sm">Jugadores</span>
        </Link>
        <Link
          className="col-span-2 flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-2 sm:col-span-1 py-2 text-center text-slate-600 transition hover:bg-blue-50 hover:text-secondary"
          href={`/sessions/${id}/teams`}
        >
          <Shield aria-hidden="true" size={20} />
          <span className="text-xs font-semibold sm:text-sm">Equipos</span>
        </Link>
        <PendingSection icon={<Trophy aria-hidden="true" size={20} />} label="Partidos" />
        <PendingSection icon={<CreditCard aria-hidden="true" size={20} />} label="Pagos" />
      </nav>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Cancha" value={money(s.courtPrice)} />
        <Metric label="Gatorades" value={money(s.gatoradePrice)} />
        <Metric label="Participantes" value={String(s.participants.length)} />
        <Metric label="Equipos / puntaje" value={`${s.teamCount} / ${s.defaultTargetScore}`} />
      </section>
      <section id="players" className="card">
        <h2 className="text-xl font-bold">Jugadores</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {s.participants.map((p) => (
            <div className="flex justify-between rounded-xl bg-slate-50 p-3" key={p.id}>
              <span>{p.playerNameSnapshot}</span>
              <b>Nivel {p.levelSnapshot}</b>
            </div>
          ))}
        </div>
      </section>
      <section className="card">
        <h2 className="text-xl font-bold">Preparación</h2>
        <p className="my-3 text-slate-600">
          {s.teams.length
            ? `${s.teams.length} equipos preparados.`
            : 'Los participantes están listos para generar equipos.'}
        </p>
        {s.allowedActions.manageTeams && (
          <Link className="btn inline-flex" href={`/sessions/${id}/teams`}>
            <Users /> {s.teams.length ? 'Revisar equipos' : 'Generar equipos'}
          </Link>
        )}
      </section>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <strong className="text-xl">{value}</strong>
    </article>
  );
}
function PendingSection({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      aria-disabled="true"
      className="relative col-span-3 flex min-h-16 cursor-not-allowed sm:col-span-1 flex-col items-center justify-center gap-1 rounded-xl bg-slate-50 px-2 py-2 text-center text-slate-400"
    >
      <span className="absolute right-2 top-2">
        <LockKeyhole aria-hidden="true" size={12} />
      </span>
      {icon}
      <span className="text-xs font-semibold sm:text-sm">{label}</span>
      <span className="sr-only">Pendiente</span>
    </span>
  );
}
