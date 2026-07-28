'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Nav } from './nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== '/login') sessionStorage.setItem('vf_return_path', pathname);
  }, [pathname]);
  if (pathname === '/login') return <>{children}</>;
  return (
    <>
      <Nav />
      <main className="mx-auto min-h-dvh max-w-6xl p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:ml-64 lg:pb-8">
        {children}
      </main>
    </>
  );
}
