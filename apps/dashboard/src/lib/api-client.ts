const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('atlas_token') ?? '' : '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...options, headers: { ...getAuthHeaders(), ...(options?.headers ?? {}) } });
  const data = await res.json() as any;
  if (!res.ok) {
    const errorMsg =
      data?.error?.message ||
      (Array.isArray(data?.message) ? data.message.join(', ') : data?.message) ||
      `Request failed: ${res.status}`;
    console.error(`apiFetch failed for ${path}:`, errorMsg, data);
    throw new Error(errorMsg);
  }
  return (data?.data ?? data) as T;
}
