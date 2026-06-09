const router = require('express').Router();
const { adminOnly } = require('../middleware/admin.middleware');
const {
  listPlans, createPlan, updatePlan, deletePlan,
  listUsers, getUserDetail, updateUserSubscription,
  getRevenueSummary, triggerDailyJobSets,
} = require('../controllers/admin.controller');

router.use(adminOnly);

// Plans
router.get('/plans', listPlans);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);

// Users
router.get('/users', listUsers);
router.get('/users/:id', getUserDetail);
router.put('/users/:id/subscription', updateUserSubscription);

// Revenue & ops
router.get('/revenue', getRevenueSummary);
router.post('/jobs/regenerate', triggerDailyJobSets);

module.exports = router;
