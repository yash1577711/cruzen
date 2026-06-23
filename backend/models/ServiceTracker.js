const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'review', 'completed'],
    default: 'pending',
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachments: [String],
  isVisibleToUser: { type: Boolean, default: true },
}, { timestamps: true });

const trackerSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: false },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  overallStatus: {
    type: String,
    enum: ['not-started', 'in-progress', 'review', 'completed', 'on-hold'],
    default: 'not-started',
  },
  progressPercent: { type: Number, default: 0, min: 0, max: 100 },
  updates: [updateSchema],
  completedFeatures: [{ type: String }],
  startDate: { type: Date },
  estimatedCompletionDate: { type: Date },
  completedDate: { type: Date },
  adminNotes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ServiceTracker', trackerSchema);
