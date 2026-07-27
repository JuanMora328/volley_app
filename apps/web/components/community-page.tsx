'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Loader2, MapPin, Plus, Search, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { api, getToken } from '../lib/api';
import {
  cop,
  formatCopInput,
  Paginated,
  parseCopInput,
  Player,
  playerSchema,
  Venue,
  venueSchema,
} from '../lib/community';
import { useRouter } from 'next/navigation';

type Kind = 'players' | 'venues';
type Item = Player | Venue;
type FormData = Record<string, string | number>;
export function CommunityPage({ kind }: { kind: Kind }) {
  const isPlayers = kind === 'players';
  const title = isPlayers ? 'Jugadores' : 'Canchas';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Item | null | undefined>(undefined);
  const [confirmingStatus, setConfirmingStatus] = useState<Item | null>(null);
  const router = useRouter();
  const client = useQueryClient();
  useEffect(() => {
    if (!getToken()) router.replace('/login');
  }, [router]);
  useEffect(() => setPage(1), [search, status]);
  const query = useQuery({
    queryKey: [kind, search, status, page],
    queryFn: () =>
      api<Paginated<Item>>(
        `/${kind}?search=${encodeURIComponent(search)}&status=${status}&page=${page}&limit=12&sortBy=${isPlayers ? 'defaultLevel' : 'name'}&sortOrder=${isPlayers ? 'DESC' : 'ASC'}`,
      ),
    retry: false,
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api(`/${kind}/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }),
    onSuccess: async (_, value) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: [kind] }),
        ...(isPlayers ? [client.invalidateQueries({ queryKey: ['dashboard'] })] : []),
      ]);
      toast.success(
        value.active ? `${title.slice(0, -1)} reactivado` : `${title.slice(0, -1)} desactivado`,
      );
      setConfirmingStatus(null);
    },
    onError: () => toast.error('No pudimos actualizar el estado'),
  });
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">{title}</h1>
          <p className="text-slate-600">
            {isPlayers ? 'Gestiona tu comunidad deportiva.' : 'Gestiona tus sedes habituales.'}
          </p>
        </div>
        <button className="btn gap-2" onClick={() => setEditing(null)}>
          <Plus size={20} />
          {isPlayers ? 'Nuevo jugador' : 'Nueva cancha'}
        </button>
      </header>
      <section className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <label className="flex min-h-12 flex-1 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 focus-within:border-secondary focus-within:ring-2 focus-within:ring-blue-100">
          <Search className="shrink-0 text-slate-500" size={20} aria-hidden="true" />
          <span className="sr-only">Buscar</span>
          <input
            className="min-w-0 flex-1 border-0 bg-transparent py-3 outline-none placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isPlayers ? 'Buscar jugadores...' : 'Buscar por nombre o dirección...'}
          />
        </label>
        <div className="flex rounded-xl bg-slate-100 p-1">
          {[
            ['all', 'Todos'],
            ['active', 'Activos'],
            ['inactive', 'Inactivos'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${status === value ? 'bg-secondary text-white' : 'text-slate-600'}`}
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      {query.isLoading ? (
        <div aria-label="Cargando" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4].map((x) => (
            <div key={x} className="h-48 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : query.isError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          No pudimos cargar {title.toLowerCase()}.{' '}
          <button className="font-bold underline" onClick={() => query.refetch()}>
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold text-slate-600">
            {query.data?.meta.total ?? 0} resultados
          </p>
          {!query.data?.items.length ? (
            <div className="card py-16 text-center">
              <p className="text-lg font-semibold">No encontramos {title.toLowerCase()}</p>
              <p className="text-slate-500">Cambia los filtros o crea un nuevo registro.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {query.data.items.map((item) => (
                <RecordCard
                  key={item.id}
                  item={item}
                  isPlayer={isPlayers}
                  onEdit={() => setEditing(item)}
                  onStatus={() => setConfirmingStatus(item)}
                />
              ))}
            </div>
          )}
          {(query.data?.meta.totalPages ?? 0) > 1 && (
            <nav className="flex items-center justify-center gap-4">
              <button
                className="rounded-lg border px-4 py-2 disabled:opacity-40"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </button>
              <span>
                Página {page} de {query.data?.meta.totalPages}
              </span>
              <button
                className="rounded-lg border px-4 py-2 disabled:opacity-40"
                disabled={page === query.data?.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </button>
            </nav>
          )}
        </>
      )}
      {editing !== undefined && (
        <CommunityForm kind={kind} item={editing} close={() => setEditing(undefined)} />
      )}
      {confirmingStatus && (
        <StatusConfirmationModal
          item={confirmingStatus}
          kind={kind}
          pending={statusMutation.isPending}
          close={() => setConfirmingStatus(null)}
          confirm={() =>
            statusMutation.mutate({ id: confirmingStatus.id, active: !confirmingStatus.active })
          }
        />
      )}
    </div>
  );
}
function RecordCard({
  item,
  isPlayer,
  onEdit,
  onStatus,
}: {
  item: Item;
  isPlayer: boolean;
  onEdit(): void;
  onStatus(): void;
}) {
  const venue = item as Venue;
  const player = item as Player;
  return (
    <article className={`card overflow-hidden ${item.active ? '' : 'opacity-70'}`}>
      <div className="flex justify-between gap-3">
        <div className="flex gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-secondary">
            {isPlayer ? <UserRound /> : <MapPin />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary">{item.name}</h2>
            <p className="text-sm text-slate-500">
              {isPlayer ? `Nivel ${player.defaultLevel} de 5` : venue.address || 'Sin dirección'}
            </p>
          </div>
        </div>
        <span
          className={`h-fit rounded-full px-2 py-1 text-xs font-bold ${item.active ? 'bg-lime-100 text-lime-800' : 'bg-slate-200 text-slate-600'}`}
        >
          {item.active ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      {isPlayer ? (
        player.notes && (
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{player.notes}</p>
        )
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Price label="Cancha" value={venue.defaultCourtPrice} />
          <Price label="Gatorades" value={venue.defaultGatoradePrice} />
        </div>
      )}
      <div className="mt-4 flex border-t pt-3">
        <button
          className="flex flex-1 items-center justify-center gap-2 font-semibold text-secondary"
          onClick={onEdit}
        >
          <Edit3 size={17} /> Editar
        </button>
        <button className="flex-1 font-semibold text-slate-600" onClick={onStatus}>
          {item.active ? 'Desactivar' : 'Reactivar'}
        </button>
      </div>
    </article>
  );
}
function Price({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <span className="block text-xs text-slate-500">{label}</span>
      <b>{cop.format(value)}</b>
    </div>
  );
}
function StatusConfirmationModal({
  item,
  kind,
  pending,
  close,
  confirm,
}: {
  item: Item;
  kind: Kind;
  pending: boolean;
  close(): void;
  confirm(): void;
}) {
  const activating = !item.active;
  const recordLabel = kind === 'players' ? 'jugador' : 'cancha';
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-confirmation-title"
      className="fixed inset-0 z-[70] flex items-end bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) close();
      }}
    >
      <section className="w-full rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div
            className={`rounded-2xl p-3 ${activating ? 'bg-lime-100 text-lime-800' : 'bg-red-100 text-red-700'}`}
          >
            {kind === 'players' ? <UserRound /> : <MapPin />}
          </div>
          <button
            type="button"
            aria-label="Cerrar confirmación"
            disabled={pending}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            onClick={close}
          >
            <X />
          </button>
        </div>
        <h2 id="status-confirmation-title" className="text-2xl font-bold text-primary">
          {activating ? '¿Reactivar' : '¿Desactivar'} {recordLabel}?
        </h2>
        <p className="mt-2 text-slate-600">
          {activating
            ? `“${item.name}” volverá a estar disponible en los listados activos.`
            : `“${item.name}” se conservará en el historial y podrás reactivarlo después.`}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={pending}
            className="min-h-12 rounded-xl border border-slate-300 px-5 font-semibold text-slate-700 disabled:opacity-50"
            onClick={close}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={pending}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 font-semibold text-white disabled:opacity-60 ${activating ? 'bg-secondary' : 'bg-red-600'}`}
            onClick={confirm}
          >
            {pending && <Loader2 className="animate-spin" size={18} />}
            {activating ? 'Sí, reactivar' : 'Sí, desactivar'}
          </button>
        </div>
      </section>
    </div>
  );
}
function CommunityForm({ kind, item, close }: { kind: Kind; item: Item | null; close(): void }) {
  const isPlayers = kind === 'players';
  const client = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: item
      ? isPlayers
        ? {
            name: item.name,
            defaultLevel: (item as Player).defaultLevel,
            notes: (item as Player).notes ?? '',
          }
        : {
            name: item.name,
            address: (item as Venue).address ?? '',
            defaultCourtPrice: (item as Venue).defaultCourtPrice,
            defaultGatoradePrice: (item as Venue).defaultGatoradePrice,
          }
      : isPlayers
        ? { name: '', defaultLevel: 3, notes: '' }
        : { name: '', address: '', defaultCourtPrice: 0, defaultGatoradePrice: 0 },
  });
  const mutation = useMutation({
    mutationFn: (body: unknown) =>
      api(`/${kind}${item ? `/${item.id}` : ''}`, {
        method: item ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: [kind] }),
        ...(isPlayers ? [client.invalidateQueries({ queryKey: ['dashboard'] })] : []),
      ]);
      toast.success(item ? 'Cambios guardados' : `${isPlayers ? 'Jugador' : 'Cancha'} creado`);
      close();
    },
    onError: () => toast.error('No pudimos guardar los cambios'),
  });
  const submit = (raw: FormData) => {
    const parsed = (isPlayers ? playerSchema : venueSchema).safeParse(raw);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) =>
        setError(String(issue.path[0]), { message: issue.message }),
      );
      return;
    }
    mutation.mutate(parsed.data);
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-end bg-black/40 sm:items-center sm:justify-center"
    >
      <form
        onSubmit={handleSubmit(submit)}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 sm:max-w-lg sm:rounded-3xl"
      >
        <div className="mb-6 flex justify-between">
          <h2 className="text-2xl font-bold">
            {item ? 'Editar' : 'Crear'} {isPlayers ? 'jugador' : 'cancha'}
          </h2>
          <button type="button" aria-label="Cerrar" onClick={close}>
            <X />
          </button>
        </div>
        <Field label="Nombre" error={errors.name?.message as string}>
          <input className="input" {...register('name')} />
        </Field>
        {isPlayers ? (
          <>
            <Field label="Nivel (1 a 5)" error={errors.defaultLevel?.message as string}>
              <input
                type="number"
                min="1"
                max="5"
                className="input"
                {...register('defaultLevel')}
              />
            </Field>
            <Field label="Notas (opcional)" error={errors.notes?.message as string}>
              <textarea className="input" rows={3} {...register('notes')} />
            </Field>
          </>
        ) : (
          <>
            <Field label="Dirección (opcional)" error={errors.address?.message as string}>
              <input className="input" {...register('address')} />
            </Field>
            <Field
              label="Valor habitual de cancha (COP)"
              error={errors.defaultCourtPrice?.message as string}
            >
              <MoneyInput
                name="defaultCourtPrice"
                value={watch('defaultCourtPrice')}
                register={register}
                setValue={setValue}
              />
            </Field>
            <Field
              label="Valor habitual de Gatorades (COP)"
              error={errors.defaultGatoradePrice?.message as string}
            >
              <MoneyInput
                name="defaultGatoradePrice"
                value={watch('defaultGatoradePrice')}
                register={register}
                setValue={setValue}
              />
            </Field>
          </>
        )}
        <button disabled={mutation.isPending} className="btn mt-4 w-full gap-2">
          {mutation.isPending && <Loader2 className="animate-spin" />}Guardar
        </button>
      </form>
    </div>
  );
}
function MoneyInput({
  name,
  value,
  register,
  setValue,
}: {
  name: 'defaultCourtPrice' | 'defaultGatoradePrice';
  value: string | number | undefined;
  register: ReturnType<typeof useForm<FormData>>['register'];
  setValue: ReturnType<typeof useForm<FormData>>['setValue'];
}) {
  const registration = register(name);
  return (
    <div className="flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-4 focus-within:border-secondary focus-within:ring-2 focus-within:ring-blue-100">
      <span className="mr-2 font-semibold text-slate-500">$</span>
      <input
        {...registration}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className="min-w-0 flex-1 border-0 bg-transparent py-3 outline-none"
        value={formatCopInput(value)}
        onChange={(event) =>
          setValue(name, parseCopInput(event.target.value), {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      />
      <span className="ml-2 text-sm font-medium text-slate-400">COP</span>
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
    <label className="mb-4 block">
      <span className="mb-1 block font-semibold">{label}</span>
      {children}
      {error && (
        <span role="alert" className="text-sm text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}
