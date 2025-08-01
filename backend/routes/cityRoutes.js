const express = require('express');
const router = express.Router();
const controller = require('../controllers/cityController');

router.get('/', controller.getCities);
router.post('/', controller.addCity);
router.put('/:id', controller.updateCity);
router.delete('/:id', controller.deleteCity);

module.exports = router; 