// routes/roomTransferRoutes.js
const express = require('express');
const router = express.Router();
const roomTransferController = require('../controllers/roomTransferController');

// POST: Transfer room only
router.post('/transfer', roomTransferController.transferRoom);

module.exports = router;