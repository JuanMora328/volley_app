export const iconSizes = {
  'favicon-32.png': 32,
  'apple-touch-icon.png': 180,
  'icon-192.png': 192,
  'icon-512.png': 512,
  'icon-maskable-192.png': 192,
  'icon-maskable-512.png': 512,
} as const;

export type IconName = keyof typeof iconSizes;
