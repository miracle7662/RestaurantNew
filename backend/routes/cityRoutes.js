const express = require('express');
const router = express.Router();
const controller = require('../controllers/cityController');

router.get('/', controller.getCities);
router.post('/', controller.addCity);
router.put('/:id', controller.updateCity);
router.delete('/:id', controller.deleteCity);
// routes/cityRoutes.js
router.get('/:stateId', controller.getCitiesByState);


module.exports = router; 