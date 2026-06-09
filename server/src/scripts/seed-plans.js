require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Plan = require('../models/Plan');

const DEFAULT_PLANS = [
  {
    slug: 'basic',
    name: 'Basic',
    jobLimit: 10,
    priceMonthly: 0,
    priceYearly: 0,
    isActive: true,
    features: ['10 jobs per day', 'Basic filters', 'Apply redirects', 'Email support'],
  },
  {
    slug: 'standard',
    name: 'Standard',
    jobLimit: 100,
    priceMonthly: 29.99,
    priceYearly: 299.99,
    isActive: true,
    features: ['100 jobs per day', 'All filters', 'Apply redirects', 'Priority support'],
  },
  {
    slug: 'premium',
    name: 'Premium',
    jobLimit: 1000,
    priceMonthly: 59.99,
    priceYearly: 599.99,
    isActive: true,
    features: ['1,000 jobs per day', 'All filters + skills', 'Real-time updates', 'Priority support'],
  },
  {
    slug: 'elite',
    name: 'Elite',
    jobLimit: -1,
    priceMonthly: 99.99,
    priceYearly: 999.99,
    isActive: true,
    features: ['All jobs no limit', 'All filters', 'Real-time SSE updates', 'Dedicated support'],
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  for (const plan of DEFAULT_PLANS) {
    const result = await Plan.findOneAndUpdate(
      { slug: plan.slug },
      { $setOnInsert: plan },
      { upsert: true, new: true }
    );
    console.log(`[${plan.slug}] ${result.wasNew ?? 'upserted'} — ₹${plan.priceMonthly}/mo`);
  }

  console.log('\nPlans seeded.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
