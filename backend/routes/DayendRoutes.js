const express = require('express');
const router = express.Router();
const Dayendcontroller = require('../controllers/Dayendcontroller');

router.get('/data', Dayendcontroller.getDayendData);
router.post('/dayend-cash-denomination', Dayendcontroller.saveDayEndCashDenomination);
router.post('/save-dayend', Dayendcontroller.saveDayEnd);
router.get('/latest-currdate', Dayendcontroller.getLatestCurrDate);
router.get('/closing-balance', Dayendcontroller.getClosingBalance);
router.get('/check-opening-balance-required', Dayendcontroller.checkOpeningBalanceRequired);
router.post('/save-opening-balance', Dayendcontroller.saveOpeningBalance);
router.post('/generate-report-html', Dayendcontroller.generateDayEndReportHTML);

module.exports = router;
