const mongoose = require('mongoose');

const auditReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String },
  platform: { type: String, enum: ['instagram', 'facebook', 'amazon', 'flipkart', 'website', 'other'], required: true },
  inputUrl: { type: String, required: true },
  isPaid: { type: Boolean, default: false },
  isFreeAudit: { type: Boolean, default: false },
  paymentId: { type: String },
  amount: { type: Number, default: 99 },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  report: {
    overallScore: Number,
    summary: String,
    sections: [{
      title: String,
      score: Number,
      issues: [{ severity: String, title: String, description: String, recommendation: String }],
      locked: Boolean,
    }],
    generatedAt: Date,
  },
  email: { type: String },
  viewToken: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('AuditReport', auditReportSchema);
