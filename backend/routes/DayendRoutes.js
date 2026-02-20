const express = require('express');
const router = express.Router();
const Dayendcontroller = require('../controllers/Dayendcontroller');

router.get('/data', Dayendcontroller.getDayendData);
router.post('/dayend-cash-denomination', Dayendcontroller.saveDayEndCashDenomination);
router.post('/save-dayend', Dayendcontroller.saveDayEnd);
router.get('/latest-currdate', Dayendcontroller.getLatestCurrDate);
router.get('/closing-balance', Dayendcontroller.getClosingBalance);
router.post('/generate-report-html', Dayendcontroller.generateDayEndReportHTML);

module.exports = router;
