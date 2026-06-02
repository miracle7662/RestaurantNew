const express = require('express');
const router = express.Router();
const controller = require('../controllers/reservationController');

// Important: place next-number before /:id to avoid conflict
router.get('/next-number', controller.getNextReservationNumber);
router.get('/', controller.getReservations);
router.get('/:id', controller.getReservationById);
router.post('/', controller.addReservation);
router.put('/:id', controller.updateReservation);
router.delete('/:id', controller.deleteReservation);

module.exports = router;