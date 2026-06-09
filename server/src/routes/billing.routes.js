const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getPlans, createOrder, verifyPayment, currentSubscription } = require('../controllers/billing.controller');

router.get('/plans', getPlans);

router.use(protect);
router.post('/order', createOrder);
router.post('/verify', verifyPayment);
router.get('/current', currentSubscription);

module.exports = router;
