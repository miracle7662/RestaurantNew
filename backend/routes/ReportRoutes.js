const express = require('express');
const router = express.Router();
const controller = require('../controllers/Reportcontroller');

router.get('/', controller.getReportData);
router.get('/duplicate-bill', controller.getDuplicateBill);

module.exports = router;
