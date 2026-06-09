// routes/checkInRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/checkInController');

router.get('/', controller.getCheckins);
router.post('/', controller.addCheckin);
router.get('/next-reg-number', controller.getNextRegNumber);
router.get('/details/:checkinId', controller.getDetailsByCheckinId);
router.get('/today-checkouts', controller.getTodayCheckouts);
router.get('/:id', controller.getCheckin);
router.put('/:id', controller.updateCheckin);
router.patch('/:id/partial', controller.updatePartialCheckin);
router.post('/:id/extend', controller.extendStay);
router.delete('/:id', controller.deleteCheckin);

module.exports = router;