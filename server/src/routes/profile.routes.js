const router = require('express').Router();
const { extensionProtect } = require('../middleware/extension.middleware');
const { protect } = require('../middleware/auth.middleware');
const { getFullProfile, updateFullProfile } = require('../controllers/profile.controller');

router.get('/full', protect, getFullProfile);
router.put('/full', protect, updateFullProfile);

router.get('/extension/full', extensionProtect, getFullProfile);
router.put('/extension/full', extensionProtect, updateFullProfile);

module.exports = router;
