import { Check, Zap, Lock } from 'lucide-react';
import type { Plan } from '../types';

const PLAN_STYLES: Record<string, { border: string; badge: string; btn: string; icon: string }> = {
  free:     { border: 'border-gray-200',  badge: 'bg-gray-100 text-gray-600',    btn: 'bg-gray-800 hover:bg-gray-900 text-white',                 icon: 'text-gray-500' },
  standard: { border: 'border-blue-200',  badge: 'bg-blue-100 text-blue-700',    btn: 'bg-brand-600 hover:bg-brand-700 text-white',              icon: 'text-brand-500' },
  premium:  { border: 'border-purple-300 ring-2 ring-purple-300', badge: 'bg-purple-100 text-purple-700', btn: 'bg-purple-600 hover:bg-purple-700 text-white', icon: 'text-purple-500' },
  elite:    { border: 'border-amber-300', badge: 'bg-amber-100 text-amber-700',  btn: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white', icon: 'text-amber-500' },
};

const DEFAULT_FEATURES: Record<string, string[]> = {
  free:     ['10 applies per period', 'Basic filters', 'Apply redirects', 'Email support'],
  standard: ['100 applies per period', 'All filters', 'Apply redirects', 'Priority support'],
  premium:  ['1,000 applies per period', 'All filters + skills', 'Real-time updates', 'Priority support'],
  elite:    ['Unlimited applies', 'All filters', 'Real-time SSE updates', 'Dedicated support'],
};

interface Props {
  plan: Plan;
  isCurrent?: boolean;
  isDowngrade?: boolean;
  onSelect: (plan: Plan) => void;
  loading?: boolean;
}

export default function PlanCard({ plan, isCurrent, isDowngrade, onSelect, loading }: Props) {
  const style    = PLAN_STYLES[plan.slug] ?? PLAN_STYLES.free;
  const features = plan.features?.length ? plan.features : DEFAULT_FEATURES[plan.slug] ?? [];
  const isPremium = plan.slug === 'premium';
  const isFree    = plan.slug === 'free';

  function renderButton() {
    if (isCurrent) {
      return (
        <div className="text-center py-2.5 border-2 border-green-500 bg-green-50 rounded-xl text-sm font-semibold text-green-700">
          ✓ Current Plan
        </div>
      );
    }
    if (isDowngrade) {
      return (
        <div className="flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-400 cursor-not-allowed bg-gray-50">
          <Lock className="w-3.5 h-3.5" /> Downgrade locked
        </div>
      );
    }
    if (isFree) {
      return (
        <div className="text-center py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 bg-gray-50">
          Default Plan
        </div>
      );
    }
    return (
      <button
        onClick={() => onSelect(plan)}
        disabled={loading}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${style.btn} disabled:opacity-60`}
      >
        {loading ? 'Loading...' : `Get ${plan.name}`}
      </button>
    );
  }

  return (
    <div className={`relative bg-white border ${style.border} rounded-2xl p-6 flex flex-col transition-shadow hover:shadow-lg`}>
      {isPremium && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Zap className="w-3 h-3" /> Most Popular
          </span>
        </div>
      )}

      <div className="mb-5">
        <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${style.badge}`}>
          {plan.name}
        </span>
        <div className="mt-3 flex items-end gap-1">
          {isFree ? (
            <span className="text-4xl font-bold text-gray-900">Free</span>
          ) : (
            <>
              <span className="text-4xl font-bold text-gray-900">${plan.priceMonthly}</span>
              <span className="text-gray-500 mb-1">/mo</span>
            </>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {plan.applyLimit === -1 ? 'Unlimited applies' : `${(plan.applyLimit ?? 10).toLocaleString()} applies/period`}
        </p>
      </div>

      <ul className="space-y-2.5 mb-6 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${style.icon}`} />
            {f}
          </li>
        ))}
      </ul>

      {renderButton()}
    </div>
  );
}
