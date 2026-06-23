const mongoose = require('mongoose');

const onboardingSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Platform credentials (stored securely — ideally encrypted in production)
  platformCredentials: {
    platform: { type: String },
    accountId: { type: String },
    loginEmail: { type: String },
    loginPassword: { type: String },
    storeName: { type: String },
    storeUrl: { type: String },
    gstin: { type: String },
    panNumber: { type: String },
    bankAccountName: { type: String },
    bankAccountNumber: { type: String },
    ifscCode: { type: String },
  },
  // Brand assets
  brandAssets: {
    brandName: { type: String },
    brandDescription: { type: String },
    targetAudience: { type: String },
    competitorUrls: { type: String },
    primaryColor: { type: String },
    logoUrl: { type: String },
    brandGuidelineUrl: { type: String },
  },
  // Contact preferences
  contactPreferences: {
    preferredContactMethod: { type: String, enum: ['whatsapp', 'email', 'call'], default: 'whatsapp' },
    whatsappNumber: { type: String },
    preferredTime: { type: String },
  },
  // Goals & notes
  businessGoals: { type: String },
  additionalNotes: { type: String },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Onboarding', onboardingSchema);
