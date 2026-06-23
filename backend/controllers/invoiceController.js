const PDFDocument = require('pdfkit');
const Order = require('../models/Order');

exports.downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('user', 'name email phone businessName')
      .populate('service', 'title category');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Access control: user can only see their own, staff can see all
    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isStaff = ['admin', 'sub-admin', 'pos_head'].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(403).json({ success: false, message: 'Forbidden.' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order.invoiceNumber}.pdf`);
    doc.pipe(res);

    const DARK = '#022B50';
    const ACCENT = '#00B4CC';
    const LIGHT = '#64748b';

    // ── Header ──────────────────────────────────────────
    doc.rect(0, 0, 595, 120).fill(DARK);
    doc.fillColor('#fff').fontSize(26).font('Helvetica-Bold').text('CruzenDigital', 50, 40);
    doc.fillColor(ACCENT).fontSize(10).font('Helvetica').text('Digital Marketing & E-Commerce Solutions', 50, 72);
    doc.fillColor('rgba(255,255,255,0.6)').fontSize(9).text('New Delhi, India · hello@cruzendigital.com · +91 93056 07745', 50, 88);

    // Invoice badge
    doc.rect(420, 30, 130, 60).fill(ACCENT);
    doc.fillColor('#fff').fontSize(20).font('Helvetica-Bold').text('INVOICE', 435, 38);
    doc.fillColor('rgba(255,255,255,0.8)').fontSize(8).font('Helvetica').text(order.invoiceNumber, 435, 62);

    // ── Meta row ─────────────────────────────────────────
    doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text('Invoice Date:', 50, 140);
    doc.font('Helvetica').fillColor(LIGHT).text(new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), 150, 140);

    doc.fillColor(DARK).font('Helvetica-Bold').text('Status:', 50, 158);
    const statusColor = order.status === 'active' ? '#1dbf73' : order.status === 'completed' ? '#6366f1' : LIGHT;
    doc.fillColor(statusColor).font('Helvetica').text(order.status.toUpperCase(), 150, 158);

    // ── Divider ──────────────────────────────────────────
    doc.moveTo(50, 178).lineTo(545, 178).stroke('#e2e8f0');

    // ── Bill To ──────────────────────────────────────────
    doc.fillColor(LIGHT).fontSize(8).font('Helvetica-Bold').text('BILL TO', 50, 192);
    doc.fillColor(DARK).fontSize(13).font('Helvetica-Bold').text(order.user?.name || 'Client', 50, 206);
    doc.fillColor(LIGHT).fontSize(9).font('Helvetica');
    if (order.user?.email) doc.text(order.user.email, 50, 222);
    if (order.user?.phone) doc.text(order.user.phone, 50, 236);
    if (order.user?.businessName) doc.text(order.user.businessName, 50, order.user?.phone ? 250 : 236);

    // ── Service table ─────────────────────────────────────
    const tableTop = 290;
    doc.rect(50, tableTop, 495, 32).fill('#f8fafc');
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(9);
    doc.text('SERVICE DESCRIPTION', 60, tableTop + 11);
    doc.text('PLAN', 320, tableTop + 11);
    doc.text('DURATION', 400, tableTop + 11);
    doc.text('AMOUNT', 470, tableTop + 11);

    const rowY = tableTop + 48;
    doc.fillColor(DARK).font('Helvetica').fontSize(11)
      .text(order.service?.title || order.serviceName || 'Digital Service', 60, rowY);
    doc.fontSize(9).fillColor(LIGHT)
      .text(order.planName, 320, rowY)
      .text('1 Month', 400, rowY);
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11)
      .text(`Rs. ${order.amount?.toLocaleString('en-IN')}`, 470, rowY);

    // Divider
    doc.moveTo(50, rowY + 28).lineTo(545, rowY + 28).stroke('#e2e8f0');

    // Totals
    const totY = rowY + 44;
    doc.fillColor(LIGHT).font('Helvetica').fontSize(9).text('Subtotal', 380, totY);
    doc.fillColor(DARK).text(`Rs. ${order.amount?.toLocaleString('en-IN')}`, 470, totY);

    doc.fillColor(LIGHT).text('Tax (0%)', 380, totY + 16);
    doc.fillColor(DARK).text('Rs. 0', 470, totY + 16);

    doc.rect(370, totY + 32, 175, 30).fill(DARK);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(11)
      .text('TOTAL', 380, totY + 41)
      .text(`Rs. ${order.amount?.toLocaleString('en-IN')}`, 470, totY + 41);

    // ── Payment info ─────────────────────────────────────
    if (order.payuPaymentId || order.razorpayPaymentId) {
      const payY = totY + 90;
      doc.fillColor(LIGHT).font('Helvetica-Bold').fontSize(8).text('PAYMENT REFERENCE', 50, payY);
      doc.fillColor(DARK).font('Helvetica').fontSize(9).text(order.payuPaymentId || order.razorpayPaymentId, 50, payY + 14);
    }

    // ── Footer ──────────────────────────────────────────
    doc.rect(0, 760, 595, 82).fill('#f8fafc');
    doc.moveTo(0, 760).lineTo(595, 760).stroke('#e2e8f0');
    doc.fillColor(LIGHT).font('Helvetica').fontSize(8)
      .text('Thank you for choosing Cruzen Digital. For any queries, contact us at hello@cruzendigital.com', 50, 776, { align: 'center', width: 495 })
      .text('© 2026 Cruzen Digital · New Delhi, India', 50, 796, { align: 'center', width: 495 });

    doc.end();
  } catch (err) {
    console.error('Invoice error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
