'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { Dialog } from './dialog';

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  pending = false,
  error,
  destructive = false,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  onConfirm(): void;
  title: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
  error?: string;
  destructive?: boolean;
}) {
  return (
    <Dialog
      busy={pending}
      description={description}
      onOpenChange={onOpenChange}
      open={open}
      title={title}
      tone={destructive ? 'danger' : 'default'}
      footer={
        <>
          <button
            className="btn-secondary sm:min-w-28"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </button>
          <button
            className={destructive ? 'btn-danger sm:min-w-40' : 'btn sm:min-w-40'}
            disabled={pending}
            onClick={onConfirm}
          >
            {pending && <Loader2 className="animate-spin" size={18} />}
            {pending ? 'Procesando…' : confirmLabel}
          </button>
        </>
      }
    >
      <div
        className={`flex gap-3 rounded-2xl p-4 ${destructive ? 'bg-red-50 text-red-900' : 'bg-blue-50 text-blue-950'}`}
      >
        <AlertTriangle className="mt-0.5 shrink-0" size={21} />
        <p className="text-sm leading-6">
          Revisa la información antes de continuar. La ventana se cerrará únicamente cuando la
          acción termine correctamente.
        </p>
      </div>
      {error && (
        <p className="form-error mt-4" role="alert">
          {error}
        </p>
      )}
    </Dialog>
  );
}
