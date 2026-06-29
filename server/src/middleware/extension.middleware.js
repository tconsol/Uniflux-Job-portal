const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function extensionProtect(req, res, next) {
  try {
    const header = req.headers['x-extension-auth'];
    const extKey = req.headers['x-extension-key'];

    if (!header || !extKey) {
      return res.status(401).json({ message: 'Missing extension credentials' });
    }

    if (extKey !== process.env.EXTENSION_KEY) {
      return res.status(401).json({ message: 'Invalid extension key' });
    }

    const decoded = jwt.verify(header, process.env.JWT_SECRET);

    if (decoded.type !== 'extension') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired extension token' });
  }
}

module.exports = { extensionProtect };
