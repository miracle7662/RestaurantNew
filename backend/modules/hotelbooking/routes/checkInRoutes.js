// routes/checkInRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/checkInController');

router.get('/', controller.getCheckins);
router.get('/at-glance', controller.getAtGlance);
router.get("/daily-sales-summary", controller.getDailySalesSummary);
router.get("/daily-sales-summary-report", controller.getDailySalesSummaryReport);
router.get( "/payment-mode-summary", controller.getPaymentModeSummary);
router.get('/active-room-credit', controller.getActiveCheckinsForRoomCredit);
router.post('/', controller.addCheckin);
router.get('/next-reg-number', controller.getNextRegNumber);
router.get('/details/:checkinId', controller.getDetailsByCheckinId);
router.get('/today-checkouts', controller.getTodayCheckouts);
router.get('/:id', controller.getCheckin);
router.put('/:id', controller.updateCheckin);
router.patch('/:id/partial', controller.updatePartialCheckin);
router.post('/:id/extend', controller.extendStay);
router.post('/:checkinId/extend-day', controller.extendDay);
router.delete('/:id', controller.deleteCheckin);

module.exports = router;