const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Service = require('../models/Service');
const ServiceTracker = require('../models/ServiceTracker');
const Activity = require('../models/Activity');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const notificationService = require('../services/notificationService');

const isRazorpayConfigured = () =>
  process.env.RAZORPAY_KEY_ID &&
  !process.env.RAZORPAY_KEY_ID.includes('your_key') &&
  !process.env.RAZORPAY_KEY_ID.includes('placeholder') &&
  process.env.RAZORPAY_KEY_SECRET &&
  !process.env.RAZORPAY_KEY_SECRET.includes('your_razorpay') &&
  !process.env.RAZORPAY_KEY_SECRET.includes('placeholder');

exports.createOrder = async (req, res) => {
  try {
    const { serviceId, serviceName, planName, amount: reqAmount } = req.body;
    if (!planName) {
      return res.status(400).json({ success: false, message: 'Plan name is required.' });
    }

    let service = null;
    let planPrice = reqAmount;

    if (serviceId) {
      service = await Service.findById(serviceId);
      if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
      const plan = service.plans.find(p => p.name === planName);
      if (!plan) return res.status(400).json({ success: false, message: 'Plan not found.' });
      planPrice = plan.price;
    } else if (!serviceName || !reqAmount) {
      return res.status(400).json({ success: false, message: 'Either serviceId or serviceName + amount is required.' });
    }

    let razorpayOrderId;
    let testMode = false;

    if (isRazorpayConfigured()) {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        const rzpOrder = await razorpay.orders.create({
          amount: planPrice * 100,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
        });
        razorpayOrderId = rzpOrder.id;
      } catch (rzpErr) {
        console.warn('Razorpay order creation failed, falling back to demo:', rzpErr.message);
        razorpayOrderId = `order_demo_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        testMode = true;
      }
    } else {
      razorpayOrderId = `order_demo_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      testMode = true;
    }

    const orderData = {
      user: req.user._id,
      planName,
      amount: planPrice,
      razorpayOrderId,
      status: 'pending',
    };
    if (service) orderData.service = service._id;
    if (serviceName) orderData.serviceName = serviceName;

    const order = await Order.create(orderData);

    await Activity.create({
      userId: req.user._id,
      type: 'payment_started',
      data: { serviceId: serviceId || serviceName, planName, amount: planPrice },
    });

    res.status(201).json({
      success: true,
      order,
      razorpayOrderId,
      amount: planPrice * 100,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID,
      testMode,
    });
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId, testMode } = req.body;

    if (!testMode && isRazorpayConfigured()) {
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');
      if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({ success: false, message: 'Payment verification failed.' });
      }
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        razorpayPaymentId: razorpayPaymentId || 'demo_payment',
        razorpaySignature: razorpaySignature || 'demo_sig',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      { new: true }
    ).populate('service');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Auto-create tracker
    const existing = await ServiceTracker.findOne({ order: order._id });
    if (!existing) {
      const serviceTitle = order.service ? order.service.title : (order.serviceName || 'Service');
      const trackerData = {
        order: order._id,
        user: req.user._id,
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
      userId: req.user._id,
      type: 'payment_success',
      data: { orderId, amount: order.amount },
    });

    // Send confirmation emails + in-app notification (non-blocking)
    const serviceTitle = order.service ? order.service.title : (order.serviceName || 'Service');
    sendOrderConfirmationEmail(
      req.user.email || '',
      req.user.name || 'Customer',
      `${serviceTitle} — ${order.planName}`,
      null
    ).catch(console.error);

    notificationService.send({
      recipient: req.user._id,
      type: 'order_confirmed',
      title: 'Order Activated',
      body: `Your ${serviceTitle} — ${order.planName} plan is now active.`,
      link: '/dashboard?tab=tracker',
    }).catch(console.error);

    res.json({ success: true, message: 'Payment verified successfully.', order });
  } catch (err) {
    console.error('verifyPayment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('user', 'name email phone')
      .populate('service', 'title icon category plans')
      .populate('posHead', 'name email phone designation avatar')
      .populate('teamMembers', 'name email designation department avatar')
      .sort('-createdAt');
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id, status: 'pending' });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found or cannot be cancelled.' });
    order.status = 'cancelled';
    await order.save();
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'active', 'completed', 'cancelled', 'expired'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('user', 'name email').populate('service', 'title');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.completeOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('service', 'title');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // POS head completing their assigned order, or admin
    const isPosHead = req.user.role === 'pos_head' && order.posHead?.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'sub-admin'].includes(req.user.role);
    if (!isPosHead && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden.' });

    if (order.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Order is already completed.' });
    }

    order.status = 'completed';
    await order.save();

    // Update tracker
    await ServiceTracker.findOneAndUpdate(
      { order: order._id },
      { overallStatus: 'completed', progressPercent: 100, completedDate: new Date() }
    );

    // Notify client
    const serviceTitle = order.service?.title || order.serviceName || 'Service';
    notificationService.send({
      recipient: order.user._id,
      type: 'order_completed',
      title: 'Project Completed',
      body: `Your ${serviceTitle} — ${order.planName} project has been completed. Please review the deliverables.`,
      link: '/dashboard?tab=tracker',
    }).catch(console.error);

    res.json({ success: true, order });
  } catch (err) {
    console.error('completeOrder error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('service', 'title category')
      .populate('posHead', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
