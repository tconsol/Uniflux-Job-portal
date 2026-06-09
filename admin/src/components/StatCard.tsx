import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color?: string;
}

export default function StatCard({ title, value, sub, icon: Icon, color = 'text-brand-600' }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 font-medium">{title}</span>
        <div className={`w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
