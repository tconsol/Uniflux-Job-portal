import api from './axios';
import type { ProfileField, ProfileUpdatePayload } from '../types';

export async function getMyProfile() {
  const { data } = await api.get<{ profile: ProfileField }>('/profile/me');
  return data.profile;
}

export async function updateProfileFields(payload: ProfileUpdatePayload) {
  const { data } = await api.put<{ profile: ProfileField }>('/profile/me', payload);
  return data.profile;
}
