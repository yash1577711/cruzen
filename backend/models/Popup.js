const mongoose = require('mongoose');

const PopupSchema = new mongoose.Schema({
  enabled:       { type: Boolean, default: true },
  imageUrl:      { type: String,  default: '' },
  title:         { type: String,  default: 'Free Strategy Call' },
  subtitle:      { type: String,  default: 'Book a 30-min session with our experts — zero cost, zero pressure.' },
  ctaText:       { type: String,  default: 'Book Free Consultation' },
  showFrequency: { type: String,  enum: ['always', 'once_per_day', 'once_per_session'], default: 'once_per_session' },
}, { timestamps: true });

module.exports = mongoose.model('Popup', PopupSchema);
