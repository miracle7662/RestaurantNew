const express = require('express');
const router = express.Router();
const controller = require('../controllers/Reportcontroller');

router.get('/', controller. getReportData);

module.exports = router; 