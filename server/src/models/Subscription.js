const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    planSlug:         { type: String, required: true, default: 'basic' },
    status:           { type: String, enum: ['active', 'expired', 'inactive'], default: 'inactive' },
    razorpayOrderId:  { type: String, default: null },
    razorpayPaymentId:{ type: String, default: null },
    planActivatedAt:  { type: Date, default: null },
    planExpiresAt:    { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
