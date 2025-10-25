const express = require('express');
const router = express.Router();
const handoverController = require('../controllers/handoverController');

router.get('/data', handoverController.getHandoverData);
router.post('/cash-denomination', handoverController.saveCashDenomination);
router.post('/dayend-cash-denomination', handoverController.saveDayEndCashDenomination);

module.exports = router;
