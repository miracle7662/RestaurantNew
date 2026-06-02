const express = require('express');
const router = express.Router();
const controller = require('../controllers/hotelCategoryController');

router.get('/', controller.getHotelCategories);
router.post('/', controller.addHotelCategory);
router.put('/:id', controller.updateHotelCategory);
router.delete('/:id', controller.deleteHotelCategory);

module.exports = router;