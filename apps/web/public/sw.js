/* VolleyJRN service worker: intentionally explicit; no business/API response is cached. */
const VERSION = 'v1';
const OFFLINE_CACHE = `volleyflow-offline-${VERSION}`;
const STATIC_CACHE = `volleyflow-static-${VERSION}`;
const PRIVATE_PREFIX = 'volleyflow-private-';
const OWNED_PREFIXES = ['volleyflow-offline-', 'volleyflow-static-', PRIVATE_PREFIX];
const OFFLINE_URL = '/offline';
const STATIC_LIMIT = 80;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) =>
        cache.addAll([
          OFFLINE_URL,
          '/pwa-icons/icon-192.png',
          '/pwa-icons/icon-512.png',
          '/pwa-icons/apple-touch-icon.png',
        ]),
      ),
  );
});

self.addEventListener('activate', (event) => {
  const current = new Set([OFFLINE_CACHE, STATIC_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => OWNED_PREFIXES.some((prefix) => name.startsWith(prefix)))
            .filter((name) => !current.has(name) && !name.startsWith(PRIVATE_PREFIX))
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_PRIVATE_CACHES') {
    event.waitUntil(
      caches
        .keys()
        .then((names) =>
          Promise.all(
            names
              .filter((name) => name.startsWith(PRIVATE_PREFIX))
              .map((name) => caches.delete(name)),
          ),
        ),
    );
  }
});

function isStaticAsset(url) {
  if (url.origin !== self.location.origin) return false;
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/pwa-icons/') ||
    /\.(?:css|js|woff2?|png|jpe?g|webp|svg|ico)$/.test(url.pathname)
  );
}

async function trimCache(cache) {
  const keys = await cache.keys();
  await Promise.all(
    keys.slice(0, Math.max(0, keys.length - STATIC_LIMIT)).map((key) => cache.delete(key)),
  );
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.status === 200 && response.type === 'basic') {
    await cache.put(request, response.clone());
    await trimCache(cache);
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Cross-origin traffic, API/auth/finance, health and Swagger are always left to the network.
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/docs') ||
    url.pathname.includes('swagger') ||
    url.pathname.includes('health')
  ) {
    return;
  }

  // Mutations are never cached, queued or replayed.
  if (!['GET', 'HEAD'].includes(request.method)) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(JSON.stringify({ message: 'Esta acción requiere conexión a internet.' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }
  if (isStaticAsset(url)) event.respondWith(cacheFirst(request));
});
