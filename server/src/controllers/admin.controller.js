const User = require('../models/User');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const { precomputeAllDailySets } = require('../services/scheduler.service');

// ── Plans ────────────────────────────────────────────────────────────────────

async function listPlans(req, res) {
  try {
    const plans = await Plan.find().sort({ priceMonthly: 1 });
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function createPlan(req, res) {
  try {
    const plan = await Plan.create(req.body);
    res.status(201).json({ plan });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function updatePlan(req, res) {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json({ plan });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function deletePlan(req, res) {
  try {
    await Plan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Plan deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ── Users ────────────────────────────────────────────────────────────────────

async function listUsers(req, res) {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    res.json({ users, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getUserDetail(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const subscription = await Subscription.findOne({ userId: req.params.id });
    res.json({ user, subscription });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateUserSubscription(req, res) {
  try {
    const { planSlug, status, daysFromNow } = req.body;
    const update = { planSlug, status: status || 'active' };

    if (planSlug !== 'basic') {
      const days = parseInt(daysFromNow) || 3;
      update.planActivatedAt = new Date();
      update.planExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    } else {
      update.planExpiresAt = null;
      update.planActivatedAt = null;
    }

    const subscription = await Subscription.findOneAndUpdate(
      { userId: req.params.id },
      update,
      { upsert: true, new: true }
    );
    res.json({ subscription });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ── Revenue ──────────────────────────────────────────────────────────────────

async function getRevenueSummary(req, res) {
  try {
    const totalUsers = await User.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

    const planBreakdown = await Subscription.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$planSlug', count: { $sum: 1 } } },
    ]);

    const plans = await Plan.find({ isActive: true });
    let estimatedMRR = 0;
    for (const pb of planBreakdown) {
      const plan = plans.find((p) => p.slug === pb._id);
      if (plan) estimatedMRR += plan.priceMonthly * pb.count;
    }

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email createdAt');

    const userIds = recentUsers.map((u) => u._id);
    const subs = await Subscription.find({ userId: { $in: userIds } }).select('userId planSlug');
    const subMap = Object.fromEntries(subs.map((s) => [s.userId.toString(), s.planSlug]));

    const enrichedRecentUsers = recentUsers.map((u) => ({
      ...u.toObject(),
      planSlug: subMap[u._id.toString()] ?? null,
    }));

    res.json({
      totalUsers,
      activeSubscriptions,
      planBreakdown,
      estimatedMRR: estimatedMRR.toFixed(2),
      recentUsers: enrichedRecentUsers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function triggerDailyJobSets(req, res) {
  try {
    precomputeAllDailySets();
    res.json({ message: 'Daily job set generation triggered' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  listPlans, createPlan, updatePlan, deletePlan,
  listUsers, getUserDetail, updateUserSubscription,
  getRevenueSummary, triggerDailyJobSets,
};
