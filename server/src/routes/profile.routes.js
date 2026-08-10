const router = require('express').Router();
const { requireExtensionKey, extensionAuth } = require('../middleware/extension.middleware');
const { protect } = require('../middleware/auth.middleware');
const { getExtensionProfile, getMyProfile, updateProfile } = require('../controllers/profile.controller');

router.get('/extension/full', requireExtensionKey, extensionAuth, getExtensionProfile);
router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateProfile);

module.exports = router;
