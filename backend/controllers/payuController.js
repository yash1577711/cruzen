const crypto = require('crypto');
const Order = require('../models/Order');
const ServiceTracker = require('../models/ServiceTracker');
const Activity = require('../models/Activity');
const { sendOrderConfirmationEmail } = require('../services/emailService');

const PAYU_KEY = () => process.env.PAYU_KEY || '';
const PAYU_SALT = () => process.env.PAYU_SALT || '';
const PAYU_URL = () => process.env.PAYU_URL || 'https://test.payu.in/_payment';

const isPayUConfigured = () =>
  process.env.PAYU_KEY &&
  !process.env.PAYU_KEY.includes('your_') &&
  process.env.PAYU_SALT &&
  !process.env.PAYU_SALT.includes('your_');

// Generate SHA512 hash: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
const generateHash = (params) => {
  const { key, txnid, amount, productinfo, firstname, email, udf1 = '', udf2 = '', udf3 = '', udf4 = '', udf5 = '' } = params;
  const hashStr = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${PAYU_SALT()}`;
  return crypto.createHash('sha512').update(hashStr).digest('hex');
};

// POST /orders/payu/init — generate PayU hash, return form params
exports.initPayU = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: 'orderId required.' });

    const order = await Order.findById(orderId)
      .populate('service', 'title')
      .populate('user', 'name email phone');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    const txnid = `CRUZEN_${order._id}_${Date.now()}`;
    const amount = order.amount.toFixed(2);
    const productinfo = order.service?.title || order.serviceName || 'CruzenDigital Service';
    const firstname = (req.user.name || '').split(' ')[0] || 'Customer';
    const email = req.user.email || '';
    const phone = req.user.phone || '';
    const key = PAYU_KEY();
    const surl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/orders/payu/success`;
    const furl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/orders/payu/failure`;

    const hash = generateHash({ key, txnid, amount, productinfo, firstname, email, udf1: order._id.toString() });

    // Store txnid on the order for later verification
    order.payuTxnId = txnid;
    await order.save({ validateBeforeSave: false });

    res.json({
      success: true,
      payuUrl: PAYU_URL(),
      params: { key, txnid, amount, productinfo, firstname, email, phone, udf1: order._id.toString(), surl, furl, hash },
      testMode: !isPayUConfigured(),
    });
  } catch (err) {
    console.error('initPayU error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /orders/payu/success — PayU posts here on success
exports.payuSuccess = async (req, res) => {
  try {
    const { txnid, mihpayid, status, hash: receivedHash, udf1: orderId, amount, productinfo, firstname, email } = req.body;

    if (status !== 'success') {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failed?reason=${encodeURIComponent('Payment was not successful.')}`);
    }

    // Verify reverse hash: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
    if (isPayUConfigured()) {
      // Reverse hash: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
      const reverseStr = `${PAYU_SALT()}|${status}||||||||||${orderId}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_KEY()}`;
      const expectedHash = crypto.createHash('sha512').update(reverseStr).digest('hex');
      if (expectedHash !== receivedHash) {
        console.error('PayU hash mismatch for txn:', txnid);
        return res.redirect(`${process.env.FRONTEND_URL}/payment-failed?reason=${encodeURIComponent('Payment verification failed.')}`);
      }
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        payuPaymentId: mihpayid,
        payuTxnId: txnid,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      { new: true }
    ).populate('service').populate('user', 'name email');

    if (!order) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failed?reason=${encodeURIComponent('Order not found.')}`);
    }

    // Auto-create tracker
    const existing = await ServiceTracker.findOne({ order: order._id });
    if (!existing) {
      const serviceTitle = order.service ? order.service.title : (order.serviceName || 'Service');
      const trackerData = {
        order: order._id,
        user: order.user._id,
        overallStatus: 'not-started',
        progressPercent: 0,
        startDate: new Date(),
        updates: [{
          title: 'Order Confirmed',
          description: `Your ${serviceTitle} — ${order.planName} plan has been activated. Our team will begin work shortly.`,
          status: 'completed',
          isVisibleToUser: true,
        }],
      };
      if (order.service) trackerData.service = order.service._id;
      await ServiceTracker.create(trackerData);
    }

    await Activity.create({
      userId: order.user._id,
      type: 'payment_success',
      data: { orderId: order._id, amount: order.amount, gateway: 'payu' },
    });

    sendOrderConfirmationEmail(
      order.user.email,
      order.user.name || 'Customer',
      `${order.service?.title || order.serviceName || 'Service'} — ${order.planName}`,
      null
    ).catch(console.error);

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?tab=tracker&payment=success`);
  } catch (err) {
    console.error('payuSuccess error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/payment-failed?reason=${encodeURIComponent('Server error.')}`);
  }
};

// POST /orders/payu/failure — PayU posts here on failure/cancel
exports.payuFailure = async (req, res) => {
  const { txnid, status, error_Message } = req.body;
  console.log('PayU failure:', { txnid, status, error_Message });
  res.redirect(`${process.env.FRONTEND_URL}/dashboard?payment=failed`);
};
