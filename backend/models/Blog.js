const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  category: {
    type: String,
    enum: ['marketplace', 'design', 'marketing', 'branding', 'technology'],
    required: true,
  },
  icon: { type: String, default: 'fas fa-newspaper' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: { type: String },
  readTime: { type: String, default: '5 min read' },
  tags: [String],
  isPublished: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  publishedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);
