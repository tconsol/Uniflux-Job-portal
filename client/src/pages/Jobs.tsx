import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle, RefreshCw, Zap, AlertTriangle, Info, X } from 'lucide-react';
import JobCard from '../components/JobCard';
import JobFiltersBar from '../components/JobFilters';
import { useJobs, useJobCount } from '../hooks/useJobs';
import { useSSE } from '../hooks/useSSE';
import type { Job, JobFilters } from '../types';

const DISPLAY_SIZE = 1000;
const MILESTONES   = [50, 60, 70, 80, 90, 100];

// ─── helpers ───────────────────────────────────────────────────────────────

function normalizeJobType(raw: string | null | undefined): string {
  if (!raw) return 'full-time';
  const r = raw.toLowerCase().replace(/[-_\s]/g, '');
  if (r.includes('part'))      return 'part-time';
  if (r.includes('contract'))  return 'contract';
  if (r.includes('freelance')) return 'freelance';
  if (r.includes('intern'))    return 'internship';
  if (r.includes('temp'))      return 'contract';
  if (r.includes('casual'))    return 'part-time';
  return 'full-time';
}

const JOB_TYPE_LABELS: Record<string, string> = {
  'full-time':  'Full-Time',
  'part-time':  'Part-Time',
  'contract':   'Contract',
  'freelance':  'Freelance',
  'internship': 'Internship',
};

interface Toast { id: number; pct: number; msg: string; level: 'info' | 'warn' | 'error'; }

const TOAST_STYLES = {
  info:  'bg-blue-50 border-blue-200 text-blue-800',
  warn:  'bg-amber-50 border-amber-200 text-amber-800',
  error: 'bg-red-50 border-red-200 text-red-800',
};

function toastLevel(pct: number): Toast['level'] {
  if (pct >= 90) return 'error';
  if (pct >= 70) return 'warn';
  return 'info';
}

// URL ↔ filter state (persists filters on refresh / share)
function readFilters(params: URLSearchParams): JobFilters {
  const f: JobFilters = { page: 1 };
  if (params.get('page'))    f.page    = Number(params.get('page'));
  if (params.get('keyword')) f.keyword = params.get('keyword')!;
  if (params.get('location'))f.location= params.get('location')!;
  if (params.get('jobType')) f.jobType = params.get('jobType')!;
  return f;
}

function writeFilters(f: JobFilters): Record<string, string> {
  const p: Record<string, string> = {};
  if (f.page && f.page > 1) p.page     = String(f.page);
  if (f.keyword)             p.keyword  = f.keyword;
  if (f.location)            p.location = f.location;
  if (f.jobType)             p.jobType  = f.jobType;
  return p;
}

// ─── pagination UI ─────────────────────────────────────────────────────────

function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) {
  const win = 5;
  let start = Math.max(1, current - Math.floor(win / 2));
  let end   = Math.min(total, start + win - 1);
  if (end - start + 1 < win) start = Math.max(1, end - win + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const btn = 'w-10 h-10 rounded-full text-sm font-semibold transition-colors flex items-center justify-center';

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => onChange(current - 1)} disabled={current === 1}
        className="px-4 h-10 rounded-full text-sm font-semibold text-white/70 hover:bg-white/20 disabled:opacity-30 transition-colors">
        ← Prev
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onChange(1)} className={`${btn} text-white/80 hover:bg-white/20`}>1</button>
          {start > 2 && <span className="text-white/50 text-sm px-1">…</span>}
        </>
      )}
      {pages.map((p) => (
        <button key={p} onClick={() => onChange(p)}
          className={`${btn} ${p === current ? 'bg-white text-brand-600 shadow' : 'text-white hover:bg-white/20'}`}>
          {p}
        </button>
      ))}
      {end < total && (
        <>
          {end < total - 1 && <span className="text-white/50 text-sm px-1">…</span>}
          <button onClick={() => onChange(total)} className={`${btn} text-white/80 hover:bg-white/20`}>{total}</button>
        </>
      )}
      <button onClick={() => onChange(current + 1)} disabled={current === total}
        className="px-4 h-10 rounded-full text-sm font-semibold text-white/70 hover:bg-white/20 disabled:opacity-30 transition-colors">
        Next →
      </button>
    </div>
  );
}

// ─── page ──────────────────────────────────────────────────────────────────

export default function Jobs() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);

  // One backend call — get all jobs, cache for 5 min. No filter params sent.
  const { data, isLoading, isError, refetch } = useJobs();
  const { data: totalJobCount } = useJobCount();

  useSSE({
    onJobUpdate: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    }, [queryClient]),
    enabled: true,
  });

  // ── applied tracking ──────────────────────────────────────────────────
  const [serverApplied,  setServerApplied]  = useState<Set<string>>(new Set());
  const [sessionApplied, setSessionApplied] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (data?.appliedJobIds) setServerApplied(new Set(data.appliedJobIds));
  }, [data?.appliedJobIds]);

  function handleApplied(job: Job) {
    const jobId = job._id;
    setSessionApplied((prev) => new Set([...prev, jobId]));
    queryClient.setQueriesData({ queryKey: ['jobs'] }, (old: any) => {
      if (!old) return old;
      const already = old.appliedJobIds ?? [];
      if (already.includes(jobId)) return old;
      return { ...old, appliedJobIds: [...already, jobId], appliesUsed: (old.appliesUsed ?? 0) + 1 };
    });
    const newEntry = {
      jobId, title: job.title, company: job.company,
      location: job.location, applyUrl: job.applyUrl,
      appliedAt: new Date().toISOString(),
    };
    queryClient.setQueryData(['applied-jobs'], (old: any) => {
      if (!old) return { jobs: [newEntry], total: 1 };
      if (old.jobs?.some((j: any) => j.jobId === jobId)) return old;
      const jobs = [newEntry, ...(old.jobs ?? [])];
      return { ...old, jobs, total: jobs.length };
    });
  }

  const appliedSet     = new Set([...serverApplied, ...sessionApplied]);
  const applyLimit     = data?.applyLimit ?? 10;
  const newThisSession = [...sessionApplied].filter((id) => !serverApplied.has(id)).length;
  const appliesUsed    = (data?.appliesUsed ?? 0) + newThisSession;
  const limitReached   = applyLimit !== -1 && appliesUsed >= applyLimit;
  const pctUsed        = applyLimit === -1 ? 0 : Math.min(100, Math.round((appliesUsed / applyLimit) * 100));

  // ── toasts ────────────────────────────────────────────────────────────
  const notifiedRef = useRef<Set<number>>(new Set());
  const toastIdRef  = useRef(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (applyLimit === -1 || appliesUsed === 0) return;
    const hit = [...MILESTONES].reverse().find((m) => pctUsed >= m && !notifiedRef.current.has(m));
    if (hit) {
      MILESTONES.forEach((m) => { if (m <= hit) notifiedRef.current.add(m); });
      const id  = ++toastIdRef.current;
      const msg = hit >= 100
        ? `Apply limit reached (${appliesUsed}/${applyLimit}). Upgrade to continue.`
        : `You've used ${hit}% of your apply limit (${appliesUsed}/${applyLimit} applies).`;
      setToasts((prev) => [...prev, { id, pct: hit, msg, level: toastLevel(hit) }]);
      if (hit < 70) setTimeout(() => dismiss(id), 6000);
    }
  }, [pctUsed, appliesUsed, applyLimit]);

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // ── normalise all jobs once ───────────────────────────────────────────
  const allJobs = useMemo(
    () => (data?.jobs ?? []).map((j) => ({
      ...j,
      jobType: normalizeJobType(j.jobType) as Job['jobType'],
    })),
    [data?.jobs],
  );

  // ── dynamic job-type options from actual data ─────────────────────────
  const jobTypeOptions = useMemo(() => [
    { value: '', label: 'All job types' },
    ...Array.from(new Set(allJobs.map((j) => j.jobType))).sort()
      .map((t) => ({ value: t, label: JOB_TYPE_LABELS[t] ?? t })),
  ], [allJobs]);

  // ── client-side filtering (keyword, location, jobType) ────────────────
  const { keyword = '', location = '', jobType = '', page = 1 } = filters;
  const kw  = keyword.toLowerCase().trim();
  const loc = location.toLowerCase().trim();

  const filteredJobs = useMemo(() => allJobs.filter((j) => {
    if (jobType && j.jobType !== jobType) return false;
    if (kw  && !`${j.title} ${j.company} ${j.description}`.toLowerCase().includes(kw))  return false;
    if (loc && !j.location.toLowerCase().includes(loc)) return false;
    return true;
  }), [allJobs, jobType, kw, loc]);

  // ── client-side pagination ────────────────────────────────────────────
  const totalPages    = Math.ceil(filteredJobs.length / DISPLAY_SIZE) || 1;
  const safePage      = Math.min(Math.max(1, page), totalPages);
  const displayedJobs = filteredJobs.slice((safePage - 1) * DISPLAY_SIZE, safePage * DISPLAY_SIZE);

  // Reset URL page when it's out of range (e.g. stale URL from old DISPLAY_SIZE)
  useEffect(() => {
    if (page !== safePage) {
      setSearchParams(writeFilters({ ...filters, page: safePage }), { replace: true });
    }
  }, [safePage, page]);

  function handleFilterChange(f: JobFilters) {
    setSearchParams(writeFilters({ ...f, page: 1 }));
  }

  function handlePageChange(p: number) {
    setSearchParams(writeFilters({ ...filters, page: p }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Floating toasts */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
          {toasts.map((t) => (
            <div key={t.id} className={`flex items-start gap-3 border rounded-xl px-4 py-3 shadow-lg ${TOAST_STYLES[t.level]}`}>
              <span className="flex-shrink-0 mt-0.5">
                {t.level === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
              </span>
              <p className="text-sm flex-1 font-medium">{t.msg}</p>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {t.pct >= 90 && (
                  <button onClick={() => navigate('/plans')} className="text-xs underline font-semibold whitespace-nowrap">
                    Upgrade
                  </button>
                )}
                <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
            {totalJobCount ? (
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-semibold text-brand-600">{totalJobCount.toLocaleString()}</span> total jobs in marketplace
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-4">
            {applyLimit !== -1 ? (
              <div className="hidden sm:block">
                <div className="flex items-center justify-between text-xs mb-1 gap-4">
                  <span className={`font-medium ${pctUsed >= 90 ? 'text-red-600' : pctUsed >= 50 ? 'text-amber-600' : 'text-gray-500'}`}>
                    {appliesUsed} / {applyLimit} applies
                  </span>
                  <span className={`font-semibold ${pctUsed >= 90 ? 'text-red-600' : pctUsed >= 50 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {pctUsed}%
                  </span>
                </div>
                <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pctUsed >= 90 ? 'bg-red-500' : pctUsed >= 70 ? 'bg-amber-500' : pctUsed >= 50 ? 'bg-yellow-400' : 'bg-brand-500'
                    }`}
                    style={{ width: `${pctUsed}%` }}
                  />
                </div>
              </div>
            ) : (
              <span className="hidden sm:flex items-center gap-1 text-sm text-green-600 font-medium">
                <Zap className="w-3.5 h-3.5" /> Unlimited applies
              </span>
            )}
            <button onClick={() => refetch()}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <JobFiltersBar filters={filters} onChange={handleFilterChange} jobTypeOptions={jobTypeOptions} />
        </div>

        {/* Apply limit banner */}
        {limitReached && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-800">
                Apply limit reached — <strong>{appliesUsed}/{applyLimit}</strong> used.
              </p>
            </div>
            <button onClick={() => navigate('/plans')}
              className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Upgrade
            </button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-gray-600 font-medium">Failed to load jobs</p>
            <button onClick={() => refetch()} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium mt-4">
              Retry
            </button>
          </div>
        ) : !filteredJobs.length ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No jobs match your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedJobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  hasApplied={appliedSet.has(job._id)}
                  isLocked={limitReached && !appliedSet.has(job._id)}
                  applyLimit={applyLimit}
                  appliesUsed={appliesUsed}
                  onApplied={handleApplied}
                  onClick={() => navigate(`/jobs/${job._id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Floating pill pagination */}
      {totalPages > 1 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="bg-brand-600 backdrop-blur-md shadow-2xl rounded-full px-6 py-3">
            <Pagination current={safePage} total={totalPages} onChange={handlePageChange} />
          </div>
        </div>
      )}
    </div>
  );
}
