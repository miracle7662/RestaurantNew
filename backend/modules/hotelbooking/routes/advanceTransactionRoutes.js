// backend/routes/advanceTransactionRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/advanceTransactionController');

// GET routes
router.get('/', controller.getAdvanceTransactions);
router.get('/summary/:checkinId', controller.getAdvanceSummary);
router.get('/summary/:checkinId/room/:roomId', controller.getAdvanceSummaryForRoom);
router.get('/available/:checkinId', controller.getAvailableAdvance);
router.get('/:id', controller.getAdvanceTransactionById);

// POST routes
router.post('/', controller.addAdvanceTransaction);
router.post('/transfer-room', controller.transferAdvanceToRoom);
router.post('/swap-rooms', controller.swapAdvanceBetweenRooms);

// PUT routes
router.put('/:id', controller.updateAdvanceTransaction);

// DELETE routes
router.delete('/:id', controller.deleteAdvanceTransaction);

module.exports = router;