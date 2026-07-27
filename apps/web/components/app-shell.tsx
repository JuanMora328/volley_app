'use client';
import { usePathname } from 'next/navigation';
import { Nav } from './nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/login') return <>{children}</>;
  return (
    <>
      <Nav />
      <main className="mx-auto min-h-screen max-w-6xl p-4 pb-24 lg:ml-64 lg:pb-8">{children}</main>
    </>
  );
}
