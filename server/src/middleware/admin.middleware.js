const { protect } = require('./auth.middleware');

async function adminOnly(req, res, next) {
  await protect(req, res, () => {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
}

module.exports = { adminOnly };
