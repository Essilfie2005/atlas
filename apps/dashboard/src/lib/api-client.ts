const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('atlas_token') ?? '' : '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...options, headers: { ...getAuthHeaders(), ...(options?.headers ?? {}) } });
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data?.error?.message ?? `Request failed: ${res.status}`);
  return data.data as T;
}
