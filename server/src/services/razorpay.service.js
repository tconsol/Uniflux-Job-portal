const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');

const PLAN_DURATION_DAYS = 30;
const PLAN_ORDER = { free: 0, standard: 1, premium: 2, elite: 3 };

async function activateFreePlan(userId) {
  const existing = await Subscription.findOne({ userId });
  if (existing) return; // already has a subscription, don't overwrite
  await Subscription.create({
    userId,
    planSlug: 'free',
    status: 'active',
    planActivatedAt: new Date(),
    planExpiresAt: null, // free plan never expires
  });
}

async function createOrder(userId, planSlug) {
  if (planSlug === 'free') throw new Error('Cannot purchase the free plan');

  const plan = await Plan.findOne({ slug: planSlug, isActive: true });
  if (!plan) throw new Error('Plan not found');
  if (plan.priceMonthly <= 0) throw new Error('Cannot purchase a free plan');

  // Downgrade check
  const current = await Subscription.findOne({ userId, status: 'active' });
  if (current && current.planSlug !== 'free') {
    const currentOrder = PLAN_ORDER[current.planSlug] ?? 0;
    const newOrder     = PLAN_ORDER[planSlug] ?? 0;
    if (newOrder < currentOrder) {
      throw new Error(`Cannot downgrade while ${current.planSlug} plan is active. Wait until it expires.`);
    }
  }

  const amountPaise = Math.round(plan.priceMonthly * 100);

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'USD',
    receipt: `uf_${userId.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
    notes: { userId: userId.toString(), planSlug },
  });

  return {
    orderId: order.id,
    key: process.env.RAZORPAY_KEY_ID,
    amount: amountPaise,
    currency: 'USD',
    planName: plan.name,
    planSlug,
  };
}

function verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
  const text = `${razorpayOrderId}|${razorpayPaymentId}`;
  const generated = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex');
  return generated === razorpaySignature;
}

async function activateSubscription(userId, planSlug, razorpayOrderId, razorpayPaymentId) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await Subscription.findOneAndUpdate(
    { userId },
    {
      userId,
      planSlug,
      status: 'active',
      razorpayOrderId,
      razorpayPaymentId,
      planActivatedAt: now,
      planExpiresAt: expiresAt,
    },
    { upsert: true, new: true }
  );
}

async function expireOverduePlans() {
  const now = new Date();
  const result = await Subscription.updateMany(
    { status: 'active', planSlug: { $ne: 'free' }, planExpiresAt: { $lte: now } },
    { $set: { planSlug: 'free', status: 'expired' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[scheduler] Expired ${result.modifiedCount} plan(s) → downgraded to free`);
  }
}

module.exports = { activateFreePlan, createOrder, verifyPaymentSignature, activateSubscription, expireOverduePlans };
