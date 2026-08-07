const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Shared value baked into the shipped extension's source — NOT a secret an
// attacker can't get, just a cheap filter against non-extension traffic.
// The real authorization boundary is extensionAuth's short-lived JWT below.
// Rotating this value requires shipping a new extension build (instantly
// breaks all installed copies until users update).
function requireExtensionKey(req, res, next) {
  const key = req.headers['x-extension-key'];
  if (!key || key !== process.env.EXTENSION_KEY) {
    return res.status(401).json({ message: 'Invalid or missing extension key' });
  }
  next();
}

// Verifies the short-lived extension-scoped JWT minted by
// POST /api/auth/extension-refresh. Distinct from `protect` (which accepts
// the primary access token) so a leaked extension token has a 5-minute
// blast radius instead of full-session access.
async function extensionAuth(req, res, next) {
  try {
    const token = req.headers['x-extension-auth'];
    if (!token) {
      return res.status(401).json({ message: 'No extension token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'extension') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or deactivated' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired extension token' });
  }
}

module.exports = { requireExtensionKey, extensionAuth };
