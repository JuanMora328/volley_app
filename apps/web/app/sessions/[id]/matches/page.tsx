'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { History, Loader2, Minus, Plus, RotateCcw, Shuffle, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../../../../lib/api';
type Team = { id: string; name: string; players?: Array<{ playerNameSnapshot: string }> };
type Match = {
  id: string;
  sequence: number;
  teamA: Team;
  teamB: Team;
  teamAScore: number;
  teamBScore: number;
  targetScore: number;
  status: string;
  winnerTeam?: Team;
  canUndo?: boolean;
};
type Rotation = {
  drawn: boolean;
  courtTeam?: Team;
  challengerTeam?: Team;
  waitingQueue?: Team[];
  activeMatch?: Match | null;
  nextSequence?: number;
  currentTargetScore: number;
  canRedraw?: boolean;
  canStartMatch?: boolean;
  canUndoLastResult?: boolean;
};
type Standing = {
  position: number;
  team: Team;
  played: number;
  won: number;
  lost: number;
  points: number;
  pointsFor: number;
  pointsAgainst: number;
  difference: number;
};
export default function MatchControlPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [scores, setScores] = useState([0, 0]);
  const [notice, setNotice] = useState('');
  const rotation = useQuery({
    queryKey: ['rotation', id],
    queryFn: () => api<Rotation>(`/sessions/${id}/rotation`),
  });
  const history = useQuery({
    queryKey: ['matches', id],
    queryFn: () => api<{ items: Match[] }>(`/sessions/${id}/matches`),
  });
  const standings = useQuery({
    queryKey: ['standings', id],
    queryFn: () => api<Standing[]>(`/sessions/${id}/standings`),
  });
  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['rotation', id] }),
      qc.invalidateQueries({ queryKey: ['matches', id] }),
      qc.invalidateQueries({ queryKey: ['standings', id] }),
    ]);
  };
  const action = useMutation({
    mutationFn: ({
      path,
      method = 'POST',
      body,
    }: {
      path: string;
      method?: string;
      body?: unknown;
    }) => api(path, { method, body: body ? JSON.stringify(body) : undefined }),
    onSuccess: () => {
      setScores([0, 0]);
      setNotice('Acción completada');
      void refresh();
    },
    onError: (e: Error) => setNotice(e.message),
  });
  const r = rotation.data,
    active = r?.activeMatch;
  useEffect(
    () => setScores([active?.teamAScore ?? 0, active?.teamBScore ?? 0]),
    [active?.id, active?.teamAScore, active?.teamBScore],
  );
  if (rotation.isLoading)
    return (
      <div className="card flex gap-2">
        <Loader2 className="animate-spin" />
        Cargando competición…
      </div>
    );
  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-24">
      <header className="rounded-3xl bg-[#172033] p-6 text-white">
        <p className="font-bold text-lime-300">COMPETICIÓN EN VIVO</p>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black">VolleyFlow</h1>
          <Trophy className="text-lime-300" size={38} />
        </div>
      </header>
      {notice && (
        <p role="status" className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
          {notice}
        </p>
      )}
      {!r?.drawn ? (
        <section className="card text-center">
          <Shuffle className="mx-auto text-secondary" size={48} />
          <h2 className="mt-3 text-2xl font-black">Sorteo del partido inicial</h2>
          <p className="my-4 text-slate-600">
            El orden y la cola quedarán guardados en la jornada.
          </p>
          <button
            className="btn"
            disabled={action.isPending}
            onClick={() => action.mutate({ path: `/sessions/${id}/rotation/draw`, body: {} })}
          >
            Sortear partido inicial
          </button>
        </section>
      ) : (
        <>
          <section className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-secondary">
                  PARTIDO #{active?.sequence ?? r.nextSequence}
                </p>
                <h2 className="text-xl font-black">
                  {active ? 'Partido activo' : 'Próximo enfrentamiento'}
                </h2>
              </div>
              {r.canRedraw && (
                <button
                  className="rounded-xl border p-2"
                  onClick={() =>
                    action.mutate({ path: `/sessions/${id}/rotation/redraw`, body: {} })
                  }
                >
                  <RotateCcw />
                  <span className="sr-only">Volver a sortear</span>
                </button>
              )}
            </div>
            <div className="my-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
              <TeamCard team={active?.teamA ?? r.courtTeam} />
              <b className="text-slate-400">VS</b>
              <TeamCard team={active?.teamB ?? r.challengerTeam} />
            </div>
            {active ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Score value={scores[0]} set={(v) => setScores([v, scores[1]])} />
                  <Score value={scores[1]} set={(v) => setScores([scores[0], v])} />
                </div>
                <p className="my-4 text-center text-sm">
                  Objetivo de este partido: <b>{active.targetScore}</b> · El ganador se queda
                </p>
                <button
                  className="btn w-full"
                  disabled={action.isPending}
                  onClick={() => {
                    if (confirm(`¿Registrar ${scores[0]} – ${scores[1]}?`))
                      action.mutate({
                        path: `/sessions/${id}/matches/${active.id}/result`,
                        body: { teamAScore: scores[0], teamBScore: scores[1] },
                      });
                  }}
                >
                  Registrar resultado
                </button>
              </>
            ) : (
              <button
                className="btn w-full"
                onClick={() => action.mutate({ path: `/sessions/${id}/matches/start` })}
              >
                Iniciar {history.data?.items.length ? 'siguiente ' : ''}partido
              </button>
            )}
          </section>
          <section className="card">
            <h2 className="font-black">Cola de equipos</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {r.waitingQueue?.length ? (
                r.waitingQueue.map((t, i) => (
                  <span key={t.id} className="rounded-full bg-slate-100 px-3 py-2">
                    {i + 1}. {t.name}
                  </span>
                ))
              ) : (
                <span className="text-slate-500">Los mismos dos equipos vuelven a jugar.</span>
              )}
            </div>
          </section>
          <section className="card">
            <label className="font-bold" htmlFor="target">
              Puntaje del próximo partido
            </label>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const value = Number(new FormData(e.currentTarget).get('targetScore'));
                action.mutate({
                  path: `/sessions/${id}/target-score`,
                  method: 'PATCH',
                  body: { targetScore: value },
                });
              }}
            >
              <input
                id="target"
                name="targetScore"
                className="input"
                type="number"
                min="1"
                defaultValue={r.currentTargetScore}
              />
              <button className="btn">Aplicar</button>
            </form>
            <p className="mt-2 text-xs text-slate-500">
              Este cambio se aplicará al siguiente partido.
            </p>
          </section>
        </>
      )}
      <section className="card">
        <div className="flex justify-between">
          <h2 className="flex gap-2 text-xl font-black">
            <History />
            Historial
          </h2>
          {r?.canUndoLastResult && (
            <button
              className="text-sm font-bold text-red-600"
              onClick={() =>
                confirm('¿Deshacer el último resultado?') &&
                action.mutate({ path: `/sessions/${id}/matches/latest`, method: 'DELETE' })
              }
            >
              Deshacer último
            </button>
          )}
        </div>
        <div className="mt-3 space-y-2">
          {history.data?.items.map((m) => (
            <div key={m.id} className="flex justify-between rounded-xl bg-slate-50 p-3">
              <span>
                #{m.sequence} {m.teamA.name} vs {m.teamB.name}
              </span>
              <b>{m.status === 'IN_PROGRESS' ? 'En juego' : `${m.teamAScore} – ${m.teamBScore}`}</b>
            </div>
          ))}
        </div>
      </section>
      <section className="card">
        <h2 className="text-xl font-black">Posiciones</h2>
        <div className="mt-3 space-y-2">
          {standings.data?.map((s) => (
            <div
              key={s.team.id}
              className="grid grid-cols-[2rem_1fr_auto_auto] gap-2 rounded-xl border p-3"
            >
              <b>{s.position}</b>
              <span>{s.team.name}</span>
              <span>{s.won} G</span>
              <b>{s.points} pts</b>
            </div>
          ))}
        </div>
        <Link
          href={`/sessions/${id}`}
          className="mt-4 inline-block text-sm font-bold text-secondary"
        >
          Volver a la jornada
        </Link>
      </section>
    </div>
  );
}
function TeamCard({ team }: { team?: Team }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <div className="mx-auto mb-2 grid size-12 place-items-center rounded-full bg-secondary font-black text-white">
        {team?.name?.[0] ?? '?'}
      </div>
      <h3 className="font-black">{team?.name ?? 'Equipo'}</h3>
      {team?.players?.map((p) => (
        <p key={p.playerNameSnapshot} className="text-xs text-slate-500">
          {p.playerNameSnapshot}
        </p>
      ))}
    </div>
  );
}
function Score({ value, set }: { value: number; set: (n: number) => void }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-3">
      <strong className="block text-6xl">{value}</strong>
      <div className="mt-3 flex justify-center gap-2">
        <button
          aria-label="Restar punto"
          className="grid size-12 place-items-center rounded-full border bg-white"
          onClick={() => set(Math.max(0, value - 1))}
        >
          <Minus />
        </button>
        <button
          aria-label="Sumar punto"
          className="grid size-12 place-items-center rounded-full bg-lime-300"
          onClick={() => set(value + 1)}
        >
          <Plus />
        </button>
      </div>
    </div>
  );
}
