import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getJobs, getJob, getJobCount } from '../api/jobs.api';
import type { Job, JobsResponse } from '../types';

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn:  () => getJobs(),
    staleTime: 5 * 60 * 1000, // 5 min — data rarely changes mid-session
  });
}

export function useJobCount() {
  return useQuery({
    queryKey: ['job-count'],
    queryFn:  () => getJobCount(),
    staleTime: 10 * 60 * 1000, // 10 min
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
    queryFn:  () => getJob(id),
    enabled:  !!id,
    initialData: findInCache,
  });
}
