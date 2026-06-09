const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { attachSubscription } = require('../middleware/subscription.middleware');
const { listJobs, getJob, sseStream } = require('../controllers/jobs.controller');

router.use(protect);
router.get('/sse', attachSubscription, sseStream);
router.get('/', attachSubscription, listJobs);
router.get('/:id', getJob);

module.exports = router;
