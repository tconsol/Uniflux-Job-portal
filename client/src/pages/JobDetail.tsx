import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Clock, DollarSign, ExternalLink, Briefcase,
  Loader2, CheckCircle, Lock, AlertTriangle, X,
} from 'lucide-react';
import { useJob } from '../hooks/useJobs';
import { applyToJob } from '../api/apply.api';
import type { Job, JobsResponse } from '../types';

function useApplyState(jobId: string) {
  const queryClient = useQueryClient();
  const queries = queryClient.getQueriesData<JobsResponse>({ queryKey: ['jobs'] });
  let appliesUsed = 0;
  let applyLimit  = 10;
  let hasApplied  = false;

  for (const [, data] of queries) {
    if (!data) continue;
    if (data.applyLimit  !== undefined) applyLimit  = data.applyLimit;
    if (data.appliesUsed !== undefined) appliesUsed = data.appliesUsed;
    if (data.appliedJobIds?.includes(jobId)) hasApplied = true;
  }
  const limitReached = applyLimit !== -1 && appliesUsed >= applyLimit;
  return { appliesUsed, applyLimit, hasApplied, limitReached };
}

interface ConfirmModalProps {
  job: Job;
  applyLimit: number;
  appliesUsed: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmModal({ job, applyLimit, appliesUsed, onConfirm, onCancel, loading }: ConfirmModalProps) {
  const remaining = applyLimit === -1 ? null : applyLimit - appliesUsed;
  const isLow     = remaining !== null && remaining <= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Apply to this job?</h3>
            <p className="text-sm text-gray-500 mt-0.5">This will use 1 apply from your limit.</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <p className="font-semibold text-gray-900 line-clamp-1">{job.title}</p>
          <p className="text-sm text-gray-500 mt-0.5">{job.company}{job.location ? ` · ${job.location}` : ''}</p>
        </div>

        {applyLimit !== -1 && (
          <div className={`flex items-start gap-2 rounded-xl px-4 py-3 mb-5 ${isLow ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isLow ? 'text-red-500' : 'text-amber-500'}`} />
            <p className={`text-sm font-medium ${isLow ? 'text-red-800' : 'text-amber-800'}`}>
              {remaining === 0
                ? 'No applies left. Upgrade your plan to continue.'
                : isLow
                ? `Only ${remaining} apply${remaining === 1 ? '' : 's'} remaining after this.`
                : `${remaining} applies remaining (${appliesUsed}/${applyLimit} used). This uses 1.`}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><CheckCircle className="w-4 h-4" /> Yes, Apply</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const { data: job, isLoading, isError } = useJob(id!);

  const { appliesUsed, applyLimit, hasApplied: serverApplied, limitReached } = useApplyState(id!);
  const [sessionApplied, setSessionApplied] = useState(false);
  const hasApplied = serverApplied || sessionApplied;

  const [showConfirm, setShowConfirm] = useState(false);
  const [applying, setApplying]       = useState(false);

  async function handleConfirm() {
    if (!job) return;
    setApplying(true);
    try {
      const res = await applyToJob(job);
      if (res.limitReached) { navigate('/plans'); return; }

      setSessionApplied(true);

      // Update jobs cache
      queryClient.setQueriesData({ queryKey: ['jobs'] }, (old: any) => {
        if (!old) return old;
        const already = old.appliedJobIds ?? [];
        if (already.includes(job._id)) return old;
        return { ...old, appliedJobIds: [...already, job._id], appliesUsed: (old.appliesUsed ?? 0) + 1 };
      });

      // Update applied-jobs cache
      const newEntry = {
        jobId: job._id, title: job.title, company: job.company,
        location: job.location, applyUrl: job.applyUrl, appliedAt: new Date().toISOString(),
      };
      queryClient.setQueryData(['applied-jobs'], (old: any) => {
        if (!old) return { jobs: [newEntry], total: 1 };
        if (old.jobs?.some((j: any) => j.jobId === job._id)) return old;
        const jobs = [newEntry, ...(old.jobs ?? [])];
        return { ...old, jobs, total: jobs.length };
      });

      window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      if (err?.response?.status === 403) navigate('/plans');
    } finally {
      setApplying(false);
      setShowConfirm(false);
    }
  }

  function handleApplyClick() {
    if (hasApplied) { window.open(job!.applyUrl, '_blank', 'noopener,noreferrer'); return; }
    if (limitReached) { navigate('/plans'); return; }
    setShowConfirm(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <p className="text-gray-600 text-lg mb-4">Job not found</p>
        <button onClick={() => navigate(-1)} className="text-brand-600 font-medium">Back to Jobs</button>
      </div>
    );
  }

  const applyBtnClass = hasApplied
    ? 'flex-shrink-0 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-semibold transition-colors text-sm'
    : limitReached
    ? 'flex-shrink-0 flex items-center gap-2 bg-gray-200 hover:bg-orange-100 text-gray-500 hover:text-orange-700 px-5 py-3 rounded-xl font-semibold transition-colors text-sm border border-gray-300'
    : 'flex-shrink-0 flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-xl font-semibold transition-colors text-sm';

  return (
    <>
      {showConfirm && job && (
        <ConfirmModal
          job={job}
          applyLimit={applyLimit}
          appliesUsed={appliesUsed}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
          loading={applying}
        />
      )}

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to jobs
          </button>

          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-brand-600" />
                  </div>
                  <span className="text-gray-600 font-medium">{job.company}</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              </div>
              <button onClick={handleApplyClick} className={applyBtnClass}>
                {hasApplied ? (
                  <><CheckCircle className="w-4 h-4" /> Applied</>
                ) : limitReached ? (
                  <><Lock className="w-4 h-4" /> Upgrade</>
                ) : (
                  <>Apply Now <ExternalLink className="w-4 h-4" /></>
                )}
              </button>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-gray-100 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" /> {job.location}
              </span>
              {(job.salaryMin || job.salaryMax) && (
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  <DollarSign className="w-4 h-4" />
                  {job.salaryMin && job.salaryMax
                    ? `$${(job.salaryMin / 1000).toFixed(0)}k – $${(job.salaryMax / 1000).toFixed(0)}k`
                    : `$${((job.salaryMin || job.salaryMax)! / 1000).toFixed(0)}k`}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" />
                {new Date(job.postedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="capitalize px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {job.jobType}
              </span>
            </div>

            {/* Skills */}
            {job.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-brand-50 border border-brand-200 text-brand-700 text-sm rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Job Description</h3>
              <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                {job.description}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">Source: {job.source}</p>
              <button onClick={handleApplyClick} className={applyBtnClass}>
                {hasApplied ? (
                  <><CheckCircle className="w-4 h-4" /> Applied</>
                ) : limitReached ? (
                  <><Lock className="w-4 h-4" /> Upgrade Plan</>
                ) : (
                  <>Apply for this role <ExternalLink className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
