import api from './axios';
import type { Job, JobsResponse, JobFilters } from '../types';

export async function getJobCount(): Promise<number> {
  const { data } = await api.get<{ total: number }>('/jobs/counts');
  return data.total ?? 0;
}

export async function getJobs(filters: JobFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)); });
  const { data } = await api.get<JobsResponse>(`/jobs?${params}`);
  return data;
}

export async function getJob(id: string) {
  const { data } = await api.get<{ job: Job }>(`/jobs/${id}`);
  return data.job;
}
