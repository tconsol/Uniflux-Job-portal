import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, Loader2, Check } from 'lucide-react';
import { listPlans, createPlan, updatePlan, deletePlan } from '../api/admin.api';
import type { Plan } from '../types';

const EMPTY_PLAN: Partial<Plan> = {
  slug: 'basic',
  name: '',
  jobLimit: 10,
  applyLimit: 10,
  priceMonthly: 0,
  priceYearly: 0,
  razorpayPlanIdMonthly: '',
  razorpayPlanIdYearly: '',
  isActive: true,
  features: [],
};

function PlanModal({
  plan,
  onClose,
  onSave,
}: {
  plan: Partial<Plan> | null;
  onClose: () => void;
  onSave: (p: Partial<Plan>) => Promise<void>;
}) {
  const [form, setForm] = useState<Partial<Plan>>(plan ?? EMPTY_PLAN);
  const [featuresStr, setFeaturesStr] = useState((plan?.features ?? []).join('\n'));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  function set<K extends keyof Plan>(key: K, val: Plan[K]) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    if (!form.name) { setErr('Name required'); return; }
    setSaving(true);
    setErr('');
    try {
      const features = featuresStr.split('\n').map((s) => s.trim()).filter(Boolean);
      await onSave({ ...form, features });
      onClose();
    } catch (e: unknown) {
      setErr((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{plan?._id ? 'Edit Plan' : 'Create Plan'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {err && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{err}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Slug</label>
              <select
                value={form.slug}
                onChange={(e) => set('slug', e.target.value as Plan['slug'])}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {['basic', 'standard', 'premium', 'elite'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Display Name *</label>
              <input
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. Standard"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Job Limit (-1=∞)</label>
              <input
                type="number"
                value={form.jobLimit ?? 10}
                onChange={(e) => set('jobLimit', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Apply Limit (-1=∞)</label>
              <input
                type="number"
                value={form.applyLimit ?? 10}
                onChange={(e) => set('applyLimit', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Monthly (₹)</label>
              <input
                type="number"
                value={form.priceMonthly ?? 0}
                onChange={(e) => set('priceMonthly', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Yearly (₹)</label>
              <input
                type="number"
                value={form.priceYearly ?? 0}
                onChange={(e) => set('priceYearly', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Razorpay Plan ID (Monthly)</label>
            <input
              value={form.razorpayPlanIdMonthly ?? ''}
              onChange={(e) => set('razorpayPlanIdMonthly', e.target.value)}
              placeholder="plan_xxx"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Razorpay Plan ID (Yearly)</label>
            <input
              value={form.razorpayPlanIdYearly ?? ''}
              onChange={(e) => set('razorpayPlanIdYearly', e.target.value)}
              placeholder="plan_xxx"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Features (one per line)</label>
            <textarea
              value={featuresStr}
              onChange={(e) => setFeaturesStr(e.target.value)}
              rows={4}
              placeholder="Up to 10 jobs per day&#10;Email alerts&#10;Basic filters"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive ?? true}
              onChange={(e) => set('isActive', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active (visible to users)</label>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {plan?._id ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Plans() {
  const qc = useQueryClient();
  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: listPlans,
    staleTime: 1000 * 60,
  });

  const [modal, setModal] = useState<Partial<Plan> | null | false>(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleSave(form: Partial<Plan>) {
    if (form._id) {
      await updatePlan(form._id, form);
    } else {
      await createPlan(form);
    }
    qc.invalidateQueries({ queryKey: ['admin-plans'] });
    qc.invalidateQueries({ queryKey: ['revenue'] });
  }

  async function handleDelete(planId: string) {
    if (!confirm('Delete this plan? Existing subscribers keep their access until period end.')) return;
    setDeleting(planId);
    try {
      await deletePlan(planId);
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
    } catch {
      alert('Delete failed');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Plans</h1>
        <button
          onClick={() => setModal(EMPTY_PLAN)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-red-500">Failed to load plans</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans?.map((plan) => (
            <div key={plan._id} className="bg-white border border-gray-200 rounded-2xl p-5 relative">
              {/* Active indicator */}
              <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${plan.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />

              <div className="mb-3">
                <span className="text-xs font-mono text-gray-400">{plan.slug}</span>
                <h3 className="text-base font-bold text-gray-900 mt-0.5">{plan.name}</h3>
              </div>

              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <p>₹{plan.priceMonthly}/mo · ₹{plan.priceYearly}/yr</p>
                <p>{plan.jobLimit === -1 ? 'Unlimited' : plan.jobLimit.toLocaleString()} jobs/day</p>
                <p>{plan.applyLimit === -1 ? 'Unlimited' : (plan.applyLimit ?? 10).toLocaleString()} applies/period</p>
                <p className="text-gray-400 text-xs">{plan.features.length} features</p>
              </div>

              {plan.razorpayPlanIdMonthly && (
                <p className="font-mono text-xs text-gray-400 mb-3 truncate">{plan.razorpayPlanIdMonthly}</p>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModal(plan)}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-xs font-medium transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(plan._id)}
                  disabled={deleting === plan._id}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-red-100 hover:bg-red-50 text-red-500 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
                >
                  {deleting === plan._id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== false && (
        <PlanModal
          plan={modal}
          onClose={() => setModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
