import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, Briefcase, ExternalLink } from 'lucide-react';
import { getAppliedJobs } from '../api/apply.api';

export default function Applications() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['applied-jobs'],
    queryFn:  getAppliedJobs,
    staleTime: 30_000,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data ? `${data.total} job${data.total !== 1 ? 's' : ''} applied` : '—'}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-gray-600 font-medium">Failed to load applications</p>
            <button onClick={() => refetch()} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium mt-4">
              Retry
            </button>
          </div>
        ) : !data?.jobs.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Briefcase className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-600 font-medium">No applications yet</p>
            <p className="text-gray-400 text-sm mt-1">Start applying to jobs and they'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.jobs.map((a) => {
              const hasUrl = !!a.applyUrl;
              return (
                <div
                  key={a.jobId}
                  className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 hover:border-gray-300 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">
                      {a.title || a.company || 'Job Application'}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">
                      {[a.company, a.location].filter(Boolean).join(' · ') || '—'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Applied {new Date(a.appliedAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </p>
                  </div>

                  {hasUrl ? (
                    <a
                      href={a.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      View Job <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="flex-shrink-0 text-xs text-gray-400 italic">Link unavailable</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
