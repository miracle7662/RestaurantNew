const express = require('express');
const router = express.Router();
const controller = require('../controllers/hotelTypeController');

router.get('/', controller.getHotelTypes);
router.post('/', controller.addHotelType);
router.put('/:id', controller.updateHotelType);
router.delete('/:id', controller.deleteHotelType);

module.exports = router;