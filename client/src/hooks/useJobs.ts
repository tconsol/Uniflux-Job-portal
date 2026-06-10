import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getJobs, getJob } from '../api/jobs.api';
import type { Job, JobFilters, JobsResponse } from '../types';

export function useJobs(filters: JobFilters = {}) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => getJobs(filters),
    staleTime: 60_000,
  });
}

export function useJob(id: string) {
  const queryClient = useQueryClient();

  function findInCache(): Job | undefined {
    const queries = queryClient.getQueriesData<JobsResponse>({ queryKey: ['jobs'] });
    for (const [, data] of queries) {
      const found = data?.jobs?.find((j) => j._id === id);
      if (found) return found;
    }
    return undefined;
  }

  return useQuery({
    queryKey: ['job', id],
    queryFn: () => getJob(id),
    enabled: !!id,
    initialData: findInCache,
  });
}
