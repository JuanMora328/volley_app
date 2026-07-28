import { ImageResponse } from 'next/og';
import { iconSizes, type IconName } from '@/lib/pwa-icons';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return Object.keys(iconSizes).map((icon) => ({ icon }));
}

export async function GET(_: Request, context: { params: Promise<{ icon: string }> }) {
  const { icon } = await context.params;
  if (!(icon in iconSizes)) return new Response('Icono no encontrado', { status: 404 });

  const size = iconSizes[icon as IconName];
  const maskable = icon.startsWith('icon-maskable-');
  const tileSize = maskable ? '60%' : '80%';
  const ballSize = maskable ? '42%' : '58%';

  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: '#091426',
        display: 'flex',
        height: '100%',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          background: '#0051d5',
          borderRadius: '22%',
          display: 'flex',
          height: tileSize,
          justifyContent: 'center',
          position: 'relative',
          width: tileSize,
        }}
      >
        <svg height={ballSize} viewBox="0 0 100 100" width={ballSize}>
          <circle cx="50" cy="50" fill="#f7f9fb" r="43" stroke="#acf847" strokeWidth="6" />
          <g fill="none" stroke="#0051d5" strokeLinecap="round" strokeWidth="6">
            <path d="M50 8C51 25 42 36 25 44" />
            <path d="M13 29C31 30 45 39 55 53" />
            <path d="M28 84C34 64 46 52 64 45" />
            <path d="M86 32C68 39 59 52 59 72" />
            <path d="M75 82C65 64 50 57 32 58" />
          </g>
        </svg>
      </div>
    </div>,
    {
      height: size,
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
      width: size,
    },
  );
}
