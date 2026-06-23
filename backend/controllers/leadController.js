const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const { sendOrderConfirmationEmail } = require('../services/emailService');

exports.getLeads = async (req, res) => {
  try {
    const { status, source, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (source) query.source = source;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];

    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, leads, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, assignedTo } = req.body;
    const update = {};
    if (status) update.status = status;
    if (notes) update.notes = notes;
    if (assignedTo) update.assignedTo = assignedTo;

    const lead = await Lead.findByIdAndUpdate(id, update, { new: true }).populate('assignedTo', 'name email');
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createLead = async (req, res) => {
  try {
    const { name, email, phone, service, message, source } = req.body;
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;

    const lead = await Lead.create({
      name, email, phone, service, message,
      source: source || 'contact_form',
      sessionId: req.headers['x-session-id'],
      ipAddress,
      userAgent: req.headers['user-agent'],
      pageUrl: req.headers.referer,
      userId: req.user?._id,
    });

    await Activity.create({
      userId: req.user?._id,
      type: 'lead_captured',
      data: { name, email, source },
      ipAddress,
      userAgent: req.headers['user-agent'],
    });

    if (source === 'buy_now' && email) {
      sendOrderConfirmationEmail(email, name, service, message).catch(console.error);
    }

    res.status(201).json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
