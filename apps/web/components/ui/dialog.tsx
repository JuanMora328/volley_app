'use client';

import { X } from 'lucide-react';
import { useEffect, useId } from 'react';

type DialogProps = {
  open: boolean;
  onOpenChange(open: boolean): void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  busy?: boolean;
  tone?: 'default' | 'danger';
};

/** Diálogo al estilo shadcn: drawer en móvil y modal centrado desde tablet. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  busy = false,
  tone = 'default',
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onOpenChange(false);
    };
    document.addEventListener('keydown', close);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', close);
      document.body.style.overflow = '';
    };
  }, [busy, onOpenChange, open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end bg-slate-950/55 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onOpenChange(false);
      }}
    >
      <section
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl"
        role="dialog"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-5 sm:px-6">
          <div>
            <span
              className={`mb-2 block h-1 w-10 rounded-full ${tone === 'danger' ? 'bg-red-500' : 'bg-secondary'}`}
            />
            <h2 className="text-2xl font-extrabold tracking-tight text-primary" id={titleId}>
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm leading-6 text-slate-600" id={descriptionId}>
                {description}
              </p>
            )}
          </div>
          <button
            aria-label="Cerrar diálogo"
            className="grid size-11 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-50"
            disabled={busy}
            onClick={() => onOpenChange(false)}
            type="button"
          >
            <X size={20} />
          </button>
        </header>
        <div className="px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <footer className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}
