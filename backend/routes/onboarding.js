const router = require('express').Router();
const Onboarding = require('../models/Onboarding');
const Order = require('../models/Order');
const { protect, requireAdminOrSubAdmin } = require('../middleware/auth');

router.use(protect);

// GET /api/onboarding/:orderId — get onboarding for an order
router.get('/:orderId', async (req, res) => {
  try {
    const onboarding = await Onboarding.findOne({ order: req.params.orderId });
    res.json({ success: true, onboarding: onboarding || null });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/onboarding/:orderId — submit/update onboarding
router.post('/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Only order owner or admin can submit
    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'sub-admin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden.' });

    const {
      platformCredentials = {}, brandAssets = {},
      contactPreferences = {}, businessGoals, additionalNotes,
    } = req.body;

    const onboarding = await Onboarding.findOneAndUpdate(
      { order: req.params.orderId },
      {
        order: req.params.orderId,
        user: order.user,
        platformCredentials,
        brandAssets,
        contactPreferences,
        businessGoals,
        additionalNotes,
        isCompleted: true,
        completedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, onboarding });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/onboarding/admin/all — admin view all onboardings
router.get('/admin/all', requireAdminOrSubAdmin, async (req, res) => {
  try {
    const onboardings = await Onboarding.find({ isCompleted: true })
      .populate('order', 'planName amount invoiceNumber serviceName')
      .populate('user', 'name email phone businessName')
      .sort('-createdAt');
    res.json({ success: true, onboardings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/onboarding/pos/:orderId — POS head view onboarding
router.get('/pos/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, posHead: req.user._id });
    if (!order && !['admin', 'sub-admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    const onboarding = await Onboarding.findOne({ order: req.params.orderId })
      .populate('user', 'name email phone businessName');
    res.json({ success: true, onboarding: onboarding || null });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
