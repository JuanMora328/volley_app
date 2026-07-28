'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit3,
  Loader2,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react';
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
import Link from 'next/link';
import { FullScreenLoader } from './ui/full-screen-loader';

type Kind = 'players' | 'venues';
type Item = Player | Venue;
type FormData = Record<string, string | number>;
export function CommunityPage({ kind }: { kind: Kind }) {
  const isPlayers = kind === 'players';
  const title = isPlayers ? 'Jugadores' : 'Canchas';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(isPlayers ? 'level' : 'name');
  const [editing, setEditing] = useState<Item | null | undefined>(undefined);
  const [confirmingStatus, setConfirmingStatus] = useState<Item | null>(null);
  const router = useRouter();
  const client = useQueryClient();
  useEffect(() => {
    if (!getToken()) router.replace('/login');
  }, [router]);
  useEffect(() => setPage(1), [search, status, sort]);
  const query = useQuery({
    queryKey: [kind, search, status, page, sort],
    queryFn: () =>
      api<Paginated<Item>>(
        `/${kind}?search=${encodeURIComponent(search)}&status=${status}&page=${page}&limit=12&sortBy=${isPlayers && sort === 'level' ? 'defaultLevel' : 'name'}&sortOrder=${isPlayers && sort === 'level' ? 'DESC' : 'ASC'}`,
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
    <div className="mx-auto max-w-6xl space-y-6 pb-4">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#091426] via-[#102446] to-[#0051d5] p-6 text-white shadow-xl shadow-blue-950/15 md:p-8">
        <div className="absolute -right-14 -top-16 size-52 rounded-full bg-lime-300/10 blur-2xl" />
        <div className="absolute -bottom-24 left-1/3 size-48 rounded-full bg-blue-300/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white ring-1 ring-white/20">
              {isPlayers ? <UserRound size={15} /> : <MapPin size={15} />}
              {isPlayers ? 'Comunidad deportiva' : 'Sedes de juego'}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
              {isPlayers
                ? 'Gestiona los perfiles, niveles y disponibilidad de tus jugadores.'
                : 'Administra las canchas, ubicaciones y valores habituales de cada sede.'}
            </p>
          </div>
          <button
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-lime-300 px-5 font-extrabold text-[#102000] shadow-lg shadow-lime-950/10 transition hover:-translate-y-0.5 hover:bg-lime-200 focus-visible:ring-lime-200 sm:w-auto"
            onClick={() => setEditing(null)}
          >
            {isPlayers ? <UserPlus size={20} /> : <Plus size={20} />}
            {isPlayers ? 'Nuevo jugador' : 'Nueva cancha'}
          </button>
        </div>
      </header>
      <section className="rounded-2xl border border-slate-200 bg-slate-100/70 p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="flex min-h-12 flex-1 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 shadow-sm focus-within:border-secondary focus-within:ring-4 focus-within:ring-blue-100">
            <Search className="shrink-0 text-slate-500" size={20} aria-hidden="true" />
            <span className="sr-only">Buscar</span>
            <input
              className="min-w-0 flex-1 border-0 bg-transparent py-3 outline-none placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isPlayers ? 'Buscar jugadores...' : 'Buscar por nombre o dirección...'}
            />
            {search && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                onClick={() => setSearch('')}
              >
                <X size={17} />
              </button>
            )}
          </label>
          <div className="grid grid-cols-3 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
            {[
              ['all', 'Todos'],
              ['active', 'Activos'],
              ['inactive', 'Inactivos'],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={status === value}
                className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition ${status === value ? 'bg-secondary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => setStatus(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {isPlayers && (
            <label className="relative min-w-52">
              <span className="sr-only">Ordenar jugadores</span>
              <SlidersHorizontal
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={17}
              />
              <select
                className="input appearance-none !py-2 !pl-10 !pr-10 text-sm font-semibold"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="level">Nivel: mayor a menor</option>
                <option value="name">Nombre: A a Z</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary"
                size={17}
              />
            </label>
          )}
        </div>
      </section>
      {query.isLoading ? (
        <FullScreenLoader
          title={`Cargando ${title.toLowerCase()}`}
          description="Consultando los registros disponibles…"
        />
      ) : query.isError ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-800"
        >
          <AlertCircle className="mx-auto mb-3" size={34} />
          <b className="block">No pudimos cargar {title.toLowerCase()}.</b>
          <button className="font-bold underline" onClick={() => query.refetch()}>
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-600">
              {query.data?.meta.total ?? 0} resultados
            </p>
            {isPlayers && (
              <span className="hidden text-xs font-medium text-slate-500 sm:block">
                Orden principal: {sort === 'level' ? 'nivel descendente' : 'nombre ascendente'}
              </span>
            )}
          </div>
          {!query.data?.items.length ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-blue-50 text-secondary">
                {isPlayers ? <UserRound size={28} /> : <MapPin size={28} />}
              </span>
              <p className="text-lg font-bold text-primary">No encontramos {title.toLowerCase()}</p>
              <p className="mt-1 text-sm text-slate-500">
                Cambia los filtros o crea un nuevo registro.
              </p>
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
            <nav
              aria-label="Paginación"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:justify-center sm:gap-4"
            >
              <button
                aria-label="Página anterior"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={18} /> <span className="hidden sm:inline">Anterior</span>
              </button>
              <span
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700"
                aria-current="page"
              >
                {page} <span className="font-normal text-slate-400">de</span>{' '}
                {query.data?.meta.totalPages}
              </span>
              <button
                aria-label="Página siguiente"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40"
                disabled={page === query.data?.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <span className="hidden sm:inline">Siguiente</span> <ChevronRight size={18} />
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
  const initials = item.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return (
    <article
      className={`group flex min-h-56 flex-col overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg ${item.active ? 'border-slate-200' : 'border-slate-200 bg-slate-50/80'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div
            className={`grid size-14 shrink-0 place-items-center rounded-full font-extrabold ${item.active ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-secondary ring-4 ring-blue-50' : 'bg-slate-200 text-slate-500 ring-4 ring-slate-100'}`}
          >
            {isPlayer ? initials : <MapPin />}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-extrabold text-primary">{item.name}</h2>
            {isPlayer ? (
              <div
                className="mt-1 flex items-center gap-2"
                aria-label={`Nivel ${player.defaultLevel} de 5`}
              >
                <span className="flex">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <Star
                      aria-hidden="true"
                      className={
                        level <= player.defaultLevel
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-100 text-slate-300'
                      }
                      key={level}
                      size={14}
                    />
                  ))}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Nivel {player.defaultLevel}
                </span>
              </div>
            ) : (
              <p className="truncate text-sm text-slate-500">{venue.address || 'Sin dirección'}</p>
            )}
          </div>
        </div>
        <span
          className={`inline-flex h-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ring-inset ${item.active ? 'bg-lime-100 text-lime-900 ring-lime-300' : 'bg-slate-200 text-slate-700 ring-slate-300'}`}
        >
          <span
            className={`size-1.5 rounded-full ${item.active ? 'bg-lime-600' : 'bg-slate-500'}`}
          />
          {item.active ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      {isPlayer ? (
        player.notes && (
          <p className="mt-5 line-clamp-2 rounded-xl bg-slate-50 p-3 text-sm leading-5 text-slate-600">
            {player.notes}
          </p>
        )
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Price label="Cancha" value={venue.defaultCourtPrice} />
          <Price label="Gatorades" value={venue.defaultGatoradePrice} />
        </div>
      )}
      <div className="mt-auto grid grid-cols-3 gap-1 border-t border-slate-100 pt-3">
        {isPlayer && (
          <Link
            className="col-span-1 inline-flex min-h-11 items-center justify-center gap-1 rounded-xl text-sm font-bold text-secondary transition hover:bg-blue-50"
            href={`/players/${item.id}`}
          >
            Perfil <ArrowRight size={15} />
          </Link>
        )}
        <button
          className={`${isPlayer ? 'col-span-1' : 'col-span-2'} inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-bold text-secondary transition hover:bg-blue-50`}
          onClick={onEdit}
        >
          <Edit3 size={17} /> Editar
        </button>
        <button
          className={`col-span-1 min-h-11 rounded-xl text-sm font-bold transition ${item.active ? 'text-red-700 hover:bg-red-50' : 'text-green-700 hover:bg-green-50'}`}
          onClick={onStatus}
        >
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
    onError: (error: Error) => toast.error(error.message || 'No pudimos guardar los cambios'),
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
      className="fixed inset-0 z-[60] flex items-end bg-slate-950/55 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
    >
      <form
        onSubmit={handleSubmit(submit)}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 mb-5 flex justify-between gap-4 border-b border-slate-100 bg-white px-5 py-5 sm:px-6">
          <div>
            <span className="mb-2 block h-1 w-10 rounded-full bg-secondary" />
            <h2 className="text-2xl font-extrabold tracking-tight text-primary">
              {item ? 'Editar' : 'Crear'} {isPlayers ? 'jugador' : 'cancha'}
            </h2>
            {isPlayers && (
              <p className="mt-1 text-sm text-slate-500">
                Define la información deportiva del perfil.
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            disabled={mutation.isPending}
            className="grid size-11 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            onClick={close}
          >
            <X />
          </button>
        </div>
        <div className="px-5 sm:px-6">
          <Field label="Nombre" error={errors.name?.message as string}>
            <input
              className="input"
              autoComplete="name"
              placeholder="Nombre completo"
              {...register('name')}
            />
          </Field>
          {isPlayers ? (
            <>
              <Field label="Nivel (1 a 5)" error={errors.defaultLevel?.message as string}>
                <div className="relative">
                  <select
                    className="input appearance-none !pr-11 font-semibold"
                    {...register('defaultLevel')}
                  >
                    {[1, 2, 3, 4, 5].map((level) => (
                      <option key={level} value={level}>
                        Nivel {level} de 5
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary"
                    size={18}
                  />
                </div>
              </Field>
              <Field label="Notas (opcional)" error={errors.notes?.message as string}>
                <textarea
                  className="input resize-none"
                  placeholder="Información útil para organizar los equipos"
                  rows={4}
                  {...register('notes')}
                />
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
          {mutation.isError && (
            <p className="form-error" role="alert">
              {mutation.error.message}
            </p>
          )}
        </div>
        <div className="sticky bottom-0 mt-5 flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            className="btn-secondary sm:min-w-28"
            disabled={mutation.isPending}
            onClick={close}
          >
            Cancelar
          </button>
          <button disabled={mutation.isPending} className="btn sm:min-w-40">
            {mutation.isPending && <Loader2 className="animate-spin" />}
            {mutation.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
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
    <label className="mb-5 block">
      <span className="mb-2 block text-sm font-bold text-slate-800">{label}</span>
      {children}
      {error && (
        <span role="alert" className="form-error mt-2 block">
          {error}
        </span>
      )}
    </label>
  );
}
