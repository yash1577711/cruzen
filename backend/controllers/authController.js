const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const OTP = require('../models/OTP');
const Activity = require('../models/Activity');
const Lead = require('../models/Lead');
const { sendOTPEmail, sendWelcomeEmail, send2FASetupEmail } = require('../services/emailService');
const { send2FactorOTP } = require('../services/smsService');

const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '15m' });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' });

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const issueTokens = async (user) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

// ── Signup ──────────────────────────────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone, businessName } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({ name, email, password, phone, businessName, isEmailVerified: false });

    await Lead.create({
      name, email, phone, source: 'signup', userId: user._id,
      sessionId: req.headers['x-session-id'] || null,
      ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress,
    });

    await Activity.create({
      userId: user._id, type: 'signup',
      ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    // Send welcome + 2FA setup emails (non-blocking)
    sendWelcomeEmail(email, name).catch(console.error);
    setTimeout(() => send2FASetupEmail(email, name).catch(console.error), 3000);

    const { accessToken, refreshToken } = await issueTokens(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      accessToken, refreshToken,
      user: user.toSafeObject(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Login ───────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;

    await Activity.create({
      userId: user._id, type: 'login',
      ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    // If 2FA enabled → send OTP and require verification
    if (user.twoFactorEnabled) {
      await user.save({ validateBeforeSave: false });
      const otp = generateOTP();
      await OTP.deleteMany({ identifier: email, purpose: '2fa' });
      await OTP.create({ identifier: email, type: 'email', purpose: '2fa', otp, userId: user._id });
      await sendOTPEmail(email, otp, '2fa');
      return res.json({
        success: true,
        require2FA: true,
        message: 'OTP sent to your email for 2FA verification.',
        email,
      });
    }

    const { accessToken, refreshToken } = await issueTokens(user);
    res.json({ success: true, message: 'Login successful.', accessToken, refreshToken, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Send OTP ─────────────────────────────────────────────────────────────────
exports.sendOTP = async (req, res) => {
  try {
    const { identifier, type = 'email', purpose = 'signup' } = req.body;
    if (!identifier) return res.status(400).json({ success: false, message: 'Email or phone required.' });

    const otp = generateOTP();
    await OTP.deleteMany({ identifier, purpose });
    await OTP.create({ identifier, type, purpose, otp });

    if (type === 'email') {
      await sendOTPEmail(identifier, otp, purpose);
      res.json({ success: true, message: 'OTP sent to your email.' });
    } else {
      try {
        const result = await send2FactorOTP(identifier, otp);
        res.json({
          success: true,
          message: `OTP sent to ${identifier}.`,
          otp: (process.env.NODE_ENV === 'development' || result.dev) ? otp : undefined,
        });
      } catch (smsErr) {
        console.error('SMS send failed:', smsErr.message);
        // Don't fail the request — still send OTP in dev logs
        res.json({ success: true, message: `OTP sent to ${identifier}.`, otp: process.env.NODE_ENV === 'development' ? otp : undefined });
      }
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Verify OTP ───────────────────────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { identifier, otp, purpose = 'signup' } = req.body;
    if (!identifier || !otp) return res.status(400).json({ success: false, message: 'Identifier and OTP required.' });

    const record = await OTP.findOne({ identifier, purpose, verified: false }).sort('-createdAt');
    if (!record) return res.status(400).json({ success: false, message: 'OTP not found. Please request a new one.' });
    if (record.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }
    record.attempts += 1;
    if (record.attempts > 5) return res.status(429).json({ success: false, message: 'Too many attempts. Request a new OTP.' });
    if (record.otp !== otp) {
      await record.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    record.verified = true;
    await record.save();
    res.json({ success: true, message: 'OTP verified successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Login with OTP ───────────────────────────────────────────────────────────
exports.loginWithOTP = async (req, res) => {
  try {
    const { identifier, otp, type = 'email' } = req.body;
    if (!identifier || !otp) return res.status(400).json({ success: false, message: 'Identifier and OTP required.' });

    const record = await OTP.findOne({ identifier, purpose: 'login', verified: false }).sort('-createdAt');
    if (!record || record.expiresAt < new Date() || record.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }
    record.verified = true;
    await record.save();

    const query = type === 'email' ? { email: identifier } : { phone: identifier };
    let user = await User.findOne(query).select('+refreshToken');
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this identifier.' });
    }
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated.' });

    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await Activity.create({ userId: user._id, type: 'login' });

    const { accessToken, refreshToken } = await issueTokens(user);
    res.json({ success: true, message: 'Login successful.', accessToken, refreshToken, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Verify 2FA ──────────────────────────────────────────────────────────────
exports.verify2FA = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required.' });

    const record = await OTP.findOne({ identifier: email, purpose: '2fa', verified: false }).sort('-createdAt');
    if (!record || record.expiresAt < new Date() || record.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }
    record.verified = true;
    await record.save();

    const user = await User.findOne({ email }).select('+refreshToken');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const { accessToken, refreshToken } = await issueTokens(user);
    res.json({ success: true, message: 'Login successful.', accessToken, refreshToken, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Forgot Password ──────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email });
    // Always return success to prevent email enumeration
    if (!user) return res.json({ success: true, message: 'If that email exists, a reset code was sent.' });

    const otp = generateOTP();
    await OTP.deleteMany({ identifier: email, purpose: 'reset' });
    await OTP.create({ identifier: email, type: 'email', purpose: 'reset', otp, userId: user._id });
    await sendOTPEmail(email, otp, 'reset');

    res.json({ success: true, message: 'Reset code sent to your email.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required.' });

    const record = await OTP.findOne({ identifier: email, purpose: 'reset', verified: false }).sort('-createdAt');
    if (!record) return res.status(400).json({ success: false, message: 'OTP not found. Please request a new one.' });
    if (record.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }
    record.attempts += 1;
    if (record.attempts > 5) return res.status(429).json({ success: false, message: 'Too many attempts. Request a new code.' });
    if (record.otp !== otp) {
      await record.save();
      return res.status(400).json({ success: false, message: 'Invalid code. Please try again.' });
    }
    record.verified = true;
    await record.save();
    res.json({ success: true, message: 'OTP verified.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) return res.status(400).json({ success: false, message: 'Email, OTP and new password are required.' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

    const record = await OTP.findOne({ identifier: email, purpose: 'reset', verified: true }).sort('-createdAt');
    if (!record) return res.status(400).json({ success: false, message: 'Please verify your OTP first.' });
    if (record.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid reset token.' });

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.password = password;
    user.refreshToken = null;
    await user.save();
    await OTP.deleteMany({ identifier: email, purpose: 'reset' });

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Google OAuth ─────────────────────────────────────────────────────────────
exports.googleAuth = (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

exports.googleCallback = async (req, res) => {
  const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const { code } = req.query;
    if (!code) return res.redirect(`${FRONTEND}/login?error=google_failed`);

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.redirect(`${FRONTEND}/login?error=google_failed`);

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    if (!profile.email) return res.redirect(`${FRONTEND}/login?error=google_failed`);

    let user = await User.findOne({ email: profile.email }).select('+refreshToken');
    const isNew = !user;

    if (!user) {
      user = await User.create({
        name: profile.name || profile.email.split('@')[0],
        email: profile.email,
        googleId: profile.id,
        avatar: profile.picture || '',
        password: crypto.randomBytes(32).toString('hex'),
        isEmailVerified: true,
      });
      await Lead.create({ name: user.name, email: user.email, source: 'signup', userId: user._id });
      await Activity.create({ userId: user._id, type: 'signup' });
      sendWelcomeEmail(user.email, user.name).catch(console.error);
      setTimeout(() => send2FASetupEmail(user.email, user.name).catch(console.error), 3000);
    } else {
      if (!user.googleId) { user.googleId = profile.id; }
      if (!user.avatar && profile.picture) user.avatar = profile.picture;
      user.lastLogin = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      await Activity.create({ userId: user._id, type: 'login' });
    }

    const { accessToken, refreshToken } = await issueTokens(user);
    res.redirect(`${FRONTEND}/auth/callback?token=${accessToken}&refresh=${refreshToken}&new=${isNew}`);
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.redirect(`${FRONTEND}/login?error=google_failed`);
  }
};

// ── Refresh, Logout, Me ──────────────────────────────────────────────────────
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required.' });
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }
    const { accessToken: newAccess, refreshToken: newRefresh } = await issueTokens(user);
    res.json({ success: true, accessToken: newAccess, refreshToken: newRefresh });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    await Activity.create({ userId: req.user._id, type: 'logout' });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
