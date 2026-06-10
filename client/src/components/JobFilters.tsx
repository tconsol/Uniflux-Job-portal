import { Search, X } from 'lucide-react';
import CustomSelect from './CustomSelect';
import type { JobFilters } from '../types';

interface Props {
  filters: JobFilters;
  onChange: (f: JobFilters) => void;
}

const JOB_TYPE_OPTIONS = [
  { value: '', label: 'All job types' },
  { value: 'full-time',  label: 'Full Time' },
  { value: 'part-time',  label: 'Part Time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'freelance',  label: 'Freelance' },
  { value: 'internship', label: 'Internship' },
];

const SOURCE_OPTIONS = [
  { value: '',             label: 'All sources' },
  { value: 'indeed',       label: 'Indeed' },
  { value: 'linkedin',     label: 'LinkedIn' },
  { value: 'glassdoor',    label: 'Glassdoor' },
  { value: 'google',       label: 'Google' },
  { value: 'zip_recruiter',label: 'ZipRecruiter' },
  { value: 'jsearch',      label: 'JSearch' },
];

export default function JobFiltersBar({ filters, onChange }: Props) {
  function set(key: keyof JobFilters, value: string | number | undefined) {
    onChange({ ...filters, [key]: value || undefined });
  }

  function clearAll() {
    onChange({});
  }

  const hasFilters = !!(
    filters.keyword || filters.location || filters.jobType ||
    filters.salaryMin || filters.salaryMax || filters.source
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
      {/* Row 1: keyword + location */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Job title, keyword..."
            value={filters.keyword ?? ''}
            onChange={(e) => set('keyword', e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Location..."
            value={filters.location ?? ''}
            onChange={(e) => set('location', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 border border-red-200 rounded-xl transition-colors whitespace-nowrap"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Row 2: job type, source, salary min, salary max */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <CustomSelect
          value={filters.jobType ?? ''}
          onChange={(v) => set('jobType', v)}
          options={JOB_TYPE_OPTIONS}
          placeholder="All job types"
        />

        <CustomSelect
          value={filters.source ?? ''}
          onChange={(v) => set('source', v)}
          options={SOURCE_OPTIONS}
          placeholder="All sources"
        />

        <input
          type="number"
          placeholder="Min salary ($)"
          value={filters.salaryMin ?? ''}
          onChange={(e) => set('salaryMin', e.target.value ? parseInt(e.target.value) : undefined)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        <input
          type="number"
          placeholder="Max salary ($)"
          value={filters.salaryMax ?? ''}
          onChange={(e) => set('salaryMax', e.target.value ? parseInt(e.target.value) : undefined)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
    </div>
  );
}
