const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');

async function attachSubscription(req, res, next) {
  try {
    let subscription = await Subscription.findOne({
      userId: req.user._id,
      status: 'active',
    });

    if (!subscription) {
      req.subscription = { planSlug: 'basic', jobLimit: 10 };
      return next();
    }

    const plan = await Plan.findOne({ slug: subscription.planSlug });
    req.subscription = {
      planSlug: subscription.planSlug,
      jobLimit: plan ? plan.jobLimit : 10,
      subscription,
    };
    next();
  } catch (err) {
    req.subscription = { planSlug: 'basic', jobLimit: 10 };
    next();
  }
}

module.exports = { attachSubscription };
