import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Providers } from '../components/providers';
import { AppShell } from '../components/app-shell';

export const metadata: Metadata = {
  applicationName: 'VolleyFlow',
  title: { default: 'VolleyFlow', template: '%s | VolleyFlow' },
  description: 'Organiza jornadas, equipos y partidos de voleibol.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/pwa-icons/favicon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/pwa-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VolleyFlow',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#091426',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};
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
