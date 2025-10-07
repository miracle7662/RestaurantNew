const express = require('express');
const router = express.Router();
const handoverController = require('../controllers/handoverController');

router.get('/data', handoverController.getHandoverData);
router.post('/cash-denomination', handoverController.saveCashDenomination);

module.exports = router;
