const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'order_confirmed', 'order_assigned', 'order_completed',
      'tracker_updated', 'payment_received',
      'team_member_added', 'project_assigned',
      'message_received', 'requirement_raised', 'requirement_replied',
      'ticket_updated', 'renewal_reminder',
      'general',
    ],
    required: true,
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  link: { type: String },
  isRead: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
