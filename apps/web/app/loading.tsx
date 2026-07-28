import { Loader2, Volleyball } from 'lucide-react';

export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-[#f7f9fb]/95 px-6 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full max-w-xs flex-col items-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="relative grid size-16 place-items-center rounded-2xl bg-[#091426] text-lime-300">
          <Volleyball size={34} />
          <Loader2
            className="absolute -inset-2 size-20 animate-spin text-secondary"
            strokeWidth={1.5}
          />
        </div>
        <p className="mt-5 text-lg font-extrabold text-primary">Preparando VolleyFlow</p>
        <p className="mt-1 text-sm text-slate-500">Cargando la información de la jornada…</p>
      </div>
    </div>
  );
}
