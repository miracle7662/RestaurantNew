// routes/billPrintSettingRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/billPrintSettingController');

router.get('/hotel/:hotelId', controller.getByHotelId);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.put('/hotel/:hotelId', controller.updateByHotelId);

module.exports = router;