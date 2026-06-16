const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { attachSubscription } = require('../middleware/subscription.middleware');
const { listJobs, getJob, sseStream, getJobCount, getWeekTotal } = require('../controllers/jobs.controller');
const { recordApply, getApplied } = require('../controllers/apply.controller');

router.get('/counts',     getJobCount);  // public — total marketplace count
router.get('/week-total', getWeekTotal); // public — week filtered count

router.use(protect);
router.get('/sse',        attachSubscription, sseStream);
router.get('/applied',    attachSubscription, getApplied);
router.get('/',           attachSubscription, listJobs);
router.post('/:id/apply', attachSubscription, recordApply);
router.get('/:id',        getJob);

module.exports = router;
