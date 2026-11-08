const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  let token = '';
  if (typeof window !== 'undefined') {
    token = sessionStorage.getItem('atlas_token') || '';
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    sessionStorage.removeItem('atlas_token');
    window.location.href = '/login';
  }

  const data = await response.json();
  return data;
}

export const api = {
  auth: {
    login: (email: string, password: string) => fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    keys: {
      list: () => fetchWithAuth('/auth/keys'),
      create: (data: any) => fetchWithAuth('/auth/keys', { method: 'POST', body: JSON.stringify(data) }),
      revoke: (id: string) => fetchWithAuth(`/auth/keys/${id}`, { method: 'DELETE' }),
    },
  },
  merchants: {
    me: () => fetchWithAuth('/merchants/me'),
    update: (data: any) => fetchWithAuth('/merchants/me', { method: 'PATCH', body: JSON.stringify(data) }),
  },
  payments: {
    list: (params: any = {}) => {
      const qs = new URLSearchParams(params).toString();
      return fetchWithAuth(`/payments${qs ? '?' + qs : ''}`);
    },
    get: (id: string) => fetchWithAuth(`/payments/${id}`),
  },
  payouts: {
    list: (params: any = {}) => {
      const qs = new URLSearchParams(params).toString();
      return fetchWithAuth(`/payouts${qs ? '?' + qs : ''}`);
    },
    create: (data: any) => fetchWithAuth('/payouts', { method: 'POST', body: JSON.stringify(data) }),
  },
  beneficiaries: {
    list: () => fetchWithAuth('/beneficiaries'),
    create: (data: any) => fetchWithAuth('/beneficiaries', { method: 'POST', body: JSON.stringify(data) }),
  },
  webhooks: {
    events: (params: any = {}) => {
      const qs = new URLSearchParams(params).toString();
      return fetchWithAuth(`/webhooks/events${qs ? '?' + qs : ''}`);
    },
    retry: (id: string) => fetchWithAuth(`/webhooks/events/${id}/retry`, { method: 'POST' }),
  },
  settlements: {
    list: (params: any = {}) => {
      const qs = new URLSearchParams(params).toString();
      return fetchWithAuth(`/settlements${qs ? '?' + qs : ''}`);
    },
  },
};
