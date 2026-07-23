import './globals.css';
import { Providers } from '../components/providers';
import { AppShell } from '../components/app-shell';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
