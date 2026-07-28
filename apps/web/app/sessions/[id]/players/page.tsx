'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, UserRound, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import { SessionDetail } from '../../../../lib/sessions';
import { FullScreenLoader } from '../../../../components/ui/full-screen-loader';

export default function SessionPlayersPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ['session', id],
    queryFn: () => api<SessionDetail>(`/sessions/${id}`),
  });

  if (query.isLoading) {
    return (
      <FullScreenLoader
        title="Cargando participantes"
        description="Consultando los jugadores de la jornada…"
      />
    );
  }
  if (!query.data) {
    return (
      <div
        className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800"
        role="alert"
      >
        <h1 className="font-bold">No pudimos cargar los participantes</h1>
        <button className="mt-2 font-semibold underline" onClick={() => query.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  const session = query.data;
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 font-semibold text-secondary hover:bg-blue-50"
        href={`/sessions/${id}`}
      >
        <ArrowLeft size={19} /> Volver a la jornada
      </Link>
      <header className="relative overflow-hidden rounded-3xl bg-[#091426] p-6 text-white shadow-xl md:p-8">
        <Users className="absolute -bottom-7 -right-4 size-36 text-white/5" />
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-lime-300">
          Plantilla de la jornada
        </p>
        <div className="relative mt-2 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Participantes</h1>
            <p className="mt-2 text-blue-100">{session.venueNameSnapshot}</p>
          </div>
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl font-black ring-1 ring-white/20">
            {session.participants.length}
          </span>
        </div>
      </header>
      {!session.participants.length ? (
        <section className="card py-14 text-center">
          <UserRound className="mx-auto text-slate-300" size={48} />
          <h2 className="mt-4 text-xl font-bold">Aún no hay participantes</h2>
          <p className="mx-auto mt-2 max-w-md text-slate-500">
            Los jugadores que se agreguen a la jornada aparecerán aquí con su nivel registrado.
          </p>
          <Link className="btn mt-5" href={`/sessions/${id}`}>
            Volver al resumen
          </Link>
        </section>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2">
          {session.participants.map((participant, index) => (
            <article className="card flex items-center gap-4" key={participant.id}>
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 font-extrabold text-secondary">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-bold text-primary">
                  {participant.playerNameSnapshot}
                </h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                  <Star className="fill-amber-400 text-amber-400" size={15} /> Nivel{' '}
                  {participant.levelSnapshot} de 5
                </p>
              </div>
              <Link
                aria-label={`Ver perfil de ${participant.playerNameSnapshot}`}
                className="grid size-11 shrink-0 place-items-center rounded-xl border border-blue-100 text-secondary hover:bg-blue-50"
                href={`/players/${participant.player.id}`}
              >
                <UserRound size={19} />
              </Link>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
