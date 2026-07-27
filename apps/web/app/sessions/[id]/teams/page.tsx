'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, RefreshCw, Save, Shuffle } from 'lucide-react';
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
  useEffect(() => {
    if (query.data && !editing) setDraft(query.data.teams);
  }, [query.data, editing]);
  const refresh = () => client.invalidateQueries({ queryKey: ['session', id] });
  const generate = useMutation({
    mutationFn: () => api(`/sessions/${id}/teams/generate`, { method: 'POST', body: '{}' }),
    onSuccess: () => {
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
      setEditing(false);
      refresh();
      toast.success('Composición guardada');
    },
    onError: () => toast.error('La composición no es válida'),
  });
  const confirm = useMutation({
    mutationFn: () => api(`/sessions/${id}/teams/confirm`, { method: 'POST', body: '{}' }),
    onSuccess: () => {
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
            onClick={() => generate.mutate()}
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
                        className="rounded bg-white px-2 text-slate-900"
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
                          <select
                            aria-label={`Mover ${player.playerNameSnapshot}`}
                            className="rounded border p-2"
                            value={teamIndex}
                            onChange={(e) => move(player.id, teamIndex, Number(e.target.value))}
                          >
                            {draft.map((target, index) => (
                              <option key={target.id} value={index}>
                                {target.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {editing ? (
              <>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setDraft(s.teams);
                    setEditing(false);
                  }}
                >
                  Cancelar
                </button>
                <button className="btn" disabled={save.isPending} onClick={() => save.mutate()}>
                  <Save /> Guardar cambios
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn-secondary"
                  disabled={!s.allowedActions.manageTeams || generate.isPending}
                  onClick={() => {
                    if (window.confirm('¿Reemplazar la composición actual?')) generate.mutate();
                  }}
                >
                  <RefreshCw /> Regenerar
                </button>
                <button
                  className="btn-secondary"
                  disabled={!s.allowedActions.manageTeams}
                  onClick={() => setEditing(true)}
                >
                  Editar manualmente
                </button>
                <button
                  className="btn"
                  disabled={!s.allowedActions.confirmTeams || confirm.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        'Después de confirmar no podrás editar participantes ni equipos. ¿Continuar?',
                      )
                    )
                      confirm.mutate();
                  }}
                >
                  <CheckCircle /> Confirmar equipos
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
