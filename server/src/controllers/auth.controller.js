const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('googleapis').Auth;
const User = require('../models/User');
const { sendOtpEmail, sendPasswordResetEmail } = require('../services/email.service');
const { activateFreePlan } = require('../services/razorpay.service');

function generateTokens(userId) {
  const access = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );
  const refresh = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
  return { access, refresh };
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

async function register(req, res) {
  try {
    const { name, email, password, agreedToTerms } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'name, email, password required' });
    if (!agreedToTerms)
      return res.status(400).json({ message: 'You must accept the Terms and Conditions' });

    const exists = await User.findOne({ email });
    if (exists) {
      if (!exists.isEmailVerified) {
        // Resend OTP to same unverified account
        const otp = generateOtp();
        exists.otp = hashOtp(otp);
        exists.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await exists.save();
        await sendOtpEmail(email, exists.name, otp);
        return res.status(200).json({ message: 'Account exists but unverified. OTP resent.', email });
      }
      return res.status(409).json({ message: 'Email already registered' });
    }

    const otp = generateOtp();
    const user = await User.create({
      name,
      email,
      password,
      isEmailVerified: false,
      agreedToTerms: true,
      agreedToTermsAt: new Date(),
      otp: hashOtp(otp),
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
    });
    await sendOtpEmail(email, name, otp);

    res.status(201).json({ message: 'Account created. OTP sent to your email.', email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'email and otp required' });

    const user = await User.findOne({ email }).select('+otp +otpExpiry');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isEmailVerified) return res.status(400).json({ message: 'Email already verified' });
    if (!user.otp || !user.otpExpiry) return res.status(400).json({ message: 'No OTP found. Request a new one.' });
    if (Date.now() > user.otpExpiry.getTime()) return res.status(400).json({ message: 'OTP expired. Request a new one.' });
    if (hashOtp(String(otp)) !== user.otp) return res.status(400).json({ message: 'Invalid OTP' });

    user.isEmailVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();
    await activateFreePlan(user._id);

    const tokens = generateTokens(user._id);
    res.json({ message: 'Email verified', user: user.toJSON(), tokens });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function resendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isEmailVerified) return res.status(400).json({ message: 'Email already verified' });

    const otp = generateOtp();
    user.otp = hashOtp(otp);
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendOtpEmail(email, user.name, otp);

    res.json({ message: 'OTP resent to your email', email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: 'Email not verified. Check your inbox for the OTP.',
        emailVerificationRequired: true,
        email,
      });
    }

    const tokens = generateTokens(user._id);
    res.json({ user: user.toJSON(), tokens });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') return res.status(401).json({ message: 'Invalid token type' });

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) return res.status(401).json({ message: 'User not found' });

    const tokens = generateTokens(user._id);
    res.json({ tokens });
  } catch {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
}

async function getGoogleOAuthUrl(req, res) {
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
  });
  res.json({ url });
}

async function googleCallback(req, res) {
  try {
    const { code } = req.query;
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        user.isEmailVerified = true;
        await user.save();
      } else {
        user = await User.create({ name, email, googleId, isEmailVerified: true });
        await activateFreePlan(user._id);
      }
    }

    const appTokens = generateTokens(user._id);

    const redirectUrl = `${process.env.CLIENT_URL}/oauth/callback?accessToken=${appTokens.access}&refreshToken=${appTokens.refresh}`;
    res.redirect(redirectUrl);
  } catch {
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    const otp = generateOtp();
    user.otp = hashOtp(otp);
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendPasswordResetEmail(email, user.name, otp);

    res.json({ message: 'Password reset OTP sent to your email', email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: 'email, otp, and newPassword required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await User.findOne({ email }).select('+otp +otpExpiry');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.otp || !user.otpExpiry) return res.status(400).json({ message: 'No OTP found. Request a new one.' });
    if (Date.now() > user.otpExpiry.getTime()) return res.status(400).json({ message: 'OTP expired. Request a new one.' });
    if (hashOtp(String(otp)) !== user.otp) return res.status(400).json({ message: 'Invalid OTP' });

    user.password = newPassword;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function extensionRefresh(req, res) {
  try {
    const token = jwt.sign(
      { userId: req.user._id, type: 'extension' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );
    res.json({ token, expiresIn: 300 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword)
        return res.status(400).json({ message: 'Current password required to change password' });
      if (!user.password)
        return res.status(400).json({ message: 'Google account — set a password via forgot password flow' });
      const valid = await user.comparePassword(currentPassword);
      if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });
      if (newPassword.length < 6)
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      user.password = newPassword;
    }

    await user.save();
    res.json({ message: 'Profile updated', user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  register, verifyOtp, resendOtp, login, refresh,
  getGoogleOAuthUrl, googleCallback, me,
  forgotPassword, resetPassword, updateProfile, extensionRefresh,
};
