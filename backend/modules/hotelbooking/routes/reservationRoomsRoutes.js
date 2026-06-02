const express = require('express');
const router = express.Router();
const controller = require('../controllers/reservationRoomsController');

router.get('/', controller.getReservationRooms);
router.get('/:id', controller.getReservationRoomById);
router.post('/', controller.addReservationRoom);
router.put('/:id', controller.updateReservationRoom);
router.delete('/:id', controller.deleteReservationRoom);

module.exports = router;