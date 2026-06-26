const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const {
  signup, login, refreshToken, logout, getMe,
  sendOTP, verifyOTP, loginWithOTP, verify2FA,
  googleAuth, googleCallback,
  forgotPassword, verifyResetOtp, resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Only password/OTP endpoints get rate-limited — Google OAuth is redirect-based and must not be throttled
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 200 : 50,
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes.' },
});

router.post('/signup', loginLimiter, signup);
router.post('/login', loginLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// OTP routes
router.post('/send-otp', loginLimiter, sendOTP);
router.post('/verify-otp', loginLimiter, verifyOTP);
router.post('/login-otp', loginLimiter, loginWithOTP);
router.post('/verify-2fa', loginLimiter, verify2FA);

// Password reset
router.post('/forgot-password', loginLimiter, forgotPassword);
router.post('/verify-reset-otp', loginLimiter, verifyResetOtp);
router.post('/reset-password', loginLimiter, resetPassword);

// Google OAuth — NO rate limiter (OAuth redirects must flow freely)
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

module.exports = router;
