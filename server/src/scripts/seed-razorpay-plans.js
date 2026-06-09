require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Plan = require('../models/Plan');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLANS = [
  { slug: 'basic',    name: 'Basic',    priceMonthly: 0,     priceYearly: 0,      jobLimit: 10,   features: ['10 jobs per day', 'Basic filters', 'Apply redirects', 'Email support'] },
  { slug: 'standard', name: 'Standard', priceMonthly: 2999,  priceYearly: 29999,  jobLimit: 100,  features: ['100 jobs per day', 'All filters', 'Apply redirects', 'Priority support'] },
  { slug: 'premium',  name: 'Premium',  priceMonthly: 5999,  priceYearly: 59999,  jobLimit: 1000, features: ['1,000 jobs per day', 'All filters + skills', 'Real-time updates', 'Priority support'] },
  { slug: 'elite',    name: 'Elite',    priceMonthly: 9999,  priceYearly: 99999,  jobLimit: -1,   features: ['All jobs no limit', 'All filters', 'Real-time SSE updates', 'Dedicated support'] },
];

async function createRazorpayPlan(plan) {
  const rp = await razorpay.plans.create({
    period: 'monthly',
    interval: 1,
    item: {
      name: `Uniflux ${plan.name} Monthly`,
      amount: plan.priceMonthly,
      currency: 'INR',
      description: `Uniflux ${plan.name} plan — monthly subscription`,
    },
    notes: { slug: plan.slug },
  });
  return rp.id;
}

async function createRazorpayYearlyPlan(plan) {
  const rp = await razorpay.plans.create({
    period: 'yearly',
    interval: 1,
    item: {
      name: `Uniflux ${plan.name} Yearly`,
      amount: plan.priceYearly,
      currency: 'INR',
      description: `Uniflux ${plan.name} plan — yearly subscription`,
    },
    notes: { slug: plan.slug },
  });
  return rp.id;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  for (const plan of PLANS) {
    const existing = await Plan.findOne({ slug: plan.slug });

    let razorpayPlanIdMonthly = existing?.razorpayPlanIdMonthly ?? null;
    let razorpayPlanIdYearly  = existing?.razorpayPlanIdYearly  ?? null;

    if (plan.slug === 'basic') {
      // Basic is free — no Razorpay plan needed
      await Plan.findOneAndUpdate(
        { slug: plan.slug },
        {
          name: plan.name,
          priceMonthly: 0,
          priceYearly: 0,
          jobLimit: plan.jobLimit,
          features: plan.features,
          isActive: true,
        },
        { upsert: true, new: true }
      );
      console.log(`[basic] upserted — free plan, no Razorpay plan needed`);
      continue;
    }

    if (!razorpayPlanIdMonthly) {
      razorpayPlanIdMonthly = await createRazorpayPlan(plan);
      console.log(`[${plan.slug}] Created monthly Razorpay plan: ${razorpayPlanIdMonthly}`);
    } else {
      console.log(`[${plan.slug}] Monthly Razorpay plan exists: ${razorpayPlanIdMonthly}`);
    }

    if (!razorpayPlanIdYearly) {
      razorpayPlanIdYearly = await createRazorpayYearlyPlan(plan);
      console.log(`[${plan.slug}] Created yearly  Razorpay plan: ${razorpayPlanIdYearly}`);
    } else {
      console.log(`[${plan.slug}] Yearly  Razorpay plan exists: ${razorpayPlanIdYearly}`);
    }

    await Plan.findOneAndUpdate(
      { slug: plan.slug },
      {
        name: plan.name,
        // Store display price in rupees (paise / 100)
        priceMonthly: plan.priceMonthly / 100,
        priceYearly:  plan.priceYearly  / 100,
        jobLimit: plan.jobLimit,
        features: plan.features,
        razorpayPlanIdMonthly,
        razorpayPlanIdYearly,
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log(`[${plan.slug}] MongoDB updated\n`);
  }

  console.log('\nDone.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Failed:', err.message ?? err);
  if (err.error) console.error('Razorpay error:', JSON.stringify(err.error, null, 2));
  process.exit(1);
});
