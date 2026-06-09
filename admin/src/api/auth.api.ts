import api from './axios';
import type { AdminUser, AuthTokens } from '../types';

export async function adminLogin(email: string, password: string) {
  const { data } = await api.post<{ user: AdminUser; tokens: AuthTokens }>('/auth/login', { email, password });
  return data;
}

export async function getMe(): Promise<AdminUser> {
  const { data } = await api.get<{ user: AdminUser }>('/auth/me');
  return data.user;
}
