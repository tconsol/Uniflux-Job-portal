import { Link } from 'react-router-dom';
import { User, CreditCard, Calendar, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useBilling';

const PLAN_COLORS: Record<string, string> = {
  basic:    'bg-gray-100 text-gray-700 border-gray-200',
  standard: 'bg-blue-50 text-blue-700 border-blue-200',
  premium:  'bg-purple-50 text-purple-700 border-purple-200',
  elite:    'bg-amber-50 text-amber-700 border-amber-200',
};

export default function Profile() {
  const { user } = useAuth();
  const { data: subData, refetch } = useSubscription();
  const subscription = subData?.subscription;
  const plan = subData?.plan;
  const planSlug = subscription?.planSlug ?? 'basic';
  const planStyle = PLAN_COLORS[planSlug] ?? PLAN_COLORS.basic;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Profile</h1>

        <div className="space-y-5">
          {/* User info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{user?.name}</h2>
                <p className="text-gray-500 text-sm">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span>Member since {user && new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Subscription */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" /> Subscription
            </h3>

            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1.5 border rounded-lg text-sm font-semibold capitalize ${planStyle}`}>
                {plan?.name ?? planSlug}
              </span>
              {subscription?.status && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  subscription.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {subscription.status}
                </span>
              )}
            </div>

            {plan && (
              <div className="space-y-2 text-sm text-gray-600 mb-5">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span>{plan.jobLimit === -1 ? 'Unlimited jobs/day' : `${plan.jobLimit.toLocaleString()} jobs/day`}</span>
                </div>
                {subscription?.planExpiresAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Expires {new Date(subscription.planExpiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Link
                to="/plans"
                className="flex-1 text-center bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {subscription?.status === 'active' ? 'Upgrade Plan' : 'View Plans'}
              </Link>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
