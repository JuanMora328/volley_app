'use client';

import { Loader2, Volleyball } from 'lucide-react';

export function FullScreenLoader({
  title = 'Cargando información',
  description = 'Estamos preparando todo para ti…',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[100] grid min-h-[100dvh] place-items-center overflow-hidden bg-slate-950/35 px-5 backdrop-blur-md"
      role="status"
    >
      <div className="absolute -left-24 -top-24 size-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-20 size-72 rounded-full bg-lime-400/20 blur-3xl" />
      <div className="relative flex w-full max-w-sm flex-col items-center rounded-3xl border border-white/70 bg-white/95 p-8 text-center shadow-2xl shadow-slate-950/20">
        <div className="relative grid size-16 place-items-center rounded-2xl bg-[#091426] text-lime-300 shadow-lg">
          <Volleyball size={34} />
          <Loader2
            aria-hidden="true"
            className="absolute -inset-2 size-20 animate-spin text-[#316bf3]"
            strokeWidth={1.5}
          />
        </div>
        <h1 className="mt-6 text-xl font-extrabold tracking-tight text-[#091426]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-6 flex gap-1.5" aria-hidden="true">
          {[0, 150, 300].map((delay) => (
            <span
              className="size-2 animate-bounce rounded-full bg-secondary"
              key={delay}
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
