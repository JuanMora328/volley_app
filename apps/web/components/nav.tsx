import Link from 'next/link';
import { Home, Users, MapPin, CalendarDays } from 'lucide-react';
const items = [
  ['/', 'Inicio', Home],
  ['/players', 'Jugadores', Users],
  ['/venues', 'Canchas', MapPin],
  ['/sessions', 'Jornadas', CalendarDays],
] as const;
export function Nav() {
  return (
    <>
      <aside className="fixed left-0 top-0 hidden h-full w-60 border-r bg-white p-5 md:block">
        <h1 className="mb-8 text-2xl font-bold text-primary">VolleyFlow</h1>
        {items.map(([href, label, Icon]) => (
          <Link className="mb-2 flex gap-3 rounded-xl p-3 hover:bg-muted" href={href} key={href}>
            <Icon /> {label}
          </Link>
        ))}
      </aside>
      <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-4 border-t bg-white p-2 md:hidden">
        {items.map(([href, label, Icon]) => (
          <Link className="flex flex-col items-center text-xs" href={href} key={href}>
            <Icon /> {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
