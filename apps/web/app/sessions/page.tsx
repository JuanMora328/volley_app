'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '../../lib/api';
import { sessionStatusLabel } from '../../lib/sessions';
export default function SessionsPage() {
  const query = useQuery({
    queryKey: ['sessions'],
    queryFn: () =>
      api<{
        items: Array<{ id: string; date: string; venueNameSnapshot: string; status: string }>;
      }>('/sessions'),
  });
  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Jornadas</h1>
        <Link className="btn" href="/sessions/new">
          Nueva jornada
        </Link>
      </header>
      {query.isLoading ? (
        <div className="card animate-pulse">Cargando jornadas...</div>
      ) : query.isError ? (
        <div className="card text-red-700">No pudimos cargar las jornadas.</div>
      ) : (
        <div className="space-y-3">
          {query.data?.items.map((s) => (
            <Link className="card flex justify-between" href={`/sessions/${s.id}`} key={s.id}>
              <span>
                <b>{s.venueNameSnapshot}</b>
                <small className="block text-slate-500">{s.date}</small>
              </span>
              <b className="text-[#0051d5]">{sessionStatusLabel(s.status)}</b>
            </Link>
          ))}
          {!query.data?.items.length && (
            <div className="card text-center">No hay jornadas todavía.</div>
          )}
        </div>
      )}
    </div>
  );
}
