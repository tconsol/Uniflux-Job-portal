import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, DollarSign, ExternalLink, Briefcase, Loader2 } from 'lucide-react';
import { useJob } from '../hooks/useJobs';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading, isError } = useJob(id!);

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
        <button onClick={() => navigate('/jobs')} className="text-brand-600 font-medium">
          Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm"
        >
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
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-xl font-semibold transition-colors text-sm"
            >
              Apply Now <ExternalLink className="w-4 h-4" />
            </a>
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

          {/* Apply footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Source: {job.source}</p>
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors text-sm"
            >
              Apply for this role <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
