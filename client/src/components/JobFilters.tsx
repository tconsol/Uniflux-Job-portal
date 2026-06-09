import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { JobFilters } from '../types';

interface Props {
  filters: JobFilters;
  onChange: (f: JobFilters) => void;
}

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'freelance', 'internship'];

export default function JobFiltersBar({ filters, onChange }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  function set(key: keyof JobFilters, value: string | number | undefined) {
    onChange({ ...filters, [key]: value || undefined, page: 1 });
  }

  function clearAll() {
    onChange({ page: 1 });
  }

  const hasFilters = !!(filters.location || filters.jobType || filters.salaryMin || filters.company || filters.skills);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Company name..."
            value={filters.company ?? ''}
            onChange={(e) => set('company', e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
            showAdvanced ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasFilters && <span className="w-2 h-2 bg-brand-600 rounded-full" />}
        </button>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
          <input
            type="text"
            placeholder="Location..."
            value={filters.location ?? ''}
            onChange={(e) => set('location', e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <select
            value={filters.jobType ?? ''}
            onChange={(e) => set('jobType', e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">All types</option>
            {JOB_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min salary (USD)..."
            value={filters.salaryMin ?? ''}
            onChange={(e) => set('salaryMin', e.target.value ? parseInt(e.target.value) : undefined)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <input
            type="text"
            placeholder="Skills (comma-separated)..."
            value={filters.skills ?? ''}
            onChange={(e) => set('skills', e.target.value)}
            className="sm:col-span-3 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      )}
    </div>
  );
}
