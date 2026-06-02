const express = require('express');
const router = express.Router();
const controller = require('../controllers/taxController');

router.get('/', controller.getHotelTaxes);
router.post('/', controller.addHotelTax);
router.put('/:id', controller.updateHotelTax);
router.delete('/:id', controller.deleteHotelTax);

module.exports = router;