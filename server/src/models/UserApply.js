const mongoose = require('mongoose');

const userApplySchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId:     { type: String, required: true },
  jobTitle:  { type: String, default: '' },
  company:   { type: String, default: '' },
  location:  { type: String, default: '' },
  applyUrl:  { type: String, default: '' },
  appliedAt: { type: Date, default: Date.now },
});

userApplySchema.index({ userId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('UserApply', userApplySchema);
