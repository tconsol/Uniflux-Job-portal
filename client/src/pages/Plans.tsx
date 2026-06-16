import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import PlanCard from '../components/PlanCard';
import { usePlans, useSubscription } from '../hooks/useBilling';
import { createOrder, verifyPayment } from '../api/billing.api';
import { useAuth } from '../context/AuthContext';
import type { Plan } from '../types';

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open(): void };
  }
}

const PLAN_ORDER: Record<string, number> = { free: 0, standard: 1, premium: 2, elite: 3 };

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Plans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: plans, isLoading } = usePlans();
  const { data: subData, refetch } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState('');

  const currentPlanSlug   = subData?.subscription?.planSlug ?? 'free';
  const isActiveSubscription = subData?.subscription?.status === 'active';
  const currentOrder      = PLAN_ORDER[currentPlanSlug] ?? 0;

  function isDowngrade(plan: Plan) {
    // If user has an active non-free plan, block any lower tier
    if (!isActiveSubscription || currentPlanSlug === 'free') return false;
    return (PLAN_ORDER[plan.slug] ?? 0) < currentOrder;
  }

  async function handleSelect(plan: Plan) {
    if (!user) { navigate('/register'); return; }
    if (plan.slug === 'free') return; // free plan can't be purchased
    if (isDowngrade(plan)) return;   // downgrade blocked client-side too

    setError('');
    setLoadingPlan(plan.slug);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load Razorpay SDK');

      const init = await createOrder(plan.slug);

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: init.key,
          order_id: init.orderId,
          amount: init.amount,
          currency: init.currency,
          name: 'Jobwalkers',
          description: `${init.planName} Plan — 30 days access`,
          prefill: { name: user.name, email: user.email },
          theme: { color: '#2563eb' },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planSlug: init.planSlug,
              });
              await refetch();
              navigate('/profile');
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: { ondismiss: () => resolve() },
        });
        rzp.open();
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (err instanceof Error ? err.message : 'Payment failed');
      setError(msg);
    } finally {
      setLoadingPlan(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose your plan</h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Upgrade to apply to more jobs. All plans include real-time updates and full filtering.
          </p>
          {isActiveSubscription && currentPlanSlug !== 'free' && (
            <p className="text-sm text-amber-600 mt-3 font-medium">
              You're on the <span className="capitalize font-bold">{currentPlanSlug}</span> plan.
              Downgrading is locked until your plan expires.
            </p>
          )}
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 text-center">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans?.map((plan) => (
            <PlanCard
              key={plan._id}
              plan={plan}
              isCurrent={currentPlanSlug === plan.slug && isActiveSubscription}
              isDowngrade={isDowngrade(plan)}
              onSelect={handleSelect}
              loading={loadingPlan === plan.slug}
            />
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-10">
          Plans are valid for 30 days. Payment failure downgrades to Free automatically.
        </p>
      </div>
    </div>
  );
}
