const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, enum: ['basic', 'standard', 'premium', 'elite'] },
    name: { type: String, required: true },
    jobLimit: { type: Number, required: true },
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
