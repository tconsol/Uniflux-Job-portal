import { useQuery } from '@tanstack/react-query';
import { getJobs, getJob } from '../api/jobs.api';
import type { JobFilters } from '../types';

export function useJobs(filters: JobFilters = {}) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => getJobs(filters),
    staleTime: 60_000,
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: () => getJob(id),
    enabled: !!id,
  });
}
