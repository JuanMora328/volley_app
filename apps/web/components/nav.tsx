'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Home, MapPin, MoreHorizontal, Users, Volleyball } from 'lucide-react';
const items = [
  ['/', 'Inicio', Home],
  ['/sessions', 'Jornadas', CalendarDays],
  ['/players', 'Jugadores', Users],
  ['/venues', 'Canchas', MapPin],
  ['#', 'Más', MoreHorizontal],
] as const;
export function Nav() {
  const pathname = usePathname();
  return (
    <>
      <aside className="fixed left-0 top-0 hidden h-full w-64 bg-[#091426] p-5 text-white lg:block">
        <div className="mb-10 flex items-center gap-3 text-2xl font-bold">
          <Volleyball className="text-[#acf847]" /> VolleyFlow
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
      </aside>
      <nav className="fixed bottom-0 left-0 right-0 z-50 grid h-16 grid-cols-5 border-t border-[#c5c6cd] bg-white px-2 lg:hidden">
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
      </nav>
    </>
  );
}
