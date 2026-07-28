import Image from 'next/image';

export function BrandLogo({ size = 48 }: { size?: number }) {
  return (
    <Image
      alt="Icono de VolleyJRN"
      className="rounded-[22%]"
      height={size}
      priority
      src="/pwa-icons/icon-192.png"
      unoptimized
      width={size}
    />
  );
}
