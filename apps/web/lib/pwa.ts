import type { QueryClient } from '@tanstack/react-query';

export const PRIVATE_CACHE_PREFIX = 'volleyflow-private-';

export async function clearPrivatePwaData(queryClient?: QueryClient) {
  queryClient?.clear();
  if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
  if (typeof caches !== 'undefined') {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((name) => name.startsWith(PRIVATE_CACHE_PREFIX))
        .map((name) => caches.delete(name)),
    );
  }
}
