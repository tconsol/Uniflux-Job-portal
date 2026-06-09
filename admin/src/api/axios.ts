import axios from 'axios';
import type { AuthTokens } from '../types';

const STORAGE_KEY = 'uniflux_admin_tokens';

export function getStoredTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredTokens(tokens: AuthTokens) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function clearStoredTokens() {
  localStorage.removeItem(STORAGE_KEY);
}

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const tokens = getStoredTokens();
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

let refreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const tokens = getStoredTokens();
      if (!tokens?.refresh) {
        clearStoredTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      if (refreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }
      refreshing = true;
      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken: tokens.refresh });
        const newTokens = { access: data.tokens.access, refresh: data.tokens.refresh };
        setStoredTokens(newTokens);
        refreshQueue.forEach((cb) => cb(data.tokens.access));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${data.tokens.access}`;
        return api(original);
      } catch {
        clearStoredTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
