const router = require('express').Router();
const {
  signup, login, refreshToken, logout, getMe,
  sendOTP, verifyOTP, loginWithOTP, verify2FA,
  googleAuth, googleCallback,
  forgotPassword, verifyResetOtp, resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// OTP routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/login-otp', loginWithOTP);
router.post('/verify-2fa', verify2FA);

// Password reset
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

// Google OAuth
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

module.exports = router;
