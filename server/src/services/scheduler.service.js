const cron = require('node-cron');
const Plan = require('../models/Plan');
const { generateDailyJobSet } = require('./jobs.service');
const { expireOverduePlans } = require('./razorpay.service');

async function precomputeAllDailySets() {
  console.log('Generating daily job sets...');
  try {
    const plans = await Plan.find({ isActive: true });
    for (const plan of plans) {
      await generateDailyJobSet(plan.slug, plan.jobLimit);
      console.log(`Daily set generated for plan: ${plan.slug}`);
    }
  } catch (err) {
    console.error('Failed to precompute daily job sets:', err.message);
  }
}

function startScheduler() {
  cron.schedule('0 0 * * *', precomputeAllDailySets, { timezone: 'UTC' });
  cron.schedule('0 * * * *', expireOverduePlans);
  console.log('Scheduler started — daily job sets at midnight UTC, plan expiry check every hour');
}

module.exports = { startScheduler, precomputeAllDailySets };
