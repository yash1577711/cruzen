const Notification = require('../models/Notification');

let _io = null;
let _onlineUsers = null;

const init = (io, onlineUsers) => {
  _io = io;
  _onlineUsers = onlineUsers;
};

const send = async ({ recipient, type, title, body, link = null, data = null }) => {
  try {
    const notif = await Notification.create({ recipient, type, title, body, link, data });

    // Emit real-time if user is online
    if (_io && _onlineUsers) {
      const socketId = _onlineUsers.get(recipient.toString());
      if (socketId) {
        _io.to(socketId).emit('notification', {
          _id: notif._id,
          type,
          title,
          body,
          link,
          isRead: false,
          createdAt: notif.createdAt,
        });
      }
    }
    return notif;
  } catch (err) {
    console.error('notificationService.send error:', err.message);
  }
};

module.exports = { init, send };
