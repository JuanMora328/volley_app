'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import { money } from '../../../../lib/sessions';
import { PaymentSummary } from '../../../../lib/settlements';
type Summary = PaymentSummary & {
  championMembers: string[];
  standings: Array<{
    position: number;
    team: { name: string };
    points: number;
    difference: number;
  }>;
  results: Array<{
    id: string;
    sequence: number;
    teamA: string;
    teamB: string;
    teamAScore: number;
    teamBScore: number;
  }>;
  settledAt: string;
  finishedAt: string | null;
};
export default function SummaryPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['summary', id],
    queryFn: () => api<Summary>(`/sessions/${id}/summary`),
  });
  const finish = useMutation({
    mutationFn: () =>
      api(`/sessions/${id}/finish`, {
        method: 'POST',
        body: JSON.stringify({ confirmPendingPayments: true }),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['summary', id] });
    },
  });
  if (!query.data)
    return (
      <div className="card">
        {query.isLoading ? 'Cargando resumen…' : 'La jornada todavía no está liquidada.'}
      </div>
    );
  const s = query.data;
  const debtors = s.participants.filter((p) => p.pendingAmount > 0);
  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-20">
      <header className="rounded-3xl bg-slate-900 p-6 text-white">
        <p className="text-lime-300">
          {s.session.status === 'FINISHED' ? 'JORNADA FINALIZADA' : 'LISTA PARA CERRAR'}
        </p>
        <h1 className="mt-2 flex items-center gap-2 text-3xl font-extrabold">
          <Trophy className="text-amber-400" /> {s.champion?.name}
        </h1>
        <p>{s.championMembers.join(' · ')}</p>
      </header>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Cancha" value={money(s.courtPrice)} />
        <Metric label="Gatorades" value={money(s.gatoradeTotal)} />
        <Metric label="Recaudado" value={money(s.paidTotal)} />
        <Metric label="Pendiente" value={money(s.pendingTotal)} />
      </section>
      <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
        Cancha: {durationSummary(s.courtDurationMinutes)} a {money(s.courtHourlyPrice)} por hora.
        <br />
        Gatorades: {money(s.gatoradePrice)} por unidad × {s.gatoradeWinnerCount} ganadores ={' '}
        {money(s.gatoradeTotal)}.
      </p>
      <section className="card">
        <h2 className="text-xl font-bold">Tabla final</h2>
        {s.standings.map((row) => (
          <div
            className="grid grid-cols-[2rem_1fr_auto_auto] gap-3 border-b py-2"
            key={row.team.name}
          >
            <b>{row.position}</b>
            <span>{row.team.name}</span>
            <span>{row.points} pts</span>
            <span>
              {row.difference > 0 ? '+' : ''}
              {row.difference}
            </span>
          </div>
        ))}
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="text-xl font-bold">Resultados</h2>
          {s.results.length ? (
            s.results.map((r) => (
              <p className="border-b py-2" key={r.id}>
                #{r.sequence} {r.teamA}{' '}
                <b>
                  {r.teamAScore}–{r.teamBScore}
                </b>{' '}
                {r.teamB}
              </p>
            ))
          ) : (
            <p className="text-slate-500">Sin partidos registrados.</p>
          )}
        </div>
        <div className="card">
          <h2 className="text-xl font-bold">Deudores y parciales</h2>
          {debtors.length ? (
            debtors.map((p) => (
              <div className="flex justify-between border-b py-2" key={p.id}>
                <span>
                  {p.name}
                  <small className="block text-slate-500">Pagó {money(p.amountPaid)}</small>
                </span>
                <b className="text-red-700">{money(p.pendingAmount)}</b>
              </div>
            ))
          ) : (
            <p className="flex gap-2 text-green-700">
              <CheckCircle2 /> No hay saldos pendientes.
            </p>
          )}
          <Link className="btn-secondary mt-4 block text-center" href={`/sessions/${id}/payments`}>
            Ver y registrar pagos
          </Link>
        </div>
      </section>
      <p className="text-sm text-slate-500">
        Distribución confirmada: {new Date(s.settledAt).toLocaleString('es-CO')}
        {s.finishedAt && ` · Cerrada: ${new Date(s.finishedAt).toLocaleString('es-CO')}`}
      </p>
      {s.session.status !== 'FINISHED' && (
        <section className="card border-amber-300 bg-amber-50">
          <h2 className="font-bold">Finalizar jornada</h2>
          <p className="my-2">
            {debtors.length ? `Hay ${debtors.length} deudores. ` : ''}Los pagos podrán corregirse
            después, pero el campeón y los costos quedarán bloqueados.
          </p>
          <button
            className="btn-primary w-full"
            onClick={() => {
              if (window.confirm('¿Finalizar definitivamente la jornada?')) finish.mutate();
            }}
          >
            Finalizar jornada
          </button>
        </section>
      )}
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="text-xl font-extrabold text-secondary">{value}</p>
    </div>
  );
}

function durationSummary(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} ${hours === 1 ? 'hora' : 'horas'}${remainder ? ` y ${remainder} minutos` : ''}`;
}
