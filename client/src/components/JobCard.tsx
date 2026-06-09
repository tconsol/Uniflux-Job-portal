import { MapPin, Clock, DollarSign, ExternalLink, Building2 } from 'lucide-react';
import type { Job } from '../types';

const JOB_TYPE_STYLES: Record<string, string> = {
  'full-time':   'bg-green-100 text-green-700',
  'part-time':   'bg-blue-100 text-blue-700',
  'contract':    'bg-orange-100 text-orange-700',
  'freelance':   'bg-purple-100 text-purple-700',
  'internship':  'bg-pink-100 text-pink-700',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatSalary(min?: number, max?: number, currency = 'USD') {
  if (!min && !max) return null;
  const fmt = (n: number) => `${currency === 'USD' ? '$' : currency}${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

interface Props {
  job: Job;
  onClick?: () => void;
}

export default function JobCard({ job, onClick }: Props) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const typeStyle = JOB_TYPE_STYLES[job.jobType] ?? 'bg-gray-100 text-gray-700';

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-brand-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Company */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-brand-50 border border-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-brand-600" />
            </div>
            <span className="text-sm text-gray-500 truncate">{job.company}</span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 text-base mb-3 group-hover:text-brand-700 transition-colors line-clamp-2">
            {job.title}
          </h3>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {job.location}
            </span>
            {salary && (
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <DollarSign className="w-3.5 h-3.5" />
                {salary}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo(job.postedAt)}
            </span>
          </div>
        </div>

        {/* Apply */}
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          Apply
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Footer */}
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
  );
}
