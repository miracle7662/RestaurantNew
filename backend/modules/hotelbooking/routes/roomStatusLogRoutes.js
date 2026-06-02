// routes/roomStatusLogRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/roomStatusLogController');

router.get('/', controller.getRoomStatusLogs);
router.post('/', controller.createRoomStatusLog);
router.get('/room/:roomId', controller.getRoomStatusLogsByRoom);

module.exports = router;