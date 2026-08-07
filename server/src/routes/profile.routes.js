const router = require('express').Router();
const { requireExtensionKey, extensionAuth } = require('../middleware/extension.middleware');
const { getExtensionProfile } = require('../controllers/profile.controller');

router.get('/extension/full', requireExtensionKey, extensionAuth, getExtensionProfile);

module.exports = router;
