import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const api = axios.create({
  baseURL: `${BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const tokens = getStoredTokens();
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const tokens = getStoredTokens();
        if (!tokens?.refresh) throw new Error('No refresh token');
        const { data } = await axios.post(`${BASE}/api/auth/refresh`, { refreshToken: tokens.refresh });
        setStoredTokens(data.tokens);
        original.headers.Authorization = `Bearer ${data.tokens.access}`;
        return api(original);
      } catch {
        clearStoredTokens();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export function getStoredTokens() {
  try {
    const raw = localStorage.getItem('jobwalkers_tokens');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredTokens(tokens: { access: string; refresh: string }) {
  localStorage.setItem('jobwalkers_tokens', JSON.stringify(tokens));
}

export function clearStoredTokens() {
  localStorage.removeItem('jobwalkers_tokens');
}

export default api;
