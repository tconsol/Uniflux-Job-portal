const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, enum: ['basic', 'standard', 'premium', 'elite'] },
    name: { type: String, required: true },
    jobLimit:   { type: Number, required: true },
    applyLimit: { type: Number, default: 10 },  // -1 = unlimited
    priceMonthly: { type: Number, required: true },
    priceYearly: { type: Number, default: null },
    razorpayPlanIdMonthly: { type: String, default: null },
    razorpayPlanIdYearly: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    features: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
