const ServiceTracker = require('../models/ServiceTracker');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

exports.getMyTrackers = async (req, res) => {
  try {
    const trackers = await ServiceTracker.find({ user: req.user._id })
      .populate('service', 'title icon category plans')
      .populate('order', 'planName amount invoiceNumber serviceName duration quantity endDate')
      .populate('assignedTo', 'name email')
      .populate('updates.updatedBy', 'name role')
      .sort('-createdAt');
    res.json({ success: true, trackers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTrackerById = async (req, res) => {
  try {
    const tracker = await ServiceTracker.findById(req.params.id)
      .populate('service', 'title icon category description')
      .populate('order', 'planName amount invoiceNumber status duration quantity endDate')
      .populate('user', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('updates.updatedBy', 'name role');

    if (!tracker) return res.status(404).json({ success: false, message: 'Tracker not found.' });

    if (req.user.role === 'user' && tracker.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, tracker });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllTrackers = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, userId } = req.query;
    const query = {};
    if (status) query.overallStatus = status;
    if (userId) query.user = userId;

    const total = await ServiceTracker.countDocuments(query);
    const trackers = await ServiceTracker.find(query)
      .populate('service', 'title icon category')
      .populate('user', 'name email phone')
      .populate({ path: 'order', select: 'planName amount invoiceNumber posHead teamMembers duration quantity endDate', populate: [{ path: 'posHead', select: 'name email' }, { path: 'teamMembers', select: 'name' }] })
      .populate('assignedTo', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, trackers, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addUpdate = async (req, res) => {
  try {
    const { trackerId } = req.params;
    const { title, description, status, overallStatus, progressPercent, isVisibleToUser } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const update = { title, description, updatedBy: req.user._id, isVisibleToUser: isVisibleToUser !== false };
    if (status) update.status = status;

    const updatePayload = { $push: { updates: update } };
    if (overallStatus) updatePayload.overallStatus = overallStatus;
    if (progressPercent !== undefined) updatePayload.progressPercent = Math.min(100, Math.max(0, Number(progressPercent)));
    if (overallStatus === 'completed') updatePayload.completedDate = new Date();

    const tracker = await ServiceTracker.findByIdAndUpdate(trackerId, updatePayload, { new: true })
      .populate('updates.updatedBy', 'name role');

    if (!tracker) return res.status(404).json({ success: false, message: 'Tracker not found.' });

    // Push real-time update to client's socket
    if (tracker.user) {
      const io = req.app.get('io');
      const onlineUsers = req.app.get('onlineUsers');
      const socketId = onlineUsers?.get(tracker.user.toString());
      if (io && socketId) {
        io.to(socketId).emit('tracker_updated', {
          trackerId: tracker._id.toString(),
          progressPercent: tracker.progressPercent,
          overallStatus: tracker.overallStatus,
          updates: tracker.updates,
        });
      }

      // Also send notification bell update
      if (isVisibleToUser !== false) {
        notificationService.send({
          recipient: tracker.user,
          type: 'tracker_updated',
          title: 'Progress Update',
          body: title,
          link: '/dashboard?tab=tracker',
        }).catch(console.error);
      }
    }

    res.json({ success: true, tracker });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleFeature = async (req, res) => {
  try {
    const { trackerId } = req.params;
    const { featureName, completed } = req.body;
    if (!featureName) return res.status(400).json({ success: false, message: 'featureName required.' });

    const update = completed
      ? { $addToSet: { completedFeatures: featureName } }
      : { $pull: { completedFeatures: featureName } };

    const tracker = await ServiceTracker.findByIdAndUpdate(trackerId, update, { new: true });
    if (!tracker) return res.status(404).json({ success: false, message: 'Tracker not found.' });
    res.json({ success: true, completedFeatures: tracker.completedFeatures });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignTracker = async (req, res) => {
  try {
    const { trackerId } = req.params;
    const { assignedTo } = req.body;

    const staff = await User.findById(assignedTo);
    if (!staff || !['admin', 'sub-admin', 'pos_head'].includes(staff.role)) {
      return res.status(400).json({ success: false, message: 'Assignee must be admin, sub-admin, or POS head.' });
    }

    const tracker = await ServiceTracker.findByIdAndUpdate(
      trackerId, { assignedTo }, { new: true }
    ).populate('assignedTo', 'name email');

    res.json({ success: true, tracker });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
