require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');

const DEFAULT_PLANS = [
  {
    slug: 'free',
    name: 'Free',
    jobLimit: 100,
    applyLimit: 10,
    priceMonthly: 0,
    priceYearly: 0,
    isActive: true,
    features: ['10 applies per period', 'Basic filters', 'Apply redirects', 'Email support'],
  },
  {
    slug: 'standard',
    name: 'Standard',
    jobLimit: 100,
    applyLimit: 100,
    priceMonthly: 29.99,
    priceYearly: 299.99,
    isActive: true,
    features: ['100 applies per period', 'All filters', 'Apply redirects', 'Priority support'],
  },
  {
    slug: 'premium',
    name: 'Premium',
    jobLimit: 100,
    applyLimit: 1000,
    priceMonthly: 59.99,
    priceYearly: 599.99,
    isActive: true,
    features: ['1,000 applies per period', 'All filters + skills', 'Real-time updates', 'Priority support'],
  },
  {
    slug: 'elite',
    name: 'Elite',
    jobLimit: -1,
    applyLimit: -1,
    priceMonthly: 99.99,
    priceYearly: 999.99,
    isActive: true,
    features: ['Unlimited applies', 'All filters', 'Real-time SSE updates', 'Dedicated support'],
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // Migrate old 'basic' slug to 'free' — bypass Mongoose enum via raw collection
  const migratedPlans = await Plan.collection.updateMany({ slug: 'basic' }, { $set: { slug: 'free', name: 'Free', priceMonthly: 0 } });
  if (migratedPlans.modifiedCount > 0) console.log(`Migrated ${migratedPlans.modifiedCount} plan(s): basic → free`);

  // Also migrate any subscriptions still referencing 'basic'
  const migratedSubs = await Subscription.collection.updateMany({ planSlug: 'basic' }, { $set: { planSlug: 'free' } });
  if (migratedSubs.modifiedCount > 0) console.log(`Migrated ${migratedSubs.modifiedCount} subscription(s): basic → free`);

  for (const plan of DEFAULT_PLANS) {
    await Plan.findOneAndUpdate(
      { slug: plan.slug },
      plan,
      { upsert: true, new: true }
    );
    const price = plan.priceMonthly === 0 ? 'Free' : `$${plan.priceMonthly}/mo`;
    console.log(`[${plan.slug}] seeded — ${price}`);
  }

  console.log('\nPlans seeded.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
