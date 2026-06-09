import api from './axios';
import type { Plan, Subscription } from '../types';

export async function getPlans() {
  const { data } = await api.get<{ plans: Plan[] }>('/billing/plans');
  return data.plans;
}

export interface RazorpayOrderInit {
  orderId: string;
  key: string;
  amount: number;
  currency: string;
  planName: string;
  planSlug: string;
}

export async function createOrder(planSlug: string): Promise<RazorpayOrderInit> {
  const { data } = await api.post('/billing/order', { planSlug });
  return data;
}

export async function verifyPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planSlug: string;
}) {
  const { data } = await api.post<{ message: string }>('/billing/verify', payload);
  return data;
}

export async function getCurrentSubscription() {
  const { data } = await api.get<{ subscription: Subscription; plan: Plan }>('/billing/current');
  return data;
}

