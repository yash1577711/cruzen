const router = require('express').Router();
const TeamMessage = require('../models/TeamMessage');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// Unread count — MUST be before /:room to avoid being shadowed
router.get('/unread/count', protect, async (req, res) => {
  try {
    let rooms = [];
    if (req.user.role === 'user') {
      const orders = await Order.find({ user: req.user._id }).select('_id');
      rooms = orders.map(o => o._id.toString());
    } else if (['pos_head', 'team_member'].includes(req.user.role)) {
      const field = req.user.role === 'pos_head' ? 'posHead' : 'teamMembers';
      const orders = await Order.find({ [field]: req.user._id }).select('_id');
      rooms = orders.map(o => o._id.toString());
    } else {
      const orders = await Order.find({}).select('_id').limit(500);
      rooms = orders.map(o => o._id.toString());
    }
    const senderRoleExclude = req.user.role === 'user' ? 'client' : 'team';
    const count = await TeamMessage.countDocuments({
      room: { $in: rooms },
      readBy: { $ne: req.user._id },
      senderRole: { $ne: senderRoleExclude },
    });
    res.json({ success: true, count });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get message history for a room (orderId)
router.get('/:room', protect, async (req, res) => {
  try {
    const { room } = req.params;
    const order = await Order.findById(room);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    const isClient = order.user.toString() === req.user._id.toString();
    const isStaff = ['admin', 'sub-admin', 'pos_head', 'team_member'].includes(req.user.role);
    if (!isClient && !isStaff) return res.status(403).json({ success: false, message: 'Forbidden.' });

    const messages = await TeamMessage.find({ room })
      .populate('sender', 'name avatar role')
      .sort('createdAt')
      .limit(200);

    const unreadIds = messages.filter(m => !m.readBy.map(id => id.toString()).includes(req.user._id.toString())).map(m => m._id);
    if (unreadIds.length) {
      await TeamMessage.updateMany({ _id: { $in: unreadIds } }, { $addToSet: { readBy: req.user._id } });
    }
    res.json({ success: true, messages });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Save a message (socket handler is primary; this is REST fallback)
router.post('/:room', protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message required.' });
    const senderRole = ['admin', 'sub-admin'].includes(req.user.role) ? 'admin' :
      ['pos_head', 'team_member'].includes(req.user.role) ? 'team' : 'client';
    const msg = await TeamMessage.create({
      room: req.params.room,
      sender: req.user._id,
      senderRole,
      message: message.trim(),
      readBy: [req.user._id],
    });
    const populated = await msg.populate('sender', 'name avatar role');
    res.status(201).json({ success: true, message: populated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
