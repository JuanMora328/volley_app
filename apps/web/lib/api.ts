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
    playersConfirmed: number;
    playersCapacity: number;
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
  return typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
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
    sessionStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
  }
  if (!res.ok) throw new Error('No pudimos completar la solicitud. Intenta nuevamente.');
  return res.json();
}
