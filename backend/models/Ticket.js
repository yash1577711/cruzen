const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  isStaff: { type: Boolean, default: false },
  attachments: [String],
}, { timestamps: true });

const ticketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  ticketId: { type: String, unique: true },
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['billing', 'technical', 'delivery', 'revision', 'general', 'urgent'],
    default: 'general',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'waiting-client', 'resolved', 'closed'],
    default: 'open',
  },
  attachments: [String],
  replies: [replySchema],
  resolvedAt: { type: Date },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

ticketSchema.pre('save', function (next) {
  if (!this.ticketId) {
    this.ticketId = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
