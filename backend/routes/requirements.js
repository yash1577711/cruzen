const router = require('express').Router();
const Requirement = require('../models/Requirement');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Get requirements for a specific order (client view)
router.get('/order/:orderId', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
    if (!order && !['admin', 'sub-admin', 'pos_head'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    const requirements = await Requirement.find({ order: req.params.orderId })
      .populate('raisedBy', 'name avatar role')
      .populate('replies.sender', 'name avatar role')
      .sort('-createdAt');
    res.json({ success: true, requirements });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get all requirements for current user's orders
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).select('_id');
    const orderIds = orders.map(o => o._id);
    const requirements = await Requirement.find({ order: { $in: orderIds } })
      .populate('order', 'service planName invoiceNumber')
      .populate('raisedBy', 'name avatar role')
      .sort('-createdAt');
    res.json({ success: true, requirements });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Admin/pos_head: all requirements
router.get('/admin/all', protect, async (req, res) => {
  try {
    if (!['admin', 'sub-admin', 'pos_head'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    const { status, page = 1, limit = 20 } = req.query;
    const q = {};
    if (status) q.status = status;
    const total = await Requirement.countDocuments(q);
    const requirements = await Requirement.find(q)
      .populate({ path: 'order', select: 'invoiceNumber planName serviceName posHead teamMembers', populate: { path: 'posHead', select: 'name email' } })
      .populate('user', 'name email')
      .populate('raisedBy', 'name role')
      .populate('replies.sender', 'name role')
      .sort('-createdAt')
      .skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, requirements, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Client raises a requirement
router.post('/', protect, async (req, res) => {
  try {
    const { orderId, type, title, description, links, dueDate } = req.body;
    if (!orderId || !title) return res.status(400).json({ success: false, message: 'orderId and title required.' });
    const order = await Order.findOne({ _id: orderId, user: req.user._id }).populate('user', 'email name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    const req_ = await Requirement.create({
      order: orderId, user: order.user._id,
      raisedBy: req.user._id, raisedByRole: 'client',
      type: type || 'requirement', title, description, links: links || [], dueDate,
    });
    res.status(201).json({ success: true, requirement: req_ });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Team/admin raises a requirement to client
router.post('/team', protect, async (req, res) => {
  try {
    if (!['admin', 'sub-admin', 'pos_head', 'team_member'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    const { orderId, type, title, description, links, dueDate } = req.body;
    const order = await Order.findById(orderId).populate('user', 'email name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    const req_ = await Requirement.create({
      order: orderId, user: order.user._id,
      raisedBy: req.user._id, raisedByRole: 'team',
      type: type || 'requirement', title, description, links: links || [], dueDate,
    });
    // Notify client by email
    if (order.user?.email) {
      const subject = `[Action Required] New ${type || 'requirement'} raised — ${title}`;
      const html = `<div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;"><h2 style="color:#022B50;margin:0 0 16px;">New ${type || 'Requirement'} from Team</h2><p style="color:#64748b;margin:0 0 12px;">Your project team has raised a new item that requires your attention:</p><div style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin:0 0 20px;border-left:3px solid #00B4CC;"><strong style="color:#022B50;">${title}</strong>${description ? `<p style="color:#64748b;margin:8px 0 0;font-size:0.9rem;">${description}</p>` : ''}</div><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?tab=requirements" style="display:inline-block;background:linear-gradient(135deg,#1dbf73,#00B4CC);color:#fff;padding:12px 24px;border-radius:50px;text-decoration:none;font-weight:700;">View in Dashboard →</a><p style="color:#94a3b8;font-size:0.8rem;margin:20px 0 0;">© 2026 Cruzen Digital</p></div>`;
      const trans = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: 587, secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
      trans.sendMail({ from: `"Cruzen Digital" <${process.env.SMTP_FROM}>`, to: order.user.email, subject, html }).catch(console.error);
    }
    res.status(201).json({ success: true, requirement: req_ });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Reply to a requirement
router.post('/:id/reply', protect, async (req, res) => {
  try {
    const { message } = req.body;
    const req_ = await Requirement.findById(req.params.id);
    if (!req_) return res.status(404).json({ success: false, message: 'Not found.' });
    const uid = req.user._id.toString();
    const isOwner = req_.user.toString() === uid;
    const isStaff = ['admin', 'sub-admin', 'pos_head', 'team_member'].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(403).json({ success: false, message: 'Forbidden.' });
    req_.replies.push({ sender: req.user._id, message });
    await req_.save();
    res.json({ success: true, requirement: req_ });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Update status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const req_ = await Requirement.findById(req.params.id);
    if (!req_) return res.status(404).json({ success: false, message: 'Not found.' });
    const uid = req.user._id.toString();
    const isOwner = req_.user.toString() === uid;
    const isStaff = ['admin', 'sub-admin', 'pos_head', 'team_member'].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(403).json({ success: false, message: 'Forbidden.' });
    req_.status = req.body.status;
    await req_.save();
    res.json({ success: true, requirement: req_ });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
