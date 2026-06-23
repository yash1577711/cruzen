const Activity = require('../models/Activity');

const trackActivity = (type) => async (req, res, next) => {
  try {
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
    await Activity.create({
      userId: req.user?._id || null,
      sessionId: req.headers['x-session-id'] || null,
      type,
      page: req.originalUrl,
      data: req.body || {},
      ipAddress,
      userAgent: req.headers['user-agent'] || '',
      referrer: req.headers.referer || '',
    });
  } catch (_) {
    // non-blocking
  }
  next();
};

module.exports = trackActivity;
