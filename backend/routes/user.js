const router = require('express').Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

router.use(protect);

router.get('/profile', (req, res) => res.json({ success: true, user: req.user }));

router.patch('/profile', async (req, res) => {
  try {
    const { name, phone, businessName, businessDomain, address } = req.body;
    const update = {};
    if (name) update.name = name;
    if (phone) update.phone = phone;
    if (businessName !== undefined) update.businessName = businessName;
    if (businessDomain !== undefined) update.businessDomain = businessDomain;
    if (address !== undefined) update.address = address;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/avatar', async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ success: false, message: 'Avatar data required.' });
    if (avatar.length > 2 * 1024 * 1024 * 1.37) {
      return res.status(400).json({ success: false, message: 'Image too large. Max 2MB.' });
    }
    const user = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/toggle-2fa', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.twoFactorEnabled = !user.twoFactorEnabled;
    await user.save();
    res.json({ success: true, twoFactorEnabled: user.twoFactorEnabled });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
