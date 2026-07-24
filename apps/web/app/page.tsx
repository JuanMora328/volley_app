'use client';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Loader2, PlusCircle, Users, Wallet, Volleyball } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { api, DashboardResponse, getToken } from '../lib/api';

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

  if (me.isLoading || dashboard.isLoading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[#0051d5]">
        <Loader2 className="animate-spin" /> <span className="ml-2">Cargando panel...</span>
      </div>
    );
  if (me.isError || dashboard.isError)
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        No pudimos cargar el dashboard. Vuelve a iniciar sesión.
      </div>
    );

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#091426]">
            ¡Hola, {me.data?.name ?? 'Organizador'}!
          </h1>
          <p className="text-[#45474c]">Gestiona tus partidos y jugadores hoy.</p>
        </div>
        <button
          disabled
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0051d5] px-6 font-bold text-white opacity-60"
        >
          <PlusCircle /> Nueva jornada
        </button>
      </section>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-3xl bg-[#1e293b] p-6 text-white shadow-xl lg:col-span-2">
          {data?.activeSession ? (
            <div>{data.activeSession.title}</div>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-white/25 text-center">
              <Volleyball className="mb-3 text-[#acf847]" size={48} />
              <h2 className="text-2xl font-bold">Aún no tienes jornadas activas</h2>
              <p className="mt-2 max-w-sm text-white/70">
                La creación de jornadas se habilitará en una fase posterior.
              </p>
            </div>
          )}
        </section>
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <Stat title="Jugadores activos" value={data?.stats.activePlayers ?? 0} icon={<Users />} />
          <Stat
            title="Jornadas"
            value={data?.stats.completedSessions ?? 0}
            icon={<CalendarDays />}
          />
          <Stat
            title="Pagos pendientes"
            value={`$${data?.stats.pendingPayments ?? 0}`}
            icon={<Wallet />}
            danger
          />
          <Stat title="Partidos" value={data?.stats.registeredMatches ?? 0} icon={<Volleyball />} />
        </section>
      </div>
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <h2 className="mb-4 text-xl font-semibold text-[#091426]">Jornadas recientes</h2>
          <div className="rounded-2xl border border-[#c5c6cd] bg-white p-6 text-center text-[#45474c]">
            {data?.recentSessions.length
              ? 'Hay jornadas recientes.'
              : 'Todavía no hay jornadas registradas.'}
          </div>
        </div>
        <div className="lg:col-span-4">
          <h2 className="mb-4 text-xl font-semibold text-[#091426]">Pagos pendientes</h2>
          <div className="rounded-2xl border border-[#c5c6cd] bg-white p-6 text-center text-[#45474c]">
            No hay pagos pendientes.
          </div>
        </div>
      </section>
    </div>
  );
}
function Stat({
  title,
  value,
  icon,
  danger = false,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border bg-white p-4 shadow-sm ${danger ? 'border-l-4 border-l-red-600' : 'border-[#c5c6cd]'}`}
    >
      <div className="flex justify-between text-sm font-semibold text-[#45474c]">
        <span>{title}</span>
        <span className={danger ? 'text-red-600' : 'text-[#0051d5]'}>{icon}</span>
      </div>
      <p className={`mt-4 text-3xl font-bold ${danger ? 'text-red-600' : 'text-[#091426]'}`}>
        {value}
      </p>
    </article>
  );
}
