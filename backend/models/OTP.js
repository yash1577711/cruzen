const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true },
  type: { type: String, enum: ['email', 'phone'], required: true },
  purpose: { type: String, enum: ['signup', 'login', '2fa', 'verify', 'reset'], required: true },
  otp: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attempts: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 10 * 60 * 1000) },
}, { timestamps: true });

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ identifier: 1, purpose: 1 });

module.exports = mongoose.model('OTP', otpSchema);
