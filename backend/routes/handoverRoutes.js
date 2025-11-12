const express = require('express');
const router = express.Router();
const handoverController = require('../controllers/handoverController');


// GET /api/handover/data
router.get('/data', handoverController.getHandoverData);

// POST /api/handover/cash-denomination
router.post('/cash-denomination', handoverController.saveCashDenomination);

// POST /api/handover/save
// This is the new route to handle the handover action
router.post('/save', handoverController.saveHandover);

module.exports = router;