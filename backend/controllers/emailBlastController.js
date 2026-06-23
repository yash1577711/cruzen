const User = require('../models/User');
const Order = require('../models/Order');
const Service = require('../models/Service');
const nodemailer = require('nodemailer');
const { sendWelcomeEmail } = require('../services/emailService');

// In-memory store for welcome template (replace with DB model for persistence)
let welcomeTemplate = {
  subject: 'Welcome to Cruzen Digital!',
  body: `<p>Hi {{name}},</p><p>Welcome to <strong>Cruzen Digital</strong> — your premium e-commerce growth partner. We're thrilled to have you on board!</p><p>Explore our services and start scaling your brand today.</p><p>— Team Cruzen Digital</p>`,
};

const createTransport = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const FROM = `"Cruzen Digital" <${process.env.SMTP_USER}>`;

const sendBulk = async (users, subject, html) => {
  const transport = createTransport();
  const results = { sent: 0, failed: 0, errors: [] };

  for (const user of users) {
    try {
      const personalised = html
        .replace(/\{\{name\}\}/g, user.name || 'Valued Customer')
        .replace(/\{\{email\}\}/g, user.email || '');
      await transport.sendMail({ from: FROM, to: user.email, subject, html: wrapHtml(subject, personalised) });
      results.sent++;
    } catch (err) {
      results.failed++;
      results.errors.push({ email: user.email, error: err.message });
    }
  }
  return results;
};

const wrapHtml = (title, body) => `
  <div style="font-family:'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#022B50,#0f3d6c);padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;font-size:1.5rem;font-weight:800;margin:0 0 4px;">CruzenDigital</h1>
      <p style="color:rgba(255,255,255,0.65);margin:0;font-size:0.85rem;">Premium E-Commerce Growth Partner</p>
    </div>
    <div style="padding:36px 40px;color:#334155;font-size:0.95rem;line-height:1.8;">${body}</div>
    <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:0.78rem;margin:0;">© 2026 Cruzen Digital · New Delhi, India · <a href="mailto:hello@cruzendigital.com" style="color:#00B4CC;text-decoration:none;">hello@cruzendigital.com</a></p>
    </div>
  </div>`;

// GET /api/admin/email-blast/stats — recipients count preview
exports.getBlastStats = async (req, res) => {
  try {
    const { target, serviceId, category } = req.query;
    let users = [];

    if (target === 'all') {
      users = await User.find({ role: 'user', isActive: true }, '_id email name');
    } else if (target === 'service' && serviceId) {
      const orders = await Order.find({ service: serviceId }).distinct('user');
      users = await User.find({ _id: { $in: orders }, role: 'user', isActive: true }, '_id email name');
    } else if (target === 'category' && category) {
      const services = await Service.find({ category }).distinct('_id');
      const orders = await Order.find({ service: { $in: services } }).distinct('user');
      users = await User.find({ _id: { $in: orders }, role: 'user', isActive: true }, '_id email name');
    }

    res.json({ success: true, count: users.length, preview: users.slice(0, 5).map(u => ({ name: u.name, email: u.email })) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/email-blast/send
exports.sendBlast = async (req, res) => {
  try {
    const { target, serviceId, category, subject, body } = req.body;
    if (!subject || !body) return res.status(400).json({ success: false, message: 'Subject and body are required.' });

    let users = [];
    if (target === 'all') {
      users = await User.find({ role: 'user', isActive: true }, '_id email name');
    } else if (target === 'service' && serviceId) {
      const orderUserIds = await Order.find({ service: serviceId }).distinct('user');
      users = await User.find({ _id: { $in: orderUserIds }, role: 'user', isActive: true }, '_id email name');
    } else if (target === 'category' && category) {
      const services = await Service.find({ category }).distinct('_id');
      const orderUserIds = await Order.find({ service: { $in: services } }).distinct('user');
      users = await User.find({ _id: { $in: orderUserIds }, role: 'user', isActive: true }, '_id email name');
    } else {
      return res.status(400).json({ success: false, message: 'Invalid target configuration.' });
    }

    if (users.length === 0) return res.status(400).json({ success: false, message: 'No users found matching the criteria.' });

    const results = await sendBulk(users, subject, body);
    res.json({ success: true, message: `Email sent to ${results.sent} users.`, ...results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/email-blast/welcome-template
exports.getWelcomeTemplate = async (req, res) => {
  res.json({ success: true, template: welcomeTemplate });
};

// POST /api/admin/email-blast/welcome-template
exports.saveWelcomeTemplate = async (req, res) => {
  const { subject, body } = req.body;
  if (!subject || !body) return res.status(400).json({ success: false, message: 'Subject and body are required.' });
  welcomeTemplate = { subject, body };
  res.json({ success: true, message: 'Welcome template saved.', template: welcomeTemplate });
};

// POST /api/admin/email-blast/send-welcome-all  — send welcome to ALL users
exports.sendWelcomeAll = async (req, res) => {
  try {
    const users = await User.find({ role: 'user', isActive: true }, '_id email name');
    if (users.length === 0) return res.status(400).json({ success: false, message: 'No users found.' });
    const results = await sendBulk(users, welcomeTemplate.subject, welcomeTemplate.body);
    res.json({ success: true, message: `Welcome email sent to ${results.sent} users.`, ...results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
