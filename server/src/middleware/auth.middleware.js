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

module.exports = { protect };
