const express = require('express');
const router = express.Router();
const controller = require('../controllers/HotelMastersController');
const upload = require('../config/multer');   // your multer config

router.get('/', controller.getHotelMasters);
router.get('/:id', controller.getHotelMastersById);
router.post('/', upload.single('logo'), controller.addHotelMasters);
router.put('/:id', upload.single('logo'), controller.updateHotelMasters);
router.delete('/:id', controller.deleteHotelMasters);

module.exports = router;