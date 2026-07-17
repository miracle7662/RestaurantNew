const express = require('express');
const router = express.Router();
const controller = require('../controllers/Reportcontroller');

// router.get('/', controller.getReportData);
router.get('/duplicate-bill', controller.getDuplicateBill);
// New dedicated endpoint for daily summary
router.get('/daily-summary', controller.getDailySummary);

module.exports = router;
