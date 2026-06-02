// backend/routes/postChargesRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/postChargesController');

// GET /api/post-charges - Get all post charges (with filters)
router.get('/', controller.getPostCharges);

// GET /api/post-charges/:id - Get single post charge by ID
router.get('/:id', controller.getPostChargeById);

// POST /api/post-charges - Add a single charge/allowance
router.post('/', controller.addPostCharge);

// POST /api/post-charges/bulk - Add multiple charges/allowances
router.post('/bulk', controller.addPostChargeBulk);

// POST /api/post-charges/transfer-room - Transfer all charges from old room to new room (Room Transfer)
router.post('/transfer-room', controller.transferPostChargesToRoom);

// POST /api/post-charges/swap-rooms - Swap charges between two rooms (Room Swap)
router.post('/swap-rooms', controller.swapPostChargesBetweenRooms);

// PUT /api/post-charges/:id - Update charge/allowance
router.put('/:id', controller.updatePostCharge);

// DELETE /api/post-charges/:id - Delete charge/allowance
router.delete('/:id', controller.deletePostCharge);

module.exports = router;