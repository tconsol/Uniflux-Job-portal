const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { attachSubscription } = require('../middleware/subscription.middleware');
const { listJobs, getJob, sseStream } = require('../controllers/jobs.controller');
const { recordApply, getApplied } = require('../controllers/apply.controller');

router.use(protect);
router.get('/sse',        attachSubscription, sseStream);
router.get('/applied',    attachSubscription, getApplied);
router.get('/',           attachSubscription, listJobs);
router.post('/:id/apply', attachSubscription, recordApply);
router.get('/:id',        getJob);

module.exports = router;
