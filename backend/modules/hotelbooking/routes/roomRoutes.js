// routes/roomRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/roomController');

router.get("/checkin-full-details", controller.getCheckinFullDetails);
//router.get('/', controller.getRooms);
 //router.get('/', controller.getRooms);
router.get('/hotelbooking-meta', controller.getHotelBookingMeta);
router.get('/live-room-availability',controller.getLiveRoomAvailability);
router.post('/', controller.addRoom);

router.get('/:id', controller.getRoom);
router.put('/:id', controller.updateRoom);
router.put('/:id/status', controller.updateRoomStatus);

router.delete('/:id', controller.deleteRoom);

router.post('/change-room-category', controller.changeRoomCategory);


module.exports = router;