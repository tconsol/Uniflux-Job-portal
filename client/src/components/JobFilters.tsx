import { Search, X, Clock } from 'lucide-react';
import CustomSelect from './CustomSelect';
import type { JobFilters } from '../types';

interface SelectOption { value: string; label: string; }

interface Props {
  filters: JobFilters;
  onChange: (f: JobFilters) => void;
  jobTypeOptions?: SelectOption[];
}

const DEFAULT_JOB_TYPE_OPTIONS: SelectOption[] = [{ value: '', label: 'All job types' }];

export default function JobFiltersBar({
  filters,
  onChange,
  jobTypeOptions = DEFAULT_JOB_TYPE_OPTIONS,
}: Props) {
  function set(key: keyof JobFilters, value: string | undefined) {
    onChange({ ...filters, [key]: value || undefined });
  }

  function clearAll() {
    onChange({});
  }

  const hasFilters = !!(filters.keyword || filters.location || filters.jobType);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
      {/* keyword + location */}
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

      {/* job type + salary coming soon */}
      <div className="grid grid-cols-2 gap-2">
        <CustomSelect
          value={filters.jobType ?? ''}
          onChange={(v) => set('jobType', v)}
          options={jobTypeOptions}
          placeholder="All job types"
        />

        <div className="relative group">
          <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-400 bg-gray-50 cursor-not-allowed select-none">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>Salary filter</span>
            <span className="ml-auto text-xs bg-amber-100 text-amber-600 font-medium px-1.5 py-0.5 rounded-full">Soon</span>
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Salary filter coming soon
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      </div>
    </div>
  );
}
