require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const UserApply = require('../models/UserApply');

const ADMIN_EMAIL = 'admin@uniflux.com';
const ADMIN_PASSWORD = 'Admin@123';
const ADMIN_NAME = 'Super Admin';

async function seedAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Wipe all existing data
  await Promise.all([
    User.deleteMany({}),
    Subscription.deleteMany({}),
    UserApply.deleteMany({}),
  ]);
  console.log('All existing data cleared');

  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    isAdmin: true,
    isEmailVerified: true,
    isActive: true,
  });

  console.log('Admin seeded successfully');
  console.log('  Email   :', ADMIN_EMAIL);
  console.log('  Password:', ADMIN_PASSWORD);

  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
