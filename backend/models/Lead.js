const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  source: {
    type: String,
    enum: ['consultation', 'chatbot', 'signup', 'contact_form', 'page_visit', 'service_click', 'payment_intent', 'exit_intent', 'sticky_bar', 'buy_now', 'services_popup', 'about_popup', 'portfolio_popup', 'blog_newsletter'],
    default: 'page_visit',
  },
  service: { type: String },
  message: { type: String },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
    default: 'new',
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  pageUrl: { type: String },
  consultationDate: { type: Date },
  consultationTime: { type: String },
  isConverted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
