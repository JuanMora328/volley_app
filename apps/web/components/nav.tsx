'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Home, LogOut, MapPin, Settings, Users } from 'lucide-react';
import { clearPrivatePwaData } from '../lib/pwa';
import { BrandLogo } from './brand-logo';
const items = [
  ['/', 'Inicio', Home],
  ['/sessions', 'Jornadas', CalendarDays],
  ['/players', 'Jugadores', Users],
  ['/venues', 'Canchas', MapPin],
  ['/settings', 'Ajustes', Settings],
] as const;
export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = async () => {
    await clearPrivatePwaData(queryClient);
    navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_PRIVATE_CACHES' });
    router.replace('/login');
  };
  return (
    <>
      <aside className="fixed left-0 top-0 hidden h-full w-64 bg-[#091426] p-5 text-white lg:block">
        <div className="mb-10 flex items-center gap-3 text-2xl font-bold">
          <BrandLogo size={40} /> VolleyJRN
        </div>
        <nav className="space-y-2">
          {items.map(([href, label, Icon]) => {
            const active =
              href === '/' ? pathname === '/' : pathname.startsWith(href.replace('#', '/more'));
            return (
              <Link
                className={`flex gap-3 rounded-2xl p-3 font-semibold ${active ? 'bg-[#0051d5]' : 'text-white/70 hover:bg-white/10'}`}
                href={href}
                key={label}
              >
                <Icon /> {label}
              </Link>
            );
          })}
        </nav>
        <button
          className="absolute bottom-6 left-5 flex gap-3 rounded-xl p-3 text-white/70 hover:bg-white/10"
          onClick={logout}
        >
          <LogOut /> Cerrar sesión
        </button>
      </aside>
      <nav className="fixed bottom-0 left-0 right-0 z-50 grid h-[calc(4rem+env(safe-area-inset-bottom))] grid-cols-6 border-t border-[#c5c6cd] bg-white px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
        {items.map(([href, label, Icon]) => {
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href.replace('#', '/more'));
          return (
            <Link
              className={`flex flex-col items-center justify-center rounded-2xl text-xs font-medium ${active ? 'bg-[#316bf3] text-white' : 'text-[#45474c]'}`}
              href={href}
              key={label}
            >
              <Icon size={22} /> {label}
            </Link>
          );
        })}
        <button
          className="flex flex-col items-center justify-center rounded-2xl text-xs font-medium text-[#45474c]"
          onClick={logout}
        >
          <LogOut size={22} /> Salir
        </button>
      </nav>
    </>
  );
}
