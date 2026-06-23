const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String },
  type: {
    type: String,
    enum: [
      'page_view', 'service_view', 'service_click', 'consultation_open',
      'consultation_submit', 'login', 'logout', 'signup', 'payment_started',
      'payment_success', 'payment_failed', 'search', 'chatbot_started',
      'chatbot_message', 'lead_captured',
    ],
    required: true,
  },
  page: { type: String },
  data: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  referrer: { type: String },
  country: { type: String },
  city: { type: String },
}, { timestamps: true });

activitySchema.index({ userId: 1 });
activitySchema.index({ sessionId: 1 });
activitySchema.index({ type: 1 });
activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
