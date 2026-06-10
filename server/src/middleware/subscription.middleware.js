const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');

// apply limits by plan slug when Plan doc not found
const DEFAULT_APPLY_LIMITS = { basic: 10, standard: 100, premium: 1000, elite: -1 };
const DEFAULT_JOB_LIMITS   = { basic: 10, standard: 100, premium: 1000, elite: -1 };

async function attachSubscription(req, res, next) {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: 'active',
    });

    if (!subscription) {
      req.subscription = { planSlug: 'basic', jobLimit: 10, applyLimit: 10, subscription: null };
      return next();
    }

    const plan = await Plan.findOne({ slug: subscription.planSlug });
    req.subscription = {
      planSlug:   subscription.planSlug,
      jobLimit:   plan ? plan.jobLimit   : (DEFAULT_JOB_LIMITS[subscription.planSlug]   ?? 10),
      applyLimit: plan ? plan.applyLimit : (DEFAULT_APPLY_LIMITS[subscription.planSlug] ?? 10),
      subscription,
    };
    next();
  } catch (err) {
    req.subscription = { planSlug: 'basic', jobLimit: 10, applyLimit: 10, subscription: null };
    next();
  }
}

module.exports = { attachSubscription };
