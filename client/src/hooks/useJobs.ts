import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getJobs, getJob, getJobCount, getCounts } from '../api/jobs.api';
import type { Job, JobFilters, JobsResponse, CountsResponse } from '../types';

export function useJobs(filters: JobFilters = {}) {
  return useQuery({
    queryKey:        ['jobs', filters],
    queryFn:         () => getJobs(filters),
    staleTime:       2 * 60 * 1000,
    placeholderData: keepPreviousData,
    // Poll every 5s until server background fetch is complete; SSE also triggers refetch
    refetchInterval: (query) => {
      const data = query.state.data as JobsResponse | undefined;
      if (!data || !data.isFullyLoaded) return 5000;
      return false;
    },
  });
}

export function useCounts(filters: Omit<JobFilters, 'page'> = {}) {
  return useQuery<CountsResponse>({
    queryKey:  ['job-counts', filters],
    queryFn:   () => getCounts(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useJobCount() {
  return useQuery({
    queryKey:  ['job-count'],
    queryFn:   () => getJobCount(),
    staleTime: 10 * 60 * 1000,
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
    queryKey:    ['job', id],
    queryFn:     () => getJob(id),
    enabled:     !!id,
    initialData: findInCache,
  });
}
