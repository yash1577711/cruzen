const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true, maxlength: 15 },
  password: { type: String, select: false, minlength: 8 },
  role: { type: String, enum: ['user', 'sub-admin', 'admin', 'pos_head', 'team_member'], default: 'user' },
  avatar: { type: String, default: '' },
  department: { type: String, trim: true },
  designation: { type: String, trim: true },
  serviceCategories: [{ type: String }],
  managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  businessName: { type: String, trim: true },
  businessDomain: { type: String, trim: true },
  address: { type: String },
  googleId: { type: String, select: false },
  twoFactorEnabled: { type: Boolean, default: false },
  refreshToken: { type: String, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  lastLogin: { type: Date },
  loginCount: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
