export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem('vf_token');
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
