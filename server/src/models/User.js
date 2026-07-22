const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: null },
    googleId: { type: String, default: null, sparse: true },
    avatar:   { type: String, default: null },
    region:   { type: String, enum: ['US', 'IN'], default: 'US' }, // job-feed market; geoip-defaulted, user-editable
    razorpayCustomerId: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    agreedToTerms: { type: Boolean, default: false },
    agreedToTermsAt: { type: Date, default: null },
    otp: { type: String, default: null, select: false },
    otpExpiry: { type: Date, default: null },
    profile: {
      resumeUrl: { type: String, default: null },
      skills: [String],
      preferences: {
        locations: [String],
        jobTypes: [String],
        salaryMin: { type: Number, default: null },
      },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiry;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
