// checkInRoutes.js - Complete updated with partial update route

const express = require('express');
const router = express.Router();
const controller = require('../controllers/checkInController');

router.get('/next-reg-number', controller.getNextRegNumber);
router.get('/', controller.getCheckins);
router.get('/today-checkouts', controller.getTodayCheckouts);
router.get('/:id', controller.getCheckinById);
router.get('/extension/:id', controller.getCheckinByIdForExtension);
router.get('/details/:checkin_id', controller.getDetailsByCheckinId);
router.post('/', controller.addCheckin);
router.put('/:id', controller.updateCheckin);
router.patch('/:id/partial', controller.updateCheckinPartial);

// Full extend stay (affects all rooms under checkin_id)
router.post('/:id/extend', controller.extendCheckinStay);
router.delete('/:id', controller.deleteCheckin);

module.exports = router;