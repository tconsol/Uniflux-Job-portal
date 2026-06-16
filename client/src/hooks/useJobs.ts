import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getJobs, getJob, getJobCount, getWeekTotal } from '../api/jobs.api';
import type { Job, JobsResponse } from '../types';

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn:  () => getJobs(),
    staleTime: 5 * 60 * 1000,
    // Poll every 3s until background fetch on server completes (> 1000 jobs in cache)
    refetchInterval: (query) => {
      const jobs = (query.state.data as JobsResponse | undefined)?.jobs;
      if (!jobs || jobs.length <= 1000) return 3000;
      return false;
    },
  });
}

export function useJobCount() {
  return useQuery({
    queryKey: ['job-count'],
    queryFn:  () => getJobCount(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useWeekTotal() {
  return useQuery({
    queryKey: ['week-total'],
    queryFn:  () => getWeekTotal(),
    staleTime: 5 * 60 * 1000,
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
