const BASE = import.meta.env.VITE_API_URL || '';

export const getToken = () => localStorage.getItem('stikdead_token');
export const setToken = (t) => localStorage.setItem('stikdead_token', t);
export const clearToken = () => localStorage.removeItem('stikdead_token');

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* resposta sem corpo */
  }

  if (!res.ok) {
    const err = new Error(data?.error || 'Algo deu errado. Tente novamente.');
    err.status = res.status;
    throw err;
  }
  return data;
}
