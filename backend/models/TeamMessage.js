const mongoose = require('mongoose');

const teamMessageSchema = new mongoose.Schema({
  room: { type: String, required: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['client', 'team', 'admin'], default: 'client' },
  message: { type: String, maxlength: 2000 },
  attachments: [String],
  isRead: { type: Boolean, default: false },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('TeamMessage', teamMessageSchema);
