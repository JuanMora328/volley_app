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
  const ballSize = maskable ? '36%' : '48%';

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
        <div
          style={{
            background: '#f7f9fb',
            border: `${Math.max(2, Math.round(size / 48))}px solid #acf847`,
            borderRadius: '50%',
            display: 'flex',
            height: ballSize,
            position: 'relative',
            transform: 'rotate(-18deg)',
            width: ballSize,
          }}
        >
          <div
            style={{
              borderBottom: `${Math.max(2, Math.round(size / 40))}px solid #0051d5`,
              height: '45%',
              left: '8%',
              position: 'absolute',
              top: '5%',
              transform: 'rotate(32deg)',
              width: '84%',
            }}
          />
          <div
            style={{
              borderLeft: `${Math.max(2, Math.round(size / 40))}px solid #0051d5`,
              height: '86%',
              left: '48%',
              position: 'absolute',
              top: '7%',
              transform: 'rotate(28deg)',
              width: '10%',
            }}
          />
        </div>
      </div>
    </div>,
    {
      height: size,
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
      width: size,
    },
  );
}
