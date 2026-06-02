const express = require('express');
const router = express.Router();
const controller = require('../controllers/reservationBookedByController');

router.get('/', controller.getReservationBookedBy);
router.post('/', controller.addReservationBookedBy);
router.delete('/:id', controller.deleteReservationBookedBy);

module.exports = router;