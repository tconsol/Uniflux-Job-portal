const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;
    // EventSource cannot send headers — fall back to ?token= query param
    const token = (header?.startsWith('Bearer ') ? header.split(' ')[1] : null)
      ?? req.query.token;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'access') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Like protect, but never rejects — populates req.user when a valid token
// is present, otherwise leaves it undefined so the route stays public.
async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token = (header?.startsWith('Bearer ') ? header.split(' ')[1] : null)
      ?? req.query.token;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'access') return next();

    const user = await User.findById(decoded.userId);
    if (user && user.isActive) req.user = user;
    next();
  } catch (err) {
    next();
  }
}

module.exports = { protect, optionalAuth };
