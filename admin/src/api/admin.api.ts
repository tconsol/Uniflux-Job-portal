import api from './axios';
import type { Plan, RevenueSummary, UsersResponse, UserDetail } from '../types';

// Revenue
export async function getRevenueSummary(): Promise<RevenueSummary> {
  const { data } = await api.get('/admin/revenue');
  return data;
}

// Users
export async function getUsers(page = 1, search = ''): Promise<UsersResponse> {
  const { data } = await api.get('/admin/users', { params: { page, limit: 20, search } });
  return data;
}

export async function getUserDetail(userId: string): Promise<UserDetail> {
  const { data } = await api.get(`/admin/users/${userId}`);
  return data;
}

export async function updateUserSubscription(userId: string, planSlug: string, status: string) {
  const { data } = await api.put(`/admin/users/${userId}/subscription`, { planSlug, status });
  return data;
}

export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/admin/users/${userId}`);
}

// Plans
export async function listPlans(): Promise<Plan[]> {
  const { data } = await api.get<{ plans: Plan[] }>('/admin/plans');
  return data.plans;
}

export async function createPlan(payload: Partial<Plan>): Promise<Plan> {
  const { data } = await api.post<{ plan: Plan }>('/admin/plans', payload);
  return data.plan;
}

export async function updatePlan(planId: string, payload: Partial<Plan>): Promise<Plan> {
  const { data } = await api.put<{ plan: Plan }>(`/admin/plans/${planId}`, payload);
  return data.plan;
}

export async function deletePlan(planId: string): Promise<void> {
  await api.delete(`/admin/plans/${planId}`);
}

// Scheduler
export async function triggerDailyJobSets(): Promise<{ message: string }> {
  const { data } = await api.post('/admin/trigger-daily-jobs');
  return data;
}
