'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  Volleyball,
  WalletCards,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  const defaults = useQuery({
    queryKey: ['session-defaults'],
    queryFn: () =>
      api<{
        teamCount: number;
        defaultTargetScore: number;
        courtPrice: number;
        gatoradePrice: number;
        venueId: string | null;
      }>('/settings/defaults'),
  });
  useEffect(() => {
    if (!defaults.data) return;
    form.reset({ ...form.getValues(), ...defaults.data, venueId: defaults.data.venueId ?? '' });
  }, [defaults.data, form]);
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
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <header className="overflow-hidden rounded-3xl bg-[#091426] p-5 text-white shadow-xl md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-lime-300">
              Configuración de jornada
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
              Nueva jornada
            </h1>
            <p className="mt-2 text-sm text-blue-100">
              Completa la información, elige los jugadores y revisa el resumen.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-sm font-bold ring-1 ring-white/20">
            Paso {step} de 3
          </span>
        </div>
        <ol className="mt-6 grid grid-cols-3 gap-2" aria-label="Progreso de creación">
          {['Información', 'Participantes', 'Confirmación'].map((label, index) => (
            <li
              key={label}
              className={`rounded-xl p-2 text-center text-[11px] font-bold sm:text-sm ${index + 1 === step ? 'bg-white text-[#091426]' : index + 1 < step ? 'bg-lime-300 text-[#102000]' : 'bg-white/10 text-slate-300'}`}
              aria-current={index + 1 === step ? 'step' : undefined}
            >
              <span className="mx-auto mb-1 grid size-6 place-items-center rounded-full bg-current/10">
                {index + 1 < step ? <Check size={14} /> : index + 1}
              </span>
              <span className="block truncate">{label}</span>
            </li>
          ))}
        </ol>
      </header>
      {step === 1 && (
        <form
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
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
          <SectionTitle
            icon={CalendarDays}
            title="Información general"
            description="Datos básicos para identificar y organizar la jornada."
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field
              label="Fecha"
              error={form.formState.errors.date?.message}
              icon={<CalendarDays size={17} />}
            >
              <input className="input" type="date" {...form.register('date')} />
            </Field>
            <Field label="Hora (opcional)" icon={<Clock3 size={17} />}>
              <input className="input" type="time" {...form.register('startTime')} />
            </Field>
          </div>
          <div className="my-6 border-t border-slate-100" />
          <SectionTitle
            icon={MapPin}
            title="Cancha y costos"
            description="Selecciona una sede o registra una ubicación manual."
          />
          <div className="mt-5 space-y-4">
            <Field label="Cancha" icon={<MapPin size={17} />}>
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
              <Field
                label="Valor por hora"
                hint="Pesos colombianos"
                icon={<WalletCards size={17} />}
              >
                <CurrencyField
                  value={form.watch('courtPrice')}
                  onChange={(value) =>
                    form.setValue('courtPrice', value, { shouldDirty: true, shouldValidate: true })
                  }
                  label="Valor de cancha"
                />
              </Field>
              <Field
                label="Gatorade por unidad"
                hint="Pesos colombianos"
                icon={<WalletCards size={17} />}
              >
                <CurrencyField
                  value={form.watch('gatoradePrice')}
                  onChange={(value) =>
                    form.setValue('gatoradePrice', value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  label="Valor de Gatorade"
                />
              </Field>
              <Field label="Cantidad de equipos" icon={<Users size={17} />}>
                <input className="input" type="number" {...form.register('teamCount')} />
              </Field>
              <Field label="Puntaje inicial" icon={<Volleyball size={17} />}>
                <input className="input" type="number" {...form.register('defaultTargetScore')} />
              </Field>
            </div>
          </div>
          <button
            className="btn mt-7 w-full shadow-lg shadow-blue-500/15"
            disabled={create.isPending}
          >
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
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionTitle
              icon={Users}
              title="Selecciona participantes"
              description="Ajusta el nivel de cada jugador para equilibrar los equipos."
            />
            <b className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-sm text-[#0051d5]">
              {Object.keys(selected).length} seleccionados
            </b>
          </div>
          <div className="relative mt-6">
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
            <div className="mt-4 max-h-[52vh] space-y-2 overflow-auto pr-1">
              {visible.map((player) => (
                <label
                  key={player.id}
                  className={`flex min-h-16 items-center gap-3 rounded-2xl border p-3 transition ${selected[player.id] !== undefined ? 'border-blue-300 bg-blue-50/60 ring-1 ring-blue-100' : 'border-slate-200 hover:border-blue-200'}`}
                >
                  <input
                    type="checkbox"
                    className="size-5 rounded border-slate-300 text-secondary"
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
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-secondary shadow-sm">
                    <UserRound size={19} />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{player.name}</span>
                  {selected[player.id] !== undefined && (
                    <select
                      aria-label={`Nivel de ${player.name}`}
                      className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 font-bold"
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
          <p
            className="mt-4 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
            role="status"
          >
            <ShieldCheck className="shrink-0" size={19} />
            {Object.keys(selected).length < (session?.teamCount ?? 2)
              ? 'Selecciona al menos un jugador por equipo.'
              : Object.keys(selected).length % (session?.teamCount ?? 2)
                ? 'La distribución tendrá equipos con un jugador de diferencia.'
                : 'La distribución será exacta.'}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
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
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-lime-50 to-white p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-lime-300 text-lime-950">
                <CheckCircle2 />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-lime-700">
                  Último paso
                </p>
                <h2 className="text-2xl font-extrabold text-primary">Confirma tu jornada</h2>
              </div>
            </div>
          </div>
          <div className="space-y-6 p-5 sm:p-7">
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Summary label="Fecha" value={`${session.date} ${session.startTime ?? ''}`} />
              <Summary label="Cancha" value={session.venueNameSnapshot} />
              <Summary label="Cancha" value={money(session.courtPrice)} />
              <Summary label="Gatorade por unidad" value={money(session.gatoradePrice)} />
              <Summary label="Equipos" value={String(session.teamCount)} />
              <Summary label="Puntaje" value={String(session.defaultTargetScore)} />
            </dl>
            <div>
              <h3 className="font-bold">Participantes ({session.participants.length})</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {session.participants.map((p) => (
                  <span
                    key={p.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold"
                  >
                    <span className="truncate">{p.playerNameSnapshot}</span>
                    <span className="ml-2 rounded-lg bg-blue-100 px-2 py-1 text-xs text-blue-800">
                      Nivel {p.levelSnapshot}
                    </span>
                  </span>
                ))}
              </div>
            </div>
            <p className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
              Distribución estimada:{' '}
              {Array.from(
                { length: session.teamCount },
                (_, i) =>
                  Math.floor(session.participants.length / session.teamCount) +
                  (i < session.participants.length % session.teamCount ? 1 : 0),
              ).join(' · ')}{' '}
              jugadores
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-secondary flex-1" onClick={() => setStep(2)}>
                Corregir
              </button>
              <button className="btn flex-1" onClick={() => router.push(`/sessions/${session.id}`)}>
                Confirmar creación
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
function Field({
  label,
  error,
  hint,
  icon,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center gap-2 font-semibold text-slate-800">
        {icon && <span className="text-secondary">{icon}</span>}
        {label}
      </span>
      {children}
      {hint && !error && <span className="block text-xs text-slate-500">{hint}</span>}
      {error && (
        <span className="form-error block" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words font-bold text-primary">{value}</dd>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-secondary">
        <Icon size={21} />
      </span>
      <div>
        <h2 className="text-xl font-extrabold text-primary">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function CurrencyField({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange(value: number): void;
  label: string;
}) {
  return (
    <div className="flex min-h-12 overflow-hidden rounded-xl border border-slate-300 bg-white transition focus-within:border-secondary focus-within:ring-4 focus-within:ring-blue-100">
      <span className="grid w-11 shrink-0 place-items-center border-r border-slate-200 bg-slate-50 font-bold text-slate-500">
        $
      </span>
      <input
        aria-label={label}
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent px-3 text-right font-bold tabular-nums outline-none"
        inputMode="numeric"
        value={formatIntegerInput(value)}
        onChange={(event) => onChange(parseIntegerInput(event.target.value))}
      />
      <span className="grid w-14 shrink-0 place-items-center border-l border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
        COP
      </span>
    </div>
  );
}

function parseIntegerInput(value: string) {
  return Number(value.replace(/\D/g, '')) || 0;
}

function formatIntegerInput(value: number) {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(
    Number.isFinite(value) ? value : 0,
  );
}
