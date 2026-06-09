import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import JobCard from '../components/JobCard';
import JobFiltersBar from '../components/JobFilters';
import { useJobs } from '../hooks/useJobs';
import { useSSE } from '../hooks/useSSE';
import { useSubscription } from '../hooks/useBilling';
import type { JobFilters } from '../types';

const PLAN_LIMIT_LABELS: Record<string, string> = {
  basic: 'Showing 10 jobs (Basic plan)',
  standard: 'Showing up to 100 jobs (Standard)',
  premium: 'Showing up to 1,000 jobs (Premium)',
  elite: 'All jobs (Elite)',
};

export default function Jobs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<JobFilters>({ page: 1, limit: 20 });
  const { data, isLoading, isError, refetch } = useJobs(filters);
  const { data: subData } = useSubscription();

  useSSE({
    onJobUpdate: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    }, [queryClient]),
    enabled: true,
  });

  const planSlug = data?.planSlug ?? subData?.subscription?.planSlug ?? 'basic';
  const totalPages = data ? Math.ceil(data.total / (filters.limit ?? 20)) : 0;
  const currentPage = filters.page ?? 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
            <p className="text-sm text-gray-500 mt-1">
              {data ? `${data.total.toLocaleString()} results` : '—'}
              {' · '}
              <span className="text-brand-600">{PLAN_LIMIT_LABELS[planSlug]}</span>
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <JobFiltersBar filters={filters} onChange={setFilters} />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-gray-600 font-medium">Failed to load jobs</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">Check your connection or try again</p>
            <button
              onClick={() => refetch()}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Retry
            </button>
          </div>
        ) : !data?.jobs.length ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No jobs match your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.jobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  onClick={() => navigate(`/jobs/${job._id}`)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, currentPage - 1) }))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: Math.min(totalPages, currentPage + 1) }))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
