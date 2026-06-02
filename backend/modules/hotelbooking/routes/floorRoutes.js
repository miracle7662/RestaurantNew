const express = require('express');
const router = express.Router();
const controller = require('../controllers/floorController');

router.get('/', controller.getFloors);
router.post('/', controller.addFloor);
router.put('/:id', controller.updateFloor);
router.delete('/:id', controller.deleteFloor);

module.exports = router;