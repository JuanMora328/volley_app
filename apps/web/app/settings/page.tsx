/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { api } from '../../lib/api';
export default function Settings() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['settings'], queryFn: () => api<any>('/settings') });
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<any>('/auth/me') });
  const venues = useQuery({
    queryKey: ['venues-settings'],
    queryFn: () => api<any>('/venues?status=active&limit=100'),
  });
  const form = useForm<any>();
  useEffect(() => {
    if (q.data) form.reset({ ...q.data, defaultVenueId: q.data.defaultVenue?.id || '' });
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
          defaultCourtPrice: +v.defaultCourtPrice,
          defaultGatoradePrice: +v.defaultGatoradePrice,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Ajustes guardados');
    },
    onError: () => toast.error('No pudimos guardar los ajustes'),
  });
  if (q.isLoading) return <div className="card animate-pulse">Cargando ajustes...</div>;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-3xl font-bold">Ajustes y reglas</h1>
        <p className="text-slate-500">Los cambios solo se aplican a jornadas nuevas.</p>
      </header>
      {!canEdit && (
        <div className="card bg-amber-50">
          Tu rol puede consultar esta configuración, pero solo un administrador puede editarla.
        </div>
      )}
      <form
        className="card grid gap-4 sm:grid-cols-2"
        onSubmit={form.handleSubmit(
          (v) => confirm('¿Guardar estos valores para jornadas nuevas?') && save.mutate(v),
        )}
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
        <Field label="Valor de cancha">
          <input
            className="input"
            type="number"
            min="0"
            disabled={!canEdit}
            {...form.register('defaultCourtPrice')}
          />
        </Field>
        <Field label="Valor de Gatorades">
          <input
            className="input"
            type="number"
            min="0"
            disabled={!canEdit}
            {...form.register('defaultGatoradePrice')}
          />
        </Field>
        {canEdit && (
          <button className="btn sm:col-span-2" disabled={save.isPending}>
            Guardar ajustes
          </button>
        )}
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        <Rules title="Reglas de juego" rules={q.data.fixedRules.game} />
        <Rules title="Reglas de pagos" rules={q.data.fixedRules.payments} />
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1">
      <b>{label}</b>
      {children}
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
