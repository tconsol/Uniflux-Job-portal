const stripe = require('../config/stripe');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');

async function getOrCreateStripeCustomer(userId) {
  const user = await User.findById(userId);
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: userId.toString() },
  });

  user.stripeCustomerId = customer.id;
  await user.save();
  return customer.id;
}

async function createCheckoutSession(userId, planSlug, successUrl, cancelUrl) {
  const plan = await Plan.findOne({ slug: planSlug, isActive: true });
  if (!plan) throw new Error('Plan not found');
  if (!plan.stripePriceIdMonthly) throw new Error('Stripe price not configured for this plan');

  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: plan.stripePriceIdMonthly, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId: userId.toString(), planSlug },
  });

  return { url: session.url, sessionId: session.id };
}

async function createPortalSession(userId, returnUrl) {
  const customerId = await getOrCreateStripeCustomer(userId);
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

async function handleCheckoutCompleted(checkoutSession) {
  const { userId, planSlug } = checkoutSession.metadata;
  const stripeSubId = checkoutSession.subscription;
  const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);

  await Subscription.findOneAndUpdate(
    { userId },
    {
      userId,
      planSlug,
      stripeCustomerId: checkoutSession.customer,
      stripeSubscriptionId: stripeSubId,
      status: 'active',
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      autoRenew: true,
    },
    { upsert: true, new: true }
  );
}

async function handleSubscriptionUpdated(stripeSub) {
  const subId = stripeSub.id;
  const newPlanSlug = stripeSub.items?.data?.[0]?.price?.metadata?.planSlug;
  if (!newPlanSlug) return;

  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subId },
    {
      planSlug: newPlanSlug,
      status: stripeSub.status === 'active' ? 'active' : stripeSub.status,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    }
  );
}

async function handleSubscriptionDeleted(stripeSub) {
  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: stripeSub.id },
    { planSlug: 'basic', status: 'expired' }
  );
}

async function handlePaymentFailed(invoice) {
  const subId = invoice.subscription;
  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subId },
    { planSlug: 'basic', status: 'expired' }
  );
}

module.exports = {
  createCheckoutSession,
  createPortalSession,
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handlePaymentFailed,
};
