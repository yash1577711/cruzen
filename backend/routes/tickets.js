const router = require('express').Router();
const Ticket = require('../models/Ticket');
const { protect } = require('../middleware/auth');
const { sendOTPEmail } = require('../services/emailService');

router.get('/', protect, async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id })
      .populate('order', 'invoiceNumber service planName')
      .populate('replies.sender', 'name avatar role')
      .sort('-createdAt');
    res.json({ success: true, tickets });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const { title, description, category, priority, orderId } = req.body;
    if (!title || !description) return res.status(400).json({ success: false, message: 'Title and description required.' });
    const ticket = await Ticket.create({
      user: req.user._id, order: orderId || undefined,
      title, description, category: category || 'general', priority: priority || 'medium',
    });
    res.status(201).json({ success: true, ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:id/reply', protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message required.' });
    const ticket = await Ticket.findOne({ _id: req.params.id, user: req.user._id });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    ticket.replies.push({ sender: req.user._id, message, isStaff: false });
    ticket.status = 'open';
    await ticket.save();
    res.json({ success: true, ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Admin: get all tickets
router.get('/admin/all', protect, async (req, res) => {
  try {
    if (!['admin', 'sub-admin', 'pos_head'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Forbidden.' });
    const { status, page = 1, limit = 20 } = req.query;
    const q = status ? { status } : {};
    const tickets = await Ticket.find(q)
      .populate('user', 'name email')
      .populate({ path: 'order', select: 'invoiceNumber planName posHead teamMembers', populate: { path: 'posHead', select: 'name email' } })
      .populate('replies.sender', 'name role')
      .sort('-createdAt')
      .skip((page - 1) * limit).limit(Number(limit));
    const total = await Ticket.countDocuments(q);
    res.json({ success: true, tickets, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/admin/:id', protect, async (req, res) => {
  try {
    if (!['admin', 'sub-admin', 'pos_head'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Forbidden.' });
    const { status, message } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    if (status) { ticket.status = status; if (status === 'resolved') ticket.resolvedAt = new Date(); }
    if (message) ticket.replies.push({ sender: req.user._id, message, isStaff: true });
    await ticket.save();
    res.json({ success: true, ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
