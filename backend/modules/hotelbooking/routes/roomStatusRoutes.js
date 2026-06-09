// routes/roomStatusRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/roomStatusController');

router.get('/', controller.getRoomStatuses);
router.post('/', controller.addRoomStatus);
router.get('/:id', controller.getRoomStatus);
router.put('/:id', controller.updateRoomStatus);
router.delete('/:id', controller.deleteRoomStatus);

module.exports = router;