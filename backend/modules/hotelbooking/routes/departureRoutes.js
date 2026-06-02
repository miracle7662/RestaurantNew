const express = require('express');
const router = express.Router();
const controller = require('../controllers/departureController');

router.get('/', controller.getDepartures);
router.post('/', controller.addDeparture);

module.exports = router;