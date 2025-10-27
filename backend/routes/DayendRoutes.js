const express = require('express');
const router = express.Router();
const Dayendcontroller = require('../controllers/Dayendcontroller');

router.get('/data', Dayendcontroller.getDayendData);
router.post('/dayend-cash-denomination', Dayendcontroller.saveDayEndCashDenomination);
router.post('/save-dayend', Dayendcontroller.saveDayEnd);

module.exports = router;
