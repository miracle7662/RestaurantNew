// routes/roomRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/roomController');

router.get('/', controller.getRooms);
router.post('/', controller.addRoom);
router.get('/:id', controller.getRoom);
router.put('/:id', controller.updateRoom);
router.delete('/:id', controller.deleteRoom);

module.exports = router;