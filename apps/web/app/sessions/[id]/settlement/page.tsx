'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Loader2, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { api } from '../../../../lib/api';
import { money } from '../../../../lib/sessions';
import { settlementSchema } from '../../../../lib/settlements';
type Form = z.infer<typeof settlementSchema>;
type Setup = {
  session: {
    status: string;
    courtPrice: number;
    courtHourlyPrice: number;
    courtDurationMinutes: number;
    gatoradePrice: number;
  };
  teams: Array<{ id: string; name: string; players: Array<{ id: string; name: string }> }>;
  participants: Array<{ id: string; name: string; team: { name: string } | null }>;
  standings: Array<{
    position: number;
    team: { id: string; name: string };
    points: number;
    difference: number;
  }>;
  suggestion: { championTeamId: string | null; requiresManualSelection: boolean; reason: string };
};
type Preview = {
  champion: { name: string };
  expectedTotal: number;
  distributedTotal: number;
  validationMatches: boolean;
  courtPayerCount: number;
  gatoradePayerCount: number;
  warnings: string[];
  participants: Array<{
    id: string;
    name: string;
    isChampion: boolean;
    courtAmount: number;
    gatoradeAmount: number;
    amountDue: number;
  }>;
};
export default function SettlementPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [courtIds, setCourtIds] = useState<string[]>([]);
  const [gatoradeIds, setGatoradeIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState('');
  const [courtPriceDisplay, setCourtPriceDisplay] = useState('0');
  const [gatoradePriceDisplay, setGatoradePriceDisplay] = useState('0');
  const setup = useQuery({
    queryKey: ['settlement-setup', id],
    queryFn: () => api<Setup>(`/sessions/${id}/settlement`),
  });
  const form = useForm<Form>({
    defaultValues: {
      championTeamId: '',
      courtHourlyPrice: 0,
      courtDurationMinutes: 60,
      gatoradePrice: 0,
    },
  });
  const champion = form.watch('championTeamId');
  const courtDurationMinutes = form.watch('courtDurationMinutes');
  const courtHourlyPrice = form.watch('courtHourlyPrice');
  useEffect(() => {
    if (!setup.data) return;
    setCourtIds(setup.data.participants.map((p) => p.id));
    setGatoradeIds(setup.data.participants.map((p) => p.id));
    form.setValue('courtHourlyPrice', setup.data.session.courtHourlyPrice);
    form.setValue('courtDurationMinutes', setup.data.session.courtDurationMinutes);
    form.setValue('gatoradePrice', setup.data.session.gatoradePrice);
    setCourtPriceDisplay(formatInteger(setup.data.session.courtHourlyPrice));
    setGatoradePriceDisplay(formatInteger(setup.data.session.gatoradePrice));
    if (setup.data.suggestion.championTeamId)
      form.setValue('championTeamId', setup.data.suggestion.championTeamId);
  }, [setup.data, form]);
  useEffect(() => {
    const winners = new Set(
      setup.data?.teams.find((t) => t.id === champion)?.players.map((p) => p.id) ?? [],
    );
    setGatoradeIds((ids) => ids.filter((id) => !winners.has(id)));
    setPreview(null);
  }, [champion, setup.data]);
  const request = useMutation({
    mutationFn: ({ values, confirm }: { values: Form; confirm: boolean }) =>
      api<Preview>(`/sessions/${id}/settlement${confirm ? '' : '/preview'}`, {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          courtParticipantIds: courtIds,
          gatoradeParticipantIds: gatoradeIds,
        }),
      }),
    onError: (e: Error) => setError(e.message),
  });
  const validated = (action: (values: Form) => Promise<void>) =>
    form.handleSubmit(async (raw) => {
      const result = settlementSchema.safeParse(raw);
      if (!result.success) {
        setError(result.error.issues[0]?.message ?? 'Revisa los datos');
        return;
      }
      await action(result.data);
    });
  const calculate = validated(async (values) => {
    setError('');
    setPreview(await request.mutateAsync({ values, confirm: false }));
  });
  const confirm = validated(async (values) => {
    if (
      !preview ||
      !window.confirm(
        setup.data?.session.status === 'SETTLEMENT'
          ? '¿Reemplazar la liquidación actual conservando sus pagos?'
          : '¿Confirmar esta liquidación?',
      )
    )
      return;
    await request.mutateAsync({ values, confirm: true });
    router.push(`/sessions/${id}/payments`);
  });
  if (setup.isLoading)
    return (
      <div className="card">
        <Loader2 className="animate-spin" /> Cargando liquidación…
      </div>
    );
  if (!setup.data)
    return <div className="card text-red-700">No se pudo preparar la liquidación.</div>;
  const championPlayers = new Set(
    setup.data.teams.find((team) => team.id === champion)?.players.map((p) => p.id) ?? [],
  );
  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-20">
      <header className="flex items-center gap-3">
        <Link href={`/sessions/${id}`}>
          <ArrowLeft />
        </Link>
        <div>
          <p className="text-sm font-bold text-secondary">FASE DE CIERRE</p>
          <h1 className="text-3xl font-extrabold">Finalizar jornada</h1>
        </div>
      </header>
      <section className="card">
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
          <Trophy className="text-amber-500" /> Campeón
        </h2>
        <p
          className={
            setup.data.suggestion.requiresManualSelection
              ? 'mb-3 rounded-xl bg-amber-50 p-3 text-amber-900'
              : 'mb-3 text-slate-600'
          }
        >
          {setup.data.suggestion.reason}
        </p>
        <select className="input" {...form.register('championTeamId')}>
          <option value="">Seleccionar equipo</option>
          {setup.data.teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name} ·{' '}
              {setup.data.standings.find((row) => row.team.id === team.id)?.points ?? 0} puntos
            </option>
          ))}
        </select>
        {form.formState.errors.championTeamId && (
          <p className="text-sm text-red-700">{form.formState.errors.championTeamId.message}</p>
        )}
      </section>
      <section className="card">
        <h2 className="mb-3 text-xl font-bold">Puntos por equipo</h2>
        <div className="space-y-2">
          {setup.data.standings.map((row) => (
            <div
              className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-xl bg-slate-50 p-3"
              key={row.team.id}
            >
              <b className="text-secondary">#{row.position}</b>
              <span className="font-semibold">{row.team.name}</span>
              <b>{row.points} puntos</b>
            </div>
          ))}
        </div>
      </section>
      <form className="grid gap-4 sm:grid-cols-3">
        <label className="card font-bold">
          Valor por hora (COP)
          <input
            className="input mt-2"
            inputMode="numeric"
            value={courtPriceDisplay}
            onChange={(event) => {
              const value = parseInteger(event.target.value);
              setCourtPriceDisplay(formatInteger(value));
              form.setValue('courtHourlyPrice', value);
              setPreview(null);
            }}
          />
        </label>
        <label className="card font-bold">
          Tiempo jugado
          <select
            className="input mt-2"
            {...form.register('courtDurationMinutes', { valueAsNumber: true })}
            onChange={(event) => {
              form.setValue('courtDurationMinutes', Number(event.target.value));
              setPreview(null);
            }}
          >
            {[60, 90, 120, 150, 180, 210, 240].map((minutes) => (
              <option key={minutes} value={minutes}>
                {durationLabel(minutes)}
              </option>
            ))}
          </select>
          <small className="mt-2 block font-normal text-slate-500">
            Total cancha: {money((courtHourlyPrice * courtDurationMinutes) / 60)}
          </small>
        </label>
        <label className="card font-bold">
          Valor Gatorades (COP)
          <input
            className="input mt-2"
            inputMode="numeric"
            value={gatoradePriceDisplay}
            onChange={(event) => {
              const value = parseInteger(event.target.value);
              setGatoradePriceDisplay(formatInteger(value));
              form.setValue('gatoradePrice', value);
              setPreview(null);
            }}
          />
        </label>
      </form>
      <section className="card">
        <h2 className="text-xl font-bold">Inclusiones individuales</h2>
        <p className="mb-3 text-sm text-slate-500">El campeón paga cancha, pero nunca Gatorades.</p>
        <div className="space-y-3">
          {setup.data.participants.map((player) => (
            <div
              key={player.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b pb-3"
            >
              <div>
                <b>{player.name}</b>
                <p className="text-sm text-slate-500">{player.team?.name}</p>
              </div>
              <label className="text-xs">
                Cancha{' '}
                <input
                  type="checkbox"
                  checked={courtIds.includes(player.id)}
                  onChange={() =>
                    setCourtIds((ids) =>
                      ids.includes(player.id)
                        ? ids.filter((x) => x !== player.id)
                        : [...ids, player.id],
                    )
                  }
                />
              </label>
              <label className="text-xs">
                Gatorade{' '}
                <input
                  type="checkbox"
                  disabled={championPlayers.has(player.id)}
                  checked={gatoradeIds.includes(player.id)}
                  onChange={() =>
                    setGatoradeIds((ids) =>
                      ids.includes(player.id)
                        ? ids.filter((x) => x !== player.id)
                        : [...ids, player.id],
                    )
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </section>
      {error && <p className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
      <button className="btn-secondary w-full" disabled={request.isPending} onClick={calculate}>
        Calcular vista previa
      </button>
      {preview && (
        <section className="card space-y-3">
          <div className="flex justify-between">
            <h2 className="text-xl font-bold">Distribución exacta</h2>
            <span className="flex items-center gap-1 font-bold text-green-700">
              <CheckCircle2 /> {money(preview.distributedTotal)}
            </span>
          </div>
          {preview.participants.map((p) => (
            <div className="flex justify-between border-b py-2" key={p.id}>
              <span>
                {p.name}
                {p.isChampion && ' · Campeón'}
              </span>
              <span className="text-right font-bold">
                {money(p.amountDue)}
                <small className="block font-normal text-slate-500">
                  {money(p.courtAmount)} + {money(p.gatoradeAmount)}
                </small>
              </span>
            </div>
          ))}
          <p className={preview.validationMatches ? 'text-green-700' : 'text-red-700'}>
            Validación: {money(preview.distributedTotal)} de {money(preview.expectedTotal)}
          </p>
          <button
            className="btn w-full bg-secondary text-white shadow-lg hover:bg-blue-700"
            onClick={confirm}
          >
            Continuar para finalizar jornada
          </button>
        </section>
      )}
    </div>
  );
}

function parseInteger(value: string) {
  return Number(value.replace(/\D/g, '')) || 0;
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value);
}

function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} ${hours === 1 ? 'hora' : 'horas'}${remainder ? ` y ${remainder} minutos` : ''}`;
}
