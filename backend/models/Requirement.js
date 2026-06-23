const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  raisedByRole: { type: String, enum: ['client', 'team', 'admin'], default: 'client' },
  type: {
    type: String,
    enum: ['requirement', 'update', 'feedback', 'link', 'reference', 'approval', 'content', 'revision'],
    default: 'requirement',
  },
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String },
  links: [{ label: String, url: String }],
  attachments: [String],
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in-progress', 'done', 'rejected'],
    default: 'pending',
  },
  isReadByClient: { type: Boolean, default: false },
  isReadByTeam: { type: Boolean, default: false },
  dueDate: { type: Date },
  replies: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Requirement', requirementSchema);
