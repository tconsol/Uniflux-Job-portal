const VARIANTS: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  past_due: 'bg-yellow-100 text-yellow-700',
  canceled: 'bg-red-100 text-red-600',
  expired:  'bg-red-100 text-red-600',
  basic:    'bg-gray-100 text-gray-700',
  standard: 'bg-blue-100 text-blue-700',
  premium:  'bg-purple-100 text-purple-700',
  elite:    'bg-amber-100 text-amber-700',
};

export default function Badge({ label, variant }: { label?: string; variant?: string }) {
  if (!label) return <span className="text-gray-400 text-xs">—</span>;
  const cls = VARIANTS[variant ?? label.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>
      {label}
    </span>
  );
}
