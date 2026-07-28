import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from './manifest';
import { iconSizes } from '../lib/pwa-icons';

const root = process.cwd();
const sw = readFileSync(join(root, 'public/sw.js'), 'utf8');

describe('PWA manifest', () => {
  it('is standalone and exposes regular and maskable install icons', () => {
    const value = manifest();
    expect(value.name).toBe('VolleyJRN');
    expect(value.display).toBe('standalone');
    expect(value.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: '192x192', purpose: 'any' }),
        expect.objectContaining({ sizes: '512x512', purpose: 'any' }),
        expect.objectContaining({ sizes: '192x192', purpose: 'maskable' }),
        expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
      ]),
    );
  });

  it('generates every local icon and the Apple touch icon at the declared size', () => {
    expect(iconSizes).toEqual({
      'favicon-32.png': 32,
      'apple-touch-icon.png': 180,
      'icon-192.png': 192,
      'icon-512.png': 512,
      'icon-maskable-192.png': 192,
      'icon-maskable-512.png': 512,
    });
    expect(manifest().icons?.every((icon) => icon.src.startsWith('/pwa-icons/'))).toBe(true);
  });
});

describe('auditable service worker policies', () => {
  it('prepares offline fallback, version cleanup and controlled updates', () => {
    expect(sw).toContain("const OFFLINE_URL = '/offline'");
    expect(sw).toContain("self.addEventListener('activate'");
    expect(sw).toContain("event.data?.type === 'SKIP_WAITING'");
    expect(sw).toContain("event.data?.type === 'CLEAR_PRIVATE_CACHES'");
  });

  it('does not cache APIs or mutations and stores only successful static assets', () => {
    expect(sw).toContain("url.pathname.startsWith('/api/')");
    expect(sw).toContain("!['GET', 'HEAD'].includes(request.method)");
    expect(sw).toContain('response.ok && response.status === 200');
    expect(sw).not.toContain("addEventListener('sync'");
  });
});
