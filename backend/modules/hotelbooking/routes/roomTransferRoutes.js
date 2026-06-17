// routes/roomTransferRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/roomTransferController');

router.post('/transfer-room', controller.transferRoomAndUpdateStayRecords);

module.exports = router;

