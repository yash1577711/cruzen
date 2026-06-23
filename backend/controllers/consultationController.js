const Consultation = require('../models/Consultation');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const { sendConsultationConfirmationEmail } = require('../services/emailService');

exports.book = async (req, res) => {
  try {
    const { name, email, phone, service, date, timeSlot } = req.body;
    if (!name || !email || !phone || !service || !date || !timeSlot) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const consultation = await Consultation.create({
      name, email, phone, service,
      date: new Date(date),
      timeSlot,
      userId: req.user?._id,
    });

    // Create lead from consultation
    await Lead.create({
      name, email, phone, service,
      source: 'consultation',
      userId: req.user?._id,
      consultationDate: new Date(date),
      consultationTime: timeSlot,
      sessionId: req.headers['x-session-id'],
      ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      pageUrl: req.headers.referer,
    });

    await Activity.create({
      userId: req.user?._id,
      type: 'consultation_submit',
      data: { service, date, timeSlot },
      ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress,
    });

    if (email) {
      sendConsultationConfirmationEmail(email, name, service, date, timeSlot).catch(console.error);
    }

    res.status(201).json({ success: true, message: 'Consultation booked! We\'ll contact you shortly.', consultation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const total = await Consultation.countDocuments(query);
    const consultations = await Consultation.find(query)
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, consultations, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const consultation = await Consultation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found.' });
    res.json({ success: true, consultation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
