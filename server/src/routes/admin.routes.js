const router = require('express').Router();
const { adminOnly } = require('../middleware/admin.middleware');
const {
  listPlans, createPlan, updatePlan, deletePlan,
  listUsers, getUserDetail, updateUserSubscription, deleteUser,
  getRevenueSummary,
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
router.delete('/users/:id', deleteUser);

// Revenue
router.get('/revenue', getRevenueSummary);

module.exports = router;
