const razorpayService = require('../services/razorpay.service');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');

async function getPlans(req, res) {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ priceMonthly: 1 });
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function createOrder(req, res) {
  try {
    const { planSlug } = req.body;
    if (!planSlug) return res.status(400).json({ message: 'planSlug required' });

    const result = await razorpayService.createOrder(req.user._id, planSlug);
    res.json(result);
  } catch (err) {
    const status = ['Plan not found', 'Cannot purchase a free plan'].includes(err.message) ? 400 : 500;
    console.error('[createOrder]', err.message, err.error ?? '');
    res.status(status).json({ message: err.message || 'Payment initiation failed' });
  }
}

async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planSlug } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planSlug)
      return res.status(400).json({ message: 'razorpay_order_id, razorpay_payment_id, razorpay_signature, planSlug required' });

    const valid = razorpayService.verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!valid) return res.status(400).json({ message: 'Invalid payment signature' });

    await razorpayService.activateSubscription(req.user._id, planSlug, razorpay_order_id, razorpay_payment_id);
    res.json({ message: 'Plan activated successfully' });
  } catch (err) {
    console.error('[verifyPayment]', err.message);
    res.status(500).json({ message: err.message });
  }
}

async function currentSubscription(req, res) {
  try {
    const subscription = await Subscription.findOne({ userId: req.user._id });
    if (!subscription) return res.json({ planSlug: 'basic', status: 'inactive' });

    const plan = await Plan.findOne({ slug: subscription.planSlug });
    res.json({ subscription, plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getPlans, createOrder, verifyPayment, currentSubscription };
