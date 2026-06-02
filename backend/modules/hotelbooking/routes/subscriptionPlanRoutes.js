const express = require('express');
const router = express.Router();
const controller = require('../controllers/subscriptionPlanController');

router.get('/', controller.getPlans);
router.post('/', controller.addPlan);
router.put('/:id', controller.updatePlan);
router.delete('/:id', controller.deletePlan);

module.exports = router;