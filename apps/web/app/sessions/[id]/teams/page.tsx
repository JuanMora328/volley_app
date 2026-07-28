'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, ChevronDown, Loader2, RefreshCw, Save, Shuffle, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../../../lib/api';
import { SessionDetail, SessionTeam } from '../../../../lib/sessions';
export default function TeamsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['session', id],
    queryFn: () => api<SessionDetail>(`/sessions/${id}`),
  });
  const [draft, setDraft] = useState<SessionTeam[]>([]);
  const [editing, setEditing] = useState(false);
  const [confirmation, setConfirmation] = useState<'generate' | 'regenerate' | 'confirm' | null>(
    null,
  );
  useEffect(() => {
    if (query.data && !editing) setDraft(query.data.teams);
  }, [query.data, editing]);
  const refresh = () => client.invalidateQueries({ queryKey: ['session', id] });
  const generate = useMutation({
    mutationFn: () => api(`/sessions/${id}/teams/generate`, { method: 'POST', body: '{}' }),
    onSuccess: () => {
      setConfirmation(null);
      refresh();
      toast.success('Equipos equilibrados generados');
    },
    onError: () => toast.error('No pudimos generar los equipos'),
  });
  const save = useMutation({
    mutationFn: () =>
      api(`/sessions/${id}/teams`, {
        method: 'PUT',
        body: JSON.stringify({
          teams: draft.map((t) => ({
            name: t.name,
            color: t.color,
            sessionPlayerIds: t.players.map((p) => p.id),
          })),
        }),
      }),
    onSuccess: () => {
      setConfirmation(null);
      setEditing(false);
      refresh();
      toast.success('Composición guardada');
    },
    onError: () => toast.error('La composición no es válida'),
  });
  const confirm = useMutation({
    mutationFn: () => api(`/sessions/${id}/teams/confirm`, { method: 'POST', body: '{}' }),
    onSuccess: () => {
      setConfirmation(null);
      toast.success('Equipos confirmados');
      router.push(`/sessions/${id}`);
    },
    onError: () => toast.error('No se pudieron confirmar los equipos'),
  });
  if (query.isLoading)
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <div className="card h-32 animate-pulse" key={n} />
        ))}
      </div>
    );
  if (!query.data) return <div className="card text-red-700">No pudimos cargar la jornada.</div>;
  const s = query.data;
  const move = (playerId: string, from: number, to: number) => {
    if (from === to) return;
    setDraft((current) =>
      current.map((team, index) =>
        index === from
          ? { ...team, players: team.players.filter((p) => p.id !== playerId) }
          : index === to
            ? {
                ...team,
                players: [...team.players, current[from].players.find((p) => p.id === playerId)!],
              }
            : team,
      ),
    );
  };
  return (
    <div className="space-y-6">
      <header>
        <p className="font-semibold text-[#0051d5]">
          {s.teamCount} equipos · {s.participants.length} jugadores
        </p>
        <h1 className="text-3xl font-bold">Generación de equipos</h1>
      </header>
      {!draft.length ? (
        <section className="card py-12 text-center">
          <Shuffle className="mx-auto mb-4 text-[#0051d5]" size={48} />
          <h2 className="text-xl font-bold">Aún no hay equipos</h2>
          <p className="mb-5 text-slate-500">
            Usaremos nivel, tamaño y fuerza normalizada para equilibrarlos.
          </p>
          <button
            className="btn mx-auto"
            disabled={!s.allowedActions.manageTeams || generate.isPending}
            onClick={() => setConfirmation('generate')}
          >
            Generar equipos equilibrados
          </button>
        </section>
      ) : (
        <>
          <section className="rounded-2xl bg-lime-50 p-4 text-lime-900">
            <b>Equilibrio {s.metrics?.label}</b>
            <p>
              Diferencia máxima de promedios: {s.metrics?.maxAverageDiff.toFixed(2)} · Varianza:{' '}
              {s.metrics?.averageVariance.toFixed(3)}
            </p>
          </section>
          <div className="grid gap-4 lg:grid-cols-2">
            {draft.map((team, teamIndex) => {
              const sum = team.players.reduce((a, p) => a + p.levelSnapshot, 0);
              return (
                <article
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                  key={team.id}
                >
                  <header className="flex justify-between bg-[#1e293b] p-4 text-white">
                    {editing ? (
                      <input
                        aria-label={`Nombre de ${team.name}`}
                        className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/30 bg-white px-3 font-bold text-slate-900 outline-none ring-blue-300 focus:ring-4"
                        value={team.name}
                        onChange={(e) =>
                          setDraft((current) =>
                            current.map((t, i) =>
                              i === teamIndex ? { ...t, name: e.target.value } : t,
                            ),
                          )
                        }
                      />
                    ) : (
                      <h2 className="text-xl font-bold">{team.name}</h2>
                    )}
                    <div className="text-right">
                      <b>{team.players.length} jugadores</b>
                      <p>
                        Σ {sum} · Ø {(sum / team.players.length).toFixed(2)}
                      </p>
                    </div>
                  </header>
                  <div className="space-y-2 p-3">
                    {team.players.map((player) => (
                      <div
                        className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                        key={player.id}
                      >
                        <span>
                          {player.playerNameSnapshot} · <b>N{player.levelSnapshot}</b>
                        </span>
                        {editing && (
                          <div className="relative shrink-0">
                            <select
                              aria-label={`Mover ${player.playerNameSnapshot}`}
                              className="min-h-11 max-w-36 appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-3 pr-9 font-semibold text-slate-700 outline-none focus:border-secondary focus:ring-4 focus:ring-blue-100"
                              value={teamIndex}
                              onChange={(e) => move(player.id, teamIndex, Number(e.target.value))}
                            >
                              {draft.map((target, index) => (
                                <option key={target.id} value={index}>
                                  {target.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary"
                              size={17}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
          <div className={`grid gap-3 ${editing ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
            {editing ? (
              <>
                <button
                  className="btn-secondary w-full"
                  onClick={() => {
                    setDraft(s.teams);
                    setEditing(false);
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="btn w-full"
                  disabled={save.isPending}
                  onClick={() => save.mutate()}
                >
                  <Save aria-hidden="true" size={20} />
                  <span>Guardar cambios</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn-secondary w-full"
                  disabled={!s.allowedActions.manageTeams || generate.isPending}
                  onClick={() => setConfirmation('regenerate')}
                >
                  <RefreshCw aria-hidden="true" size={20} />
                  <span>Regenerar</span>
                </button>
                <button
                  className="btn-secondary w-full"
                  disabled={!s.allowedActions.manageTeams}
                  onClick={() => setEditing(true)}
                >
                  <span>Editar manualmente</span>
                </button>
                <button
                  className="btn w-full"
                  disabled={!s.allowedActions.confirmTeams || confirm.isPending}
                  onClick={() => setConfirmation('confirm')}
                >
                  <CheckCircle aria-hidden="true" size={20} />
                  <span>Confirmar equipos</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
      {confirmation && (
        <TeamConfirmationModal
          action={confirmation}
          pending={generate.isPending || confirm.isPending}
          close={() => setConfirmation(null)}
          accept={() => {
            if (confirmation === 'confirm') confirm.mutate();
            else generate.mutate();
          }}
        />
      )}
    </div>
  );
}

function TeamConfirmationModal({
  action,
  pending,
  close,
  accept,
}: {
  action: 'generate' | 'regenerate' | 'confirm';
  pending: boolean;
  close(): void;
  accept(): void;
}) {
  const confirming = action === 'confirm';
  const regenerating = action === 'regenerate';
  const title = confirming
    ? '¿Confirmar los equipos?'
    : regenerating
      ? '¿Regenerar los equipos?'
      : '¿Generar equipos equilibrados?';
  const description = confirming
    ? 'Esta composición quedará bloqueada y la jornada avanzará al estado Equipos creados. Después no podrás editar jugadores ni equipos.'
    : regenerating
      ? 'La composición actual será reemplazada por una nueva alternativa equilibrada. Los participantes no cambiarán.'
      : 'Crearemos una propuesta usando el nivel de los jugadores y tamaños equilibrados. Podrás revisarla antes de confirmar.';
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-confirmation-title"
      className="fixed inset-0 z-[70] flex items-end bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) close();
      }}
    >
      <section className="w-full rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div
            className={`rounded-2xl p-3 ${confirming ? 'bg-lime-100 text-lime-800' : 'bg-blue-100 text-secondary'}`}
          >
            {confirming ? <CheckCircle aria-hidden="true" /> : <Shuffle aria-hidden="true" />}
          </div>
          <button
            type="button"
            aria-label="Cerrar confirmación"
            disabled={pending}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            onClick={close}
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <h2 id="team-confirmation-title" className="text-2xl font-bold text-primary">
          {title}
        </h2>
        <p className="mt-2 text-slate-600">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" disabled={pending} onClick={close}>
            Cancelar
          </button>
          <button type="button" className="btn" disabled={pending} onClick={accept}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" size={18} />}
            {confirming
              ? 'Sí, confirmar equipos'
              : regenerating
                ? 'Sí, regenerar'
                : 'Generar equipos'}
          </button>
        </div>
      </section>
    </div>
  );
}
