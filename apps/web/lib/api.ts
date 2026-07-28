export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
export const TOKEN_KEY = 'vf_token';

export type LoginResponse = {
  accessToken: string;
  user: { id: string; name: string; email: string; role: string };
};

export type DashboardResponse = {
  activeSession: null | {
    id: string;
    title: string;
    date: string;
    venueName: string;
    participantCount: number;
    statusLabel: string;
  };
  stats: {
    activePlayers: number;
    completedSessions: number;
    pendingPayments: number;
    registeredMatches: number;
  };
  recentSessions: Array<{ id: string; title: string; date: string; status: string }>;
};

export function getToken() {
  return typeof localStorage === 'undefined' ? null : localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  if (
    method !== 'GET' &&
    method !== 'HEAD' &&
    typeof navigator !== 'undefined' &&
    !navigator.onLine
  ) {
    throw new Error('Esta acción requiere conexión a internet. No se guardó ningún cambio.');
  }
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (
    res.status === 401 &&
    typeof window !== 'undefined' &&
    window.location.pathname !== '/login'
  ) {
    sessionStorage.setItem(
      'vf_return_path',
      `${window.location.pathname}${window.location.search}`,
    );
    window.dispatchEvent(new Event('volleyflow:clear-session'));
    window.location.href = '/login';
  }
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const message = Array.isArray(payload?.message) ? payload.message.join('. ') : payload?.message;
    throw new Error(message || 'No pudimos completar la solicitud. Intenta nuevamente.');
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
