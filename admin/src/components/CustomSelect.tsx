import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export default function CustomSelect({ value, onChange, options, placeholder = 'Select...', className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
      >
        <span className={selected ? 'text-gray-800 capitalize' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full min-w-max bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center justify-between gap-4 px-3 py-2.5 text-sm text-left capitalize transition-colors ${
                opt.value === value
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt.label}
              {opt.value === value && <Check className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
