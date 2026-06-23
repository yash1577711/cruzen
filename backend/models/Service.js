const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: String },
  features: [String],
  isPopular: { type: Boolean, default: false },
}, { _id: true });

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true },
  shortDesc: { type: String },
  icon: { type: String, default: 'fas fa-star' },
  category: {
    type: String,
    enum: ['e-commerce', 'marketing', 'design-development'],
    required: true,
  },
  plans: [planSchema],
  startingPrice: { type: Number, required: true },
  searchKeywords: [String],
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
