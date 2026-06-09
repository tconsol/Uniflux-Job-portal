const mongoose = require('mongoose');

const dailyJobSetSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    planSlug: { type: String, required: true },
    jobIds: [String],
    seed: { type: Number, required: true },
  },
  { timestamps: true }
);

dailyJobSetSchema.index({ date: 1, planSlug: 1 }, { unique: true });

module.exports = mongoose.model('DailyJobSet', dailyJobSetSchema);
