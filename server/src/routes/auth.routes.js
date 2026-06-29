const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const {
  register, verifyOtp, resendOtp,
  login, refresh,
  getGoogleOAuthUrl, googleCallback, me,
  forgotPassword, resetPassword, updateProfile, extensionRefresh,
} = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/oauth/google', getGoogleOAuthUrl);
router.get('/oauth/google/callback', googleCallback);
router.get('/me', protect, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/profile', protect, updateProfile);
router.post('/extension-refresh', protect, extensionRefresh);

module.exports = router;
