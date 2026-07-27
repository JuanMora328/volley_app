'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Loader2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { api } from '../../../lib/api';
import { SessionDetail, SessionForm, money, sessionSchema } from '../../../lib/sessions';
type Venue = { id: string; name: string; defaultCourtPrice: number; defaultGatoradePrice: number };
type Player = { id: string; name: string; defaultLevel: number; active: boolean };
export default function NewSession() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const form = useForm<SessionForm>({
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      startTime: '',
      venueId: '',
      venueName: '',
      courtPrice: 0,
      gatoradePrice: 0,
      teamCount: 2,
      defaultTargetScore: 21,
    },
  });
  const venues = useQuery({
    queryKey: ['venues-active'],
    queryFn: () => api<{ items: Venue[] }>('/venues?active=true&limit=100'),
  });
  const players = useQuery({
    queryKey: ['players-active'],
    queryFn: () => api<{ items: Player[] }>('/players?active=true&limit=100'),
  });
  const create = useMutation({
    mutationFn: (values: SessionForm) =>
      api<SessionDetail>('/sessions', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: (data) => {
      setSession({
        ...data,
        participants: [],
        teams: [],
        metrics: null,
        allowedActions: { edit: true, managePlayers: true, manageTeams: true, confirmTeams: false },
      });
      setStep(2);
      toast.success('Borrador guardado');
    },
    onError: () => toast.error('No pudimos crear la jornada'),
  });
  const savePlayers = useMutation({
    mutationFn: () =>
      api<SessionDetail[]>(`/sessions/${session!.id}/players`, {
        method: 'POST',
        body: JSON.stringify({
          players: Object.entries(selected).map(([playerId, levelSnapshot]) => ({
            playerId,
            levelSnapshot,
          })),
        }),
      }),
    onSuccess: async () => {
      const detail = await api<SessionDetail>(`/sessions/${session!.id}`);
      setSession(detail);
      setStep(3);
    },
    onError: () => toast.error('No pudimos guardar los participantes'),
  });
  const chooseVenue = (id: string) => {
    form.setValue('venueId', id);
    const venue = venues.data?.items.find((item) => item.id === id);
    if (venue) {
      form.setValue('courtPrice', venue.defaultCourtPrice);
      form.setValue('gatoradePrice', venue.defaultGatoradePrice);
      form.setValue('venueName', venue.name);
    }
  };
  const visible =
    players.data?.items.filter((player) =>
      player.name.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#091426]">Nueva jornada</h1>
          <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-[#0051d5]">
            Paso {step} de 3
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {['Información', 'Participantes', 'Confirmación'].map((label, index) => (
            <div
              key={label}
              className={`h-2 rounded-full ${index < step ? 'bg-[#0051d5]' : 'bg-slate-200'}`}
              aria-label={label}
            />
          ))}
        </div>
      </header>
      {step === 1 && (
        <form
          className="card space-y-5"
          onSubmit={form.handleSubmit((values) => {
            const parsed = sessionSchema.safeParse(values);
            if (!parsed.success) {
              parsed.error.issues.forEach((issue) =>
                form.setError(issue.path[0] as keyof SessionForm, { message: issue.message }),
              );
              return;
            }
            create.mutate(parsed.data);
          })}
        >
          <h2 className="text-xl font-bold">Información general</h2>
          <Field label="Fecha" error={form.formState.errors.date?.message}>
            <input className="input" type="date" {...form.register('date')} />
          </Field>
          <Field label="Hora (opcional)">
            <input className="input" type="time" {...form.register('startTime')} />
          </Field>
          <Field label="Cancha">
            <select
              className="input"
              {...form.register('venueId')}
              onChange={(event) => chooseVenue(event.target.value)}
            >
              <option value="">Ubicación manual</option>
              {venues.data?.items.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </Field>
          {!form.watch('venueId') && (
            <Field label="Nombre de cancha" error={form.formState.errors.venueName?.message}>
              <input
                className="input"
                placeholder="Ej. Polideportivo Central"
                {...form.register('venueName')}
              />
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Valor cancha">
              <input className="input" type="number" {...form.register('courtPrice')} />
            </Field>
            <Field label="Gatorades estimados">
              <input className="input" type="number" {...form.register('gatoradePrice')} />
            </Field>
            <Field label="Cantidad de equipos">
              <input className="input" type="number" {...form.register('teamCount')} />
            </Field>
            <Field label="Puntaje inicial">
              <input className="input" type="number" {...form.register('defaultTargetScore')} />
            </Field>
          </div>
          <button className="btn w-full" disabled={create.isPending}>
            {create.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <span>Continuar</span>
                <ArrowRight />
              </>
            )}
          </button>
        </form>
      )}
      {step === 2 && (
        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Participantes</h2>
            <b className="text-[#0051d5]">{Object.keys(selected).length} seleccionados</b>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
              <Search aria-hidden="true" size={20} />
            </span>
            <input
              className="input pl-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar jugador"
            />
          </div>
          {players.isLoading ? (
            <div className="animate-pulse space-y-3">Cargando jugadores...</div>
          ) : (
            <div className="max-h-[52vh] space-y-2 overflow-auto">
              {visible.map((player) => (
                <label key={player.id} className="flex items-center gap-3 rounded-xl border p-3">
                  <input
                    type="checkbox"
                    checked={selected[player.id] !== undefined}
                    onChange={(e) =>
                      setSelected((current) => {
                        const next = { ...current };
                        if (e.target.checked) next[player.id] = player.defaultLevel;
                        else delete next[player.id];
                        return next;
                      })
                    }
                  />
                  <span className="flex-1 font-semibold">{player.name}</span>
                  {selected[player.id] !== undefined && (
                    <select
                      className="rounded-lg border p-2"
                      value={selected[player.id]}
                      onChange={(e) =>
                        setSelected({ ...selected, [player.id]: Number(e.target.value) })
                      }
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  )}
                </label>
              ))}
            </div>
          )}
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            {Object.keys(selected).length < (session?.teamCount ?? 2)
              ? 'Selecciona al menos un jugador por equipo.'
              : Object.keys(selected).length % (session?.teamCount ?? 2)
                ? 'La distribución tendrá equipos con un jugador de diferencia.'
                : 'La distribución será exacta.'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-secondary w-full" onClick={() => setStep(1)}>
              <ArrowLeft aria-hidden="true" size={20} />
              <span>Volver</span>
            </button>
            <button
              className="btn w-full"
              disabled={
                Object.keys(selected).length < (session?.teamCount ?? 2) || savePlayers.isPending
              }
              onClick={() => savePlayers.mutate()}
            >
              <span>Continuar</span>
              <ArrowRight aria-hidden="true" size={20} />
            </button>
          </div>
        </section>
      )}
      {step === 3 && session && (
        <section className="card space-y-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-lime-100 p-2 text-lime-700">
              <Check />
            </div>
            <h2 className="text-xl font-bold">Confirma tu jornada</h2>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            <Summary label="Fecha" value={`${session.date} ${session.startTime ?? ''}`} />
            <Summary label="Cancha" value={session.venueNameSnapshot} />
            <Summary label="Cancha" value={money(session.courtPrice)} />
            <Summary label="Gatorades" value={money(session.gatoradePrice)} />
            <Summary label="Equipos" value={String(session.teamCount)} />
            <Summary label="Puntaje" value={String(session.defaultTargetScore)} />
          </dl>
          <div>
            <h3 className="font-bold">Participantes ({session.participants.length})</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {session.participants.map((p) => (
                <span key={p.id} className="rounded-full bg-slate-100 px-3 py-2">
                  {p.playerNameSnapshot} · N{p.levelSnapshot}
                </span>
              ))}
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Distribución estimada:{' '}
            {Array.from(
              { length: session.teamCount },
              (_, i) =>
                Math.floor(session.participants.length / session.teamCount) +
                (i < session.participants.length % session.teamCount ? 1 : 0),
            ).join(' · ')}{' '}
            jugadores
          </p>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setStep(2)}>
              Corregir
            </button>
            <button className="btn flex-1" onClick={() => router.push(`/sessions/${session.id}`)}>
              Confirmar creación
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="font-semibold">{label}</span>
      {children}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </label>
  );
}
function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-500">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}
