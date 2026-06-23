const router = require('express').Router();
const { protect, requireAdmin, requireAdminOrSubAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');
const blast = require('../controllers/emailBlastController');
const Order = require('../models/Order');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const notificationService = require('../services/notificationService');

router.use(protect, requireAdminOrSubAdmin);

router.get('/dashboard', ctrl.getDashboardStats);
router.get('/users', ctrl.getUsers);
router.patch('/users/:id', requireAdmin, ctrl.updateUser);
router.get('/users/:userId/activity', ctrl.getUserActivity);
router.get('/sub-admins', requireAdmin, ctrl.getSubAdmins);
router.post('/sub-admins', requireAdmin, ctrl.createSubAdmin);

// Staff management (POS heads + Team members)
router.get('/staff', ctrl.getStaff);
router.post('/staff', requireAdmin, ctrl.createStaff);
router.patch('/staff/:id', requireAdmin, ctrl.updateStaff);

// Assign POS head to an order
router.patch('/orders/:orderId/assign-pos', async (req, res) => {
  try {
    const { posHeadId } = req.body;
    if (!posHeadId) return res.status(400).json({ success: false, message: 'posHeadId required.' });
    const posHead = await User.findOne({ _id: posHeadId, role: 'pos_head' });
    if (!posHead) return res.status(404).json({ success: false, message: 'POS head not found.' });
    const order = await Order.findByIdAndUpdate(req.params.orderId, { posHead: posHeadId }, { new: true })
      .populate('user', 'name email').populate('service', 'title');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    // Notify POS head (email + in-app)
    if (posHead.email) {
      const trans = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: 587, secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
      trans.sendMail({ from: `"Cruzen Digital" <${process.env.SMTP_USER}>`, to: posHead.email, subject: `New Project Assigned: ${order.service?.title}`, html: `<p>Hello ${posHead.name},<br/>You have been assigned as Project Head for <strong>${order.service?.title}</strong> (${order.planName} plan) for client <strong>${order.user?.name}</strong>.<br/>Log in to your dashboard to view details.</p>` }).catch(console.error);
    }
    notificationService.send({
      recipient: posHead._id,
      type: 'project_assigned',
      title: 'New Project Assigned',
      body: `You have been assigned as Project Head for ${order.service?.title || order.serviceName} — ${order.planName}.`,
      link: '/dashboard',
    }).catch(console.error);
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get all POS heads
router.get('/pos-heads', async (req, res) => {
  try {
    const heads = await User.find({ role: 'pos_head', isActive: true }).select('name email phone designation department');
    res.json({ success: true, heads });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Email blast (admin only)
router.get('/email-blast/stats', requireAdmin, blast.getBlastStats);
router.post('/email-blast/send', requireAdmin, blast.sendBlast);
router.get('/email-blast/welcome-template', requireAdmin, blast.getWelcomeTemplate);
router.post('/email-blast/welcome-template', requireAdmin, blast.saveWelcomeTemplate);
router.post('/email-blast/send-welcome-all', requireAdmin, blast.sendWelcomeAll);

// ── POS Head endpoints (no requireAdminOrSubAdmin middleware overrides below) ──
// These need their own router or we must remove the global middleware
module.exports = router;

// Create a separate router for POS Head & Team Member (not admin-only)
const posRouter = require('express').Router();
posRouter.use(protect);

posRouter.get('/pos/my-orders', async (req, res) => {
  try {
    if (req.user.role !== 'pos_head') return res.status(403).json({ success: false, message: 'Forbidden.' });
    const Service = require('../models/Service');
    // Build query: orders assigned to this head + orders from their categories (unassigned)
    const posHead = await User.findById(req.user._id);
    let query = { posHead: req.user._id };
    if (posHead.serviceCategories?.length) {
      // Also show unassigned orders from their categories
      const catServices = await Service.find({ category: { $in: posHead.serviceCategories } }).select('_id');
      const catServiceIds = catServices.map(s => s._id);
      query = {
        $or: [
          { posHead: req.user._id },
          { service: { $in: catServiceIds }, posHead: { $exists: false }, status: { $in: ['active', 'paid'] } },
        ]
      };
    }
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('service', 'title icon plans category')
      .populate('teamMembers', 'name email designation')
      .sort('-createdAt');
    res.json({ success: true, orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

posRouter.post('/pos/add-member', async (req, res) => {
  try {
    if (req.user.role !== 'pos_head') return res.status(403).json({ success: false, message: 'Forbidden.' });
    const { orderId, email } = req.body;
    if (!orderId || !email) return res.status(400).json({ success: false, message: 'orderId and email required.' });
    const order = await Order.findOne({ _id: orderId, posHead: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found or not assigned to you.' });
    let member = await User.findOne({ email: email.toLowerCase(), role: 'team_member' });
    if (!member) {
      // Auto-create a team_member account and send invite email
      const crypto = require('crypto');
      const tempPassword = crypto.randomBytes(8).toString('hex');
      member = await User.create({
        name: email.split('@')[0], email: email.toLowerCase(),
        password: tempPassword, role: 'team_member',
        isEmailVerified: false, isActive: true,
      });
      const trans = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: 587, secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
      trans.sendMail({
        from: `"Cruzen Digital" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'You\'ve been invited to join Cruzen Digital',
        html: `<p>Hello,<br/><strong>${req.user.name}</strong> has added you to a project on Cruzen Digital.<br/>Your temporary credentials:<br/>Email: <strong>${email}</strong><br/>Password: <strong>${tempPassword}</strong><br/>Please log in at <a href="${process.env.FRONTEND_URL}/login">${process.env.FRONTEND_URL}/login</a> and change your password.</p>`,
      }).catch(console.error);
    }
    if (order.teamMembers.includes(member._id)) return res.status(400).json({ success: false, message: 'Member already in this project.' });
    order.teamMembers.push(member._id);
    await order.save();
    const ordWithService = await Order.findById(order._id).populate('service', 'title').populate('user', 'name');
    const serviceTitle = ordWithService?.service?.title || order.serviceName || 'a project';
    // Notify member (email + in-app)
    const trans = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: 587, secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    trans.sendMail({ from: `"Cruzen Digital" <${process.env.SMTP_USER}>`, to: member.email, subject: `You've been added to ${serviceTitle}`, html: `<p>Hello ${member.name},<br/>You have been added to <strong>${serviceTitle}</strong> by ${req.user.name}. Log in to view your assignments.</p>` }).catch(console.error);
    notificationService.send({
      recipient: member._id,
      type: 'team_member_added',
      title: 'Added to a Project',
      body: `${req.user.name} added you to ${serviceTitle} for client ${ordWithService?.user?.name || 'a client'}.`,
      link: '/dashboard',
    }).catch(console.error);
    res.json({ success: true, message: 'Member added.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

posRouter.get('/team-member/my-projects', async (req, res) => {
  try {
    if (req.user.role !== 'team_member') return res.status(403).json({ success: false, message: 'Forbidden.' });
    const ServiceTracker = require('../models/ServiceTracker');
    const orders = await Order.find({ teamMembers: req.user._id })
      .populate('user', 'name email')
      .populate('service', 'title icon')
      .populate('posHead', 'name email')
      .sort('-createdAt');
    // Attach tracker info
    const ordersWithTracker = await Promise.all(orders.map(async (o) => {
      const tracker = await ServiceTracker.findOne({ order: o._id }).select('progressPercent overallStatus updates');
      return { ...o.toObject(), tracker };
    }));
    res.json({ success: true, orders: ordersWithTracker });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports.posRouter = posRouter;
