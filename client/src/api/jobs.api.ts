import api from './axios';
import type { Job, JobsResponse, JobFilters, CountsResponse } from '../types';

export async function getJobs(filters: JobFilters = {}): Promise<JobsResponse> {
  const params: Record<string, string> = {};
  if (filters.page && filters.page > 0) params.page    = String(filters.page);
  if (filters.keyword)                  params.keyword  = filters.keyword;
  if (filters.location)                 params.location = filters.location;
  if (filters.jobType)                  params.jobType  = filters.jobType;
  const { data } = await api.get<JobsResponse>('/jobs', { params });
  return data;
}

export async function getCounts(filters: Omit<JobFilters, 'page'> = {}): Promise<CountsResponse> {
  const params: Record<string, string> = {};
  if (filters.keyword)  params.keyword  = filters.keyword;
  if (filters.location) params.location = filters.location;
  if (filters.jobType)  params.jobType  = filters.jobType;
  const { data } = await api.get<CountsResponse>('/jobs/counts', { params });
  return data;
}

export async function getJobCount(): Promise<number> {
  const data = await getCounts();
  return data.total ?? 0;
}

export async function getWeekTotal(): Promise<number> {
  return getJobCount();
}

export async function getJob(id: string): Promise<Job> {
  const { data } = await api.get<{ job: Job }>(`/jobs/${id}`);
  return data.job;
}
