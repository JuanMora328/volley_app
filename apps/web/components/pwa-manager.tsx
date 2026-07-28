'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { clearPrivatePwaData } from '../lib/pwa';

const pwaEnabled =
  process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_PWA === 'true';

async function originIsReachable() {
  if (!navigator.onLine) return false;
  try {
    const response = await fetch('/manifest.webmanifest', {
      cache: 'no-store',
      headers: { 'x-volleyflow-connectivity-check': '1' },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function PwaManager() {
  const queryClient = useQueryClient();
  const [offline, setOffline] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const reloading = useRef(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    const clear = () => void clearPrivatePwaData(queryClient);
    window.addEventListener('volleyflow:clear-session', clear);
    return () => window.removeEventListener('volleyflow:clear-session', clear);
  }, [queryClient]);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const nextOffline = !(await originIsReachable());
      if (!active) return;
      setOffline(nextOffline);
      if (wasOffline.current && !nextOffline) toast.success('Conexión recuperada');
      wasOffline.current = nextOffline;
    };
    void check();
    const interval = window.setInterval(check, 30_000);
    window.addEventListener('online', check);
    window.addEventListener('offline', check);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('online', check);
      window.removeEventListener('offline', check);
    };
  }, []);

  useEffect(() => {
    if (!pwaEnabled || !('serviceWorker' in navigator)) return;
    const watch = (worker: ServiceWorker) => {
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) setWaiting(worker);
      });
    };
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((result) => {
        if (result.waiting) setWaiting(result.waiting);
        result.addEventListener('updatefound', () => {
          if (result.installing) watch(result.installing);
        });
      })
      .catch(() => toast.error('No se pudo activar el soporte sin conexión.'));
    const change = () => {
      if (reloading.current) return;
      reloading.current = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', change);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', change);
    };
  }, []);

  const activateUpdate = () => {
    const editing = document.querySelector('form :is(input, textarea, select):focus');
    if (editing && !window.confirm('Hay un formulario activo. ¿Actualizar y recargar la página?'))
      return;
    waiting?.postMessage({ type: 'SKIP_WAITING' });
  };

  return (
    <>
      {offline && (
        <div
          className="fixed right-3 top-3 z-[70] flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-lg"
          role="status"
        >
          <WifiOff size={16} /> Sin conexión
        </div>
      )}
      {waiting && (
        <aside
          className="fixed bottom-20 left-4 right-4 z-[70] mx-auto max-w-lg rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl lg:bottom-5"
          role="status"
        >
          <div className="flex gap-3">
            <Wifi className="shrink-0 text-blue-700" />
            <div>
              <b>Hay una actualización disponible</b>
              <p className="mt-1 text-sm text-slate-600">
                Al actualizar, esta página se recargará.
              </p>
              <button className="btn mt-3 min-h-10" onClick={activateUpdate}>
                Actualizar
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
