const router = require('express').Router();
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const { attachSubscription } = require('../middleware/subscription.middleware');
const { listJobs, getJob, sseStream, getJobCount, getWeekTotal } = require('../controllers/jobs.controller');
const { recordApply, getApplied } = require('../controllers/apply.controller');

router.get('/counts',     optionalAuth, getJobCount);  // public — total marketplace count, region-aware if logged in
router.get('/week-total', optionalAuth, getWeekTotal); // public — week filtered count, region-aware if logged in

router.use(protect);
router.get('/sse',        attachSubscription, sseStream);
router.get('/applied',    attachSubscription, getApplied);
router.get('/',           attachSubscription, listJobs);
router.post('/:id/apply', attachSubscription, recordApply);
router.get('/:id',        getJob);

module.exports = router;
