const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');

const PLAN_DURATION_DAYS = 3;

async function createOrder(userId, planSlug) {
  const plan = await Plan.findOne({ slug: planSlug, isActive: true });
  if (!plan) throw new Error('Plan not found');
  if (plan.priceMonthly <= 0) throw new Error('Cannot purchase a free plan');

  const amountPaise = Math.round(plan.priceMonthly * 100);

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `uf_${userId.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
    notes: { userId: userId.toString(), planSlug },
  });

  return {
    orderId: order.id,
    key: process.env.RAZORPAY_KEY_ID,
    amount: amountPaise,
    currency: 'INR',
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
    { status: 'active', planSlug: { $ne: 'basic' }, planExpiresAt: { $lte: now } },
    { $set: { planSlug: 'basic', status: 'expired' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[scheduler] Expired ${result.modifiedCount} plan(s) → downgraded to basic`);
  }
}

module.exports = { createOrder, verifyPaymentSignature, activateSubscription, expireOverduePlans };
