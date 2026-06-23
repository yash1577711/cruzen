const User = require('../models/User');
const Order = require('../models/Order');
const Service = require('../models/Service');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const ServiceTracker = require('../models/ServiceTracker');

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers, newUsersThisMonth,
      totalOrders, totalRevenue,
      totalLeads, newLeadsThisMonth,
      recentActivities,
      leadsBySource, ordersByStatus,
      revenueByMonth,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: thisMonth } }),
      Order.countDocuments({ status: { $in: ['active', 'completed', 'paid'] } }),
      Order.aggregate([
        { $match: { status: { $in: ['active', 'completed', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Lead.countDocuments(),
      Lead.countDocuments({ createdAt: { $gte: thisMonth } }),
      Activity.find().sort('-createdAt').limit(20).populate('userId', 'name email'),
      Lead.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { status: { $in: ['active', 'completed', 'paid'] }, createdAt: { $gte: lastMonth } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers, newUsersThisMonth,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalLeads, newLeadsThisMonth,
        leadsBySource, ordersByStatus,
        revenueByMonth,
      },
      recentActivities,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 30 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .populate('managedBy', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive, serviceCategories, managedBy, department, designation } = req.body;

    if (req.user.role !== 'admin' && role) {
      return res.status(403).json({ success: false, message: 'Only admin can change roles.' });
    }

    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (serviceCategories !== undefined) updateData.serviceCategories = serviceCategories;
    if (managedBy !== undefined) updateData.managedBy = managedBy || null;
    if (department !== undefined) updateData.department = department;
    if (designation !== undefined) updateData.designation = designation;

    const user = await User.findByIdAndUpdate(id, updateData, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSubAdmins = async (req, res) => {
  try {
    const subAdmins = await User.find({ role: { $in: ['sub-admin', 'admin'] } }).sort('-createdAt');
    res.json({ success: true, subAdmins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createSubAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'Email already in use.' });
    const user = await User.create({ name, email, password, phone, role: 'sub-admin' });
    res.status(201).json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStaff = async (req, res) => {
  try {
    const { role } = req.query;
    const query = { role: { $in: ['pos_head', 'team_member'] } };
    if (role) query.role = role;
    const staff = await User.find(query)
      .populate('managedBy', 'name email')
      .sort('-createdAt');
    // For each pos_head, count their team members and active orders
    const staffWithStats = await Promise.all(staff.map(async (s) => {
      const obj = s.toSafeObject();
      if (s.role === 'pos_head') {
        obj.memberCount = await User.countDocuments({ managedBy: s._id, role: 'team_member' });
        obj.activeOrders = await Order.countDocuments({ posHead: s._id, status: { $in: ['active', 'paid'] } });
      }
      return obj;
    }));
    res.json({ success: true, staff: staffWithStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, phone, role, department, designation, serviceCategories, managedBy } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password and role are required.' });
    }
    if (!['pos_head', 'team_member'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be pos_head or team_member.' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'Email already in use.' });

    const userData = { name, email, password, phone, role, department, designation, isActive: true, isEmailVerified: true };
    if (serviceCategories) userData.serviceCategories = Array.isArray(serviceCategories) ? serviceCategories : [serviceCategories];
    if (managedBy && role === 'team_member') userData.managedBy = managedBy;

    const user = await User.create(userData);
    res.status(201).json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, serviceCategories, managedBy, department, designation } = req.body;
    const update = {};
    if (isActive !== undefined) update.isActive = isActive;
    if (serviceCategories !== undefined) update.serviceCategories = Array.isArray(serviceCategories) ? serviceCategories : [serviceCategories];
    if (managedBy !== undefined) update.managedBy = managedBy || null;
    if (department !== undefined) update.department = department;
    if (designation !== undefined) update.designation = designation;
    const user = await User.findByIdAndUpdate(id, update, { new: true }).populate('managedBy', 'name email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const activities = await Activity.find({ userId }).sort('-createdAt').limit(50);
    const user = await User.findById(userId);
    res.json({ success: true, activities, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
