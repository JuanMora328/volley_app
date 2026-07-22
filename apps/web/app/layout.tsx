import './globals.css';
import { Providers } from '../components/providers';
import { Nav } from '../components/nav';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <Nav />
          <main className="mx-auto min-h-screen max-w-6xl p-4 pb-24 md:ml-60 md:pb-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
