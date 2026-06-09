import api from './axios';
import type { User, AuthTokens } from '../types';

export async function register(name: string, email: string, password: string) {
  const { data } = await api.post<{ message: string; email: string }>('/auth/register', { name, email, password });
  return data;
}

export async function verifyOtp(email: string, otp: string) {
  const { data } = await api.post<{ message: string; user: User; tokens: AuthTokens }>('/auth/verify-otp', { email, otp });
  return data;
}

export async function resendOtp(email: string) {
  const { data } = await api.post<{ message: string; email: string }>('/auth/resend-otp', { email });
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<{ user: User; tokens: AuthTokens }>('/auth/login', { email, password });
  return data;
}

export async function getMe() {
  const { data } = await api.get<{ user: User }>('/auth/me');
  return data.user;
}

export async function getGoogleOAuthUrl() {
  const { data } = await api.get<{ url: string }>('/auth/oauth/google');
  return data.url;
}

export async function refreshTokens(refreshToken: string) {
  const { data } = await api.post<{ tokens: AuthTokens }>('/auth/refresh', { refreshToken });
  return data.tokens;
}
