const express = require('express');
const router = express.Router();
const controller = require('../controllers/settlementController');

// Remove any authentication middleware or authorization checks here to disable authorization

// Get settlements with filters
router.get('/', controller.getSettlements);

// Update settlement
router.put('/:id', controller.updateSettlement);

// Delete/Reverse settlement
router.delete('/:id', controller.deleteSettlement);

module.exports = router;
