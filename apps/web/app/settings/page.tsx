/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings2, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { formatCopInput, parseCopInput } from '../../lib/community';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { FullScreenLoader } from '../../components/ui/full-screen-loader';
export default function Settings() {
  const [pendingValues, setPendingValues] = useState<any>(null);
  const [saveError, setSaveError] = useState('');
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['settings'], queryFn: () => api<any>('/settings') });
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<any>('/auth/me') });
  const venues = useQuery({
    queryKey: ['venues-settings'],
    queryFn: () => api<any>('/venues?status=active&limit=100'),
  });
  const form = useForm<any>();
  useEffect(() => {
    if (q.data)
      form.reset({
        ...q.data,
        defaultVenueId: q.data.defaultVenue?.id || '',
        defaultCourtPrice: formatCopInput(q.data.defaultCourtPrice),
        defaultGatoradePrice: formatCopInput(q.data.defaultGatoradePrice),
      });
  }, [q.data, form]);
  const canEdit = me.data?.role === 'ADMIN';
  const save = useMutation({
    mutationFn: (v: any) =>
      api('/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          ...v,
          defaultVenueId: v.defaultVenueId || null,
          defaultTeamCount: +v.defaultTeamCount,
          defaultTargetScore: +v.defaultTargetScore,
          defaultCourtPrice: parseCopInput(v.defaultCourtPrice),
          defaultGatoradePrice: parseCopInput(v.defaultGatoradePrice),
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Ajustes guardados');
      setPendingValues(null);
    },
    onError: () => {
      setSaveError('No pudimos guardar los ajustes. Revisa tu conexión e inténtalo otra vez.');
      toast.error('No pudimos guardar los ajustes');
    },
  });
  if (q.isLoading)
    return (
      <FullScreenLoader
        title="Cargando ajustes"
        description="Consultando la configuración de VolleyFlow…"
      />
    );
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-6">
      <header className="relative overflow-hidden rounded-3xl bg-[#091426] p-6 text-white shadow-xl md:p-8">
        <Settings2 className="absolute -bottom-5 -right-3 size-32 text-white/5" />
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-lime-300">
          Administración
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
          Ajustes y reglas
        </h1>
        <p className="mt-2 max-w-xl text-blue-100">
          Define los valores iniciales con los que se prepararán las próximas jornadas.
        </p>
      </header>
      {!canEdit && (
        <div
          className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950"
          role="status"
        >
          <ShieldCheck className="shrink-0" />
          <p>
            Tu rol puede consultar esta configuración, pero solo un administrador puede editarla.
          </p>
        </div>
      )}
      <form
        className="card grid gap-4 sm:grid-cols-2"
        onSubmit={form.handleSubmit((v) => {
          setSaveError('');
          setPendingValues(v);
        })}
      >
        <Field label="Organización">
          <input
            className="input"
            disabled={!canEdit}
            {...form.register('organizationName', { required: true })}
          />
        </Field>
        <Field label="Zona horaria">
          <input
            className="input"
            disabled={!canEdit}
            {...form.register('timezone', { required: true })}
          />
        </Field>
        <Field label="Cantidad de equipos">
          <input
            className="input"
            type="number"
            min="2"
            disabled={!canEdit}
            {...form.register('defaultTeamCount')}
          />
        </Field>
        <Field label="Puntaje objetivo">
          <input
            className="input"
            type="number"
            min="1"
            disabled={!canEdit}
            {...form.register('defaultTargetScore')}
          />
        </Field>
        <Field label="Cancha predeterminada">
          <select className="input" disabled={!canEdit} {...form.register('defaultVenueId')}>
            <option value="">Ninguna</option>
            {venues.data?.items?.map((v: any) => (
              <option value={v.id} key={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Valor de cancha" hint="Pesos colombianos">
          <CurrencyInput
            disabled={!canEdit}
            value={form.watch('defaultCourtPrice')}
            onChange={(value) => form.setValue('defaultCourtPrice', value, { shouldDirty: true })}
          />
        </Field>
        <Field label="Valor de Gatorades" hint="Precio unitario en pesos colombianos">
          <CurrencyInput
            disabled={!canEdit}
            value={form.watch('defaultGatoradePrice')}
            onChange={(value) =>
              form.setValue('defaultGatoradePrice', value, { shouldDirty: true })
            }
          />
        </Field>
        {canEdit && (
          <button
            className="btn mt-2 sm:col-span-2"
            disabled={save.isPending || !form.formState.isDirty}
          >
            Guardar ajustes
          </button>
        )}
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        <Rules title="Reglas de juego" rules={q.data.fixedRules.game} />
        <Rules title="Reglas de pagos" rules={q.data.fixedRules.payments} />
      </div>
      <ConfirmDialog
        confirmLabel="Guardar configuración"
        description="Estos valores serán los predeterminados para las jornadas que se creen en adelante. Las jornadas existentes no cambiarán."
        error={saveError}
        onConfirm={() => pendingValues && save.mutate(pendingValues)}
        onOpenChange={(open) => !open && !save.isPending && setPendingValues(null)}
        open={Boolean(pendingValues)}
        pending={save.isPending}
        title="¿Guardar nuevos ajustes?"
      />
    </div>
  );
}
function CurrencyInput({
  value,
  disabled,
  onChange,
}: {
  value?: string | number;
  disabled: boolean;
  onChange(value: string): void;
}) {
  return (
    <div className="flex min-h-12 w-full items-stretch overflow-hidden rounded-xl border border-slate-300 bg-white transition focus-within:border-[#0051d5] focus-within:ring-2 focus-within:ring-blue-100 has-[:disabled]:bg-slate-100 has-[:disabled]:text-slate-500">
      <span className="flex w-10 shrink-0 items-center justify-center border-r border-slate-200 bg-slate-50 font-bold text-slate-500">
        $
      </span>
      <input
        className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-right font-semibold tabular-nums outline-none disabled:cursor-not-allowed"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        disabled={disabled}
        value={formatCopInput(value)}
        onChange={(event) => onChange(formatCopInput(event.target.value))}
        aria-label="Valor en pesos colombianos"
      />
      <span className="flex w-14 shrink-0 items-center justify-center border-l border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
        COP
      </span>
    </div>
  );
}
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1">
      <b>{label}</b>
      {children}
      {hint && <small className="block text-slate-500">{hint}</small>}
    </label>
  );
}
function Rules({ title, rules }: { title: string; rules: string[] }) {
  return (
    <section className="card">
      <h2 className="text-xl font-bold">{title}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        {rules.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </section>
  );
}
