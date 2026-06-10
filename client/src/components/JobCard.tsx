import { useState } from 'react';
import { MapPin, Clock, DollarSign, ExternalLink, Building2, CheckCircle, Lock, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { applyToJob } from '../api/apply.api';
import type { Job } from '../types';

const JOB_TYPE_STYLES: Record<string, string> = {
  'full-time':  'bg-green-100 text-green-700',
  'part-time':  'bg-blue-100 text-blue-700',
  'contract':   'bg-orange-100 text-orange-700',
  'freelance':  'bg-purple-100 text-purple-700',
  'internship': 'bg-pink-100 text-pink-700',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 30)  return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatSalary(min?: number, max?: number, currency = 'USD') {
  if (!min && !max) return null;
  const fmt = (n: number) => `${currency === 'USD' ? '$' : currency}${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
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
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Apply to this job?</h3>
            <p className="text-sm text-gray-500 mt-0.5">This will use 1 apply from your limit.</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Job info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <p className="font-semibold text-gray-900 line-clamp-1">{job.title}</p>
          <p className="text-sm text-gray-500 mt-0.5">{job.company}{job.location ? ` · ${job.location}` : ''}</p>
        </div>

        {/* Apply limit warning */}
        {applyLimit !== -1 && (
          <div className={`flex items-start gap-2 rounded-xl px-4 py-3 mb-5 ${isLow ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isLow ? 'text-red-500' : 'text-amber-500'}`} />
            <p className={`text-sm font-medium ${isLow ? 'text-red-800' : 'text-amber-800'}`}>
              {remaining === 0
                ? 'You have no applies left. Upgrade your plan to continue.'
                : isLow
                ? `Only ${remaining} apply${remaining === 1 ? '' : 's'} remaining after this. Consider upgrading.`
                : `You have ${remaining} applies remaining (${appliesUsed}/${applyLimit} used). This will use 1.`}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><CheckCircle className="w-4 h-4" /> Yes, Apply</>}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  job: Job;
  isLocked: boolean;
  hasApplied: boolean;
  applyLimit: number;
  appliesUsed: number;
  onApplied: (job: Job) => void;
  onClick?: () => void;
}

export default function JobCard({ job, isLocked, hasApplied, applyLimit, appliesUsed, onApplied, onClick }: Props) {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const salary    = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const typeStyle = JOB_TYPE_STYLES[job.jobType] ?? 'bg-gray-100 text-gray-700';

  function handleApplyClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (isLocked) { navigate('/plans'); return; }
    if (hasApplied) { window.open(job.applyUrl, '_blank', 'noopener,noreferrer'); return; }
    setShowConfirm(true);
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await applyToJob(job);
      if (res.limitReached) { navigate('/plans'); return; }
      onApplied(job);
      window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      if (err?.response?.status === 403) navigate('/plans');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  const btnClass = hasApplied
    ? 'flex-shrink-0 flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors'
    : isLocked
    ? 'flex-shrink-0 flex items-center gap-1.5 bg-gray-200 hover:bg-orange-100 text-gray-500 hover:text-orange-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors border border-gray-300 hover:border-orange-300'
    : 'flex-shrink-0 flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors';

  return (
    <>
      {showConfirm && (
        <ConfirmModal
          job={job}
          applyLimit={applyLimit}
          appliesUsed={appliesUsed}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
          loading={loading}
        />
      )}

      <div
        onClick={onClick}
        className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-brand-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-brand-50 border border-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-brand-600" />
              </div>
              <span className="text-sm text-gray-500 truncate">{job.company}</span>
            </div>

            <h3 className="font-semibold text-gray-900 text-base mb-3 group-hover:text-brand-700 transition-colors line-clamp-2">
              {job.title}
            </h3>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />{job.location}
                </span>
              )}
              {salary && (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <DollarSign className="w-3.5 h-3.5" />{salary}
                </span>
              )}
              {job.postedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />{timeAgo(job.postedAt)}
                </span>
              )}
            </div>
          </div>

          <button onClick={handleApplyClick} className={btnClass}>
            {hasApplied ? (
              <><CheckCircle className="w-3.5 h-3.5" /> Applied</>
            ) : isLocked ? (
              <><Lock className="w-3.5 h-3.5" /> Upgrade</>
            ) : (
              <>Apply <ExternalLink className="w-3.5 h-3.5" /></>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${typeStyle}`}>
            {job.jobType}
          </span>
          {job.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              {skill}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="text-xs text-gray-400">+{job.skills.length - 3}</span>
          )}
        </div>
      </div>
    </>
  );
}
