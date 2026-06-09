import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, CreditCard, Calendar, Loader2, Save } from 'lucide-react';
import { getUserDetail, updateUserSubscription } from '../api/admin.api';
import Badge from '../components/Badge';

const PLAN_OPTIONS = ['basic', 'standard', 'premium', 'elite'];
const STATUS_OPTIONS = ['active', 'expired', 'inactive'];

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => getUserDetail(id!),
  });

  const [planSlug, setPlanSlug] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  function initEdit() {
    if (!planSlug && data?.subscription) {
      setPlanSlug(data.subscription.planSlug);
      setStatus(data.subscription.status);
    }
  }

  async function handleSave() {
    if (!planSlug || !status) return;
    setSaving(true);
    setSaveMsg('');
    try {
      await updateUserSubscription(id!, planSlug, status);
      setSaveMsg('Saved');
      qc.invalidateQueries({ queryKey: ['admin-user', id] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['revenue'] });
    } catch {
      setSaveMsg('Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <p className="text-red-500">Failed to load user.</p>
        <button onClick={() => navigate('/users')} className="text-brand-600 text-sm mt-2">Back</button>
      </div>
    );
  }

  const { user, subscription, plan } = data;

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {/* Back */}
      <Link to="/users" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </Link>

      <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>

      {/* User info */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" /> Account Details
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Name</span>
            <p className="text-gray-900 font-medium mt-0.5">{user.name}</p>
          </div>
          <div>
            <span className="text-gray-400">Email</span>
            <p className="text-gray-900 font-medium mt-0.5">{user.email}</p>
          </div>
          <div>
            <span className="text-gray-400">Status</span>
            <div className="mt-0.5"><Badge label={user.isActive ? 'active' : 'inactive'} /></div>
          </div>
          <div>
            <span className="text-gray-400">Role</span>
            <div className="mt-0.5"><Badge label={user.isAdmin ? 'Admin' : 'User'} variant={user.isAdmin ? 'active' : 'inactive'} /></div>
          </div>
          <div>
            <span className="text-gray-400">Joined</span>
            <p className="text-gray-900 font-medium mt-0.5">
              {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          {user.razorpayCustomerId && (
            <div>
              <span className="text-gray-400">Razorpay Customer</span>
              <p className="text-gray-500 font-mono text-xs mt-0.5">{user.razorpayCustomerId}</p>
            </div>
          )}
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-gray-400" /> Subscription
        </h2>

        {subscription ? (
          <div className="grid grid-cols-2 gap-4 text-sm mb-5">
            <div>
              <span className="text-gray-400">Plan</span>
              <div className="mt-0.5"><Badge label={subscription.planSlug} /></div>
            </div>
            <div>
              <span className="text-gray-400">Status</span>
              <div className="mt-0.5"><Badge label={subscription.status} /></div>
            </div>
            {subscription.planActivatedAt && (
              <div>
                <span className="text-gray-400">Activated</span>
                <p className="text-gray-900 font-medium mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  {new Date(subscription.planActivatedAt).toLocaleDateString()}
                </p>
              </div>
            )}
            {subscription.planExpiresAt && (
              <div>
                <span className="text-gray-400">Expires</span>
                <p className="text-gray-900 font-medium mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  {new Date(subscription.planExpiresAt).toLocaleString()}
                </p>
              </div>
            )}
            {subscription.razorpayPaymentId && (
              <div className="col-span-2">
                <span className="text-gray-400">Razorpay Payment ID</span>
                <p className="text-gray-500 font-mono text-xs mt-0.5">{subscription.razorpayPaymentId}</p>
              </div>
            )}
            {plan && (
              <div>
                <span className="text-gray-400">Job Limit</span>
                <p className="text-gray-900 font-medium mt-0.5">
                  {plan.jobLimit === -1 ? 'Unlimited' : plan.jobLimit.toLocaleString()} / day
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-sm mb-5">No active subscription</p>
        )}

        {/* Manual override */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Manual Override</p>
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Plan</label>
              <select
                value={planSlug || subscription?.planSlug || 'basic'}
                onChange={(e) => setPlanSlug(e.target.value)}
                onFocus={initEdit}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                value={status || subscription?.status || 'inactive'}
                onChange={(e) => setStatus(e.target.value)}
                onFocus={initEdit}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            {saveMsg && (
              <span className={`text-xs font-medium ${saveMsg === 'Saved' ? 'text-green-600' : 'text-red-500'}`}>
                {saveMsg}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
