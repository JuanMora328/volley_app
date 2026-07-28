'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  CreditCard,
  LayoutDashboard,
  Loader2,
  MapPin,
  Shield,
  Trophy,
  Trash2,
  Users,
  UsersRound,
  Volleyball,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '../../../lib/api';
import { money, SessionDetail, sessionStatusLabel } from '../../../lib/sessions';
export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [actionDialog, setActionDialog] = useState<'cancel' | 'delete' | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [actionError, setActionError] = useState('');
  const destructive = useMutation({
    mutationFn: ({ path, method, body }: { path: string; method: string; body?: object }) =>
      api(path, { method, body: body ? JSON.stringify(body) : undefined }),
    onSuccess: async (_, variables) => {
      setActionDialog(null);
      setDeleteConfirmation('');
      setActionError('');
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });
      if (variables.method === 'DELETE') router.push('/sessions');
      else void query.refetch();
    },
    onError: (error: Error) => setActionError(error.message),
  });
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
            <p className="text-lime-300">{sessionStatusLabel(s.status)}</p>
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
        <Link
          className="col-span-3 flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-secondary hover:bg-blue-50 sm:col-span-1"
          href={`/sessions/${id}/matches`}
        >
          <Trophy size={20} />
          <span className="text-xs font-semibold sm:text-sm">Partidos</span>
        </Link>
        <Link
          className="col-span-3 flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-secondary hover:bg-blue-50 sm:col-span-1"
          href={`/sessions/${id}/payments`}
        >
          <CreditCard size={20} />
          <span className="text-xs font-semibold sm:text-sm">Pagos</span>
        </Link>
      </nav>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link className="btn-secondary text-center" href={`/sessions/${id}/settlement`}>
          Finalizar jornada
        </Link>
        <Link className="btn-secondary text-center" href={`/sessions/${id}/summary`}>
          Resumen final
        </Link>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Cancha" value={money(s.courtPrice)} />
        <Metric label="Gatorade por unidad" value={money(s.gatoradePrice)} />
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
      <section className="card border-red-200">
        <h2 className="text-xl font-bold">Acciones de la jornada</h2>
        <p className="my-3 text-sm text-slate-600">
          Cancelar no es lo mismo que finalizar: conserva la jornada y su historial, pero impide
          continuar jugando. Finalizar será parte del cierre deportivo y financiero. Eliminar borra
          físicamente todo el agregado.
        </p>
        <div className="flex flex-wrap gap-3">
          {s.status !== 'CANCELLED' && (
            <button
              className="rounded-xl border border-amber-500 px-4 py-3 font-bold text-amber-800"
              onClick={() => {
                setActionError('');
                setActionDialog('cancel');
              }}
            >
              Cancelar jornada
            </button>
          )}
          <button
            className="rounded-xl bg-red-700 px-4 py-3 font-bold text-white"
            onClick={() => {
              setActionError('');
              setDeleteConfirmation('');
              setActionDialog('delete');
            }}
          >
            Eliminar permanentemente
          </button>
        </div>
      </section>
      {actionDialog === 'cancel' && (
        <SessionActionDialog
          icon={<AlertTriangle size={32} />}
          tone="warning"
          title="¿Cancelar esta jornada?"
          description="Cancelar conservará la jornada, sus equipos, participantes y partidos, pero quedará en modo de solo lectura y no podrás continuar jugando. Esto no finaliza ni liquida la jornada."
          error={actionError}
          pending={destructive.isPending}
          confirmLabel="Sí, cancelar jornada"
          onClose={() => setActionDialog(null)}
          onConfirm={() => destructive.mutate({ path: `/sessions/${id}/cancel`, method: 'POST' })}
        />
      )}
      {actionDialog === 'delete' && (
        <SessionActionDialog
          icon={<Trash2 size={32} />}
          tone="danger"
          title="Eliminar jornada permanentemente"
          description="Esta acción eliminará la jornada, sus equipos, participantes y partidos. No se puede deshacer."
          error={actionError}
          pending={destructive.isPending}
          confirmLabel="Eliminar"
          confirmDisabled={deleteConfirmation.trim() !== 'ELIMINAR'}
          onClose={() => setActionDialog(null)}
          onConfirm={() =>
            destructive.mutate({
              path: `/sessions/${id}`,
              method: 'DELETE',
              body: { confirmation: deleteConfirmation.trim() },
            })
          }
        >
          <label className="mt-5 block text-left text-sm font-bold" htmlFor="delete-confirmation">
            Escribe <span className="text-red-700">ELIMINAR</span> para confirmar
          </label>
          <input
            autoComplete="off"
            autoFocus
            className="input mt-2 w-full"
            id="delete-confirmation"
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            placeholder="ELIMINAR"
            value={deleteConfirmation}
          />
        </SessionActionDialog>
      )}
    </div>
  );
}
function SessionActionDialog({
  icon,
  tone,
  title,
  description,
  error,
  pending,
  confirmLabel,
  confirmDisabled = false,
  onClose,
  onConfirm,
  children,
}: {
  icon: React.ReactNode;
  tone: 'warning' | 'danger';
  title: string;
  description: string;
  error: string;
  pending: boolean;
  confirmLabel: string;
  confirmDisabled?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children?: React.ReactNode;
}) {
  const danger = tone === 'danger';
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => !pending && event.target === event.currentTarget && onClose()}
      role="presentation"
    >
      <section
        aria-describedby="session-action-description"
        aria-labelledby="session-action-title"
        aria-modal="true"
        className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl"
        role="dialog"
      >
        <div
          className={`mx-auto grid size-16 place-items-center rounded-full ${danger ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}
        >
          {icon}
        </div>
        <h2 className="mt-4 text-2xl font-black" id="session-action-title">
          {title}
        </h2>
        <p className="mt-3 text-slate-600" id="session-action-description">
          {description}
        </p>
        {children}
        {error && (
          <p
            className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            className="rounded-xl border border-slate-300 px-4 py-3 font-bold"
            disabled={pending}
            onClick={onClose}
          >
            Volver
          </button>
          <button
            className={`min-w-0 whitespace-normal break-words rounded-xl px-3 py-3 text-sm font-bold leading-tight text-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-base ${danger ? 'bg-red-700' : 'bg-amber-600'}`}
            disabled={confirmDisabled || pending}
            onClick={onConfirm}
          >
            {pending ? 'Procesando…' : confirmLabel}
          </button>
        </div>
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
