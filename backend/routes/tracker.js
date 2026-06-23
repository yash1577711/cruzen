const router = require('express').Router();
const { protect, requireAdminOrSubAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/trackerController');
const ServiceTracker = require('../models/ServiceTracker');
const Order = require('../models/Order');

router.use(protect);

router.get('/my', ctrl.getMyTrackers);
router.get('/all', requireAdminOrSubAdmin, ctrl.getAllTrackers);

// Get tracker for a specific order — accessible by client owner, pos_head, team_member, admin
router.get('/order/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    const uid = req.user._id.toString();
    const isClient = order.user?.toString() === uid;
    const isPosHead = order.posHead?.toString() === uid;
    const isTeamMember = order.teamMembers?.map(m => m.toString()).includes(uid);
    const isAdmin = ['admin', 'sub-admin'].includes(req.user.role);
    if (!isClient && !isPosHead && !isTeamMember && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const tracker = await ServiceTracker.findOne({ order: req.params.orderId })
      .populate('service', 'title icon plans')
      .populate('order', 'planName amount invoiceNumber serviceName')
      .populate('updates.updatedBy', 'name role');
    res.json({ success: true, tracker });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', ctrl.getTrackerById);

// Add tracker update — admin/sub-admin always; pos_head/team_member for their assigned orders
router.post('/:trackerId/update', async (req, res, next) => {
  if (['admin', 'sub-admin'].includes(req.user.role)) return next();
  if (['pos_head', 'team_member'].includes(req.user.role)) {
    const tracker = await ServiceTracker.findById(req.params.trackerId).populate('order');
    if (!tracker) return res.status(404).json({ success: false, message: 'Tracker not found.' });
    const order = tracker.order;
    const uid = req.user._id.toString();
    const ok = (req.user.role === 'pos_head' && order.posHead?.toString() === uid) ||
               (req.user.role === 'team_member' && order.teamMembers?.map(m => m.toString()).includes(uid));
    if (!ok) return res.status(403).json({ success: false, message: 'Access denied.' });
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden.' });
}, ctrl.addUpdate);

// Toggle a feature completion — admin always; pos_head/team_member for their assigned orders
router.patch('/:trackerId/feature', async (req, res, next) => {
  if (['admin', 'sub-admin'].includes(req.user.role)) return next();
  if (['pos_head', 'team_member'].includes(req.user.role)) {
    const tracker = await ServiceTracker.findById(req.params.trackerId).populate('order');
    if (!tracker) return res.status(404).json({ success: false, message: 'Tracker not found.' });
    const order = tracker.order;
    const uid = req.user._id.toString();
    const ok = (req.user.role === 'pos_head' && order.posHead?.toString() === uid) ||
               (req.user.role === 'team_member' && order.teamMembers?.map(m => m.toString()).includes(uid));
    if (!ok) return res.status(403).json({ success: false, message: 'Access denied.' });
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden.' });
}, ctrl.toggleFeature);

router.patch('/:trackerId/assign', requireAdminOrSubAdmin, ctrl.assignTracker);

module.exports = router;
