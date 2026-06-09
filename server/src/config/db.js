const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
    await seedPlans();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

async function seedPlans() {
  const Plan = require('../models/Plan');
  const count = await Plan.countDocuments();
  if (count === 0) {
    await Plan.insertMany([
      { slug: 'basic',    name: 'Basic',    jobLimit: 10,   priceMonthly: 9.99,  isActive: true },
      { slug: 'standard', name: 'Standard', jobLimit: 100,  priceMonthly: 29.99, isActive: true },
      { slug: 'premium',  name: 'Premium',  jobLimit: 1000, priceMonthly: 59.99, isActive: true },
      { slug: 'elite',    name: 'Elite',    jobLimit: -1,   priceMonthly: 99.99, isActive: true },
    ]);
    console.log('Default plans seeded');
  }
}

module.exports = { connectDB };
