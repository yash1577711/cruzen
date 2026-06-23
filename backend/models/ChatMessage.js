const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  messages: [{
    role: { type: String, enum: ['user', 'bot'], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  }],
  leadCaptured: { type: Boolean, default: false },
  capturedName: { type: String },
  capturedEmail: { type: String },
  capturedPhone: { type: String },
  capturedService: { type: String },
  ipAddress: { type: String },
  isResolved: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatSchema);
