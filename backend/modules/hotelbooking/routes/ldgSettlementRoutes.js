const express = require('express');
const router = express.Router();

// Import the controller
const ldgSettlementController = require('../controllers/ldgSettlementController');

// ==================== SPECIFIC ROUTES (MUST BE BEFORE /:id) ====================

// Get settlements by checkout ID
// router.get('/checkout/:checkoutId', ldgSettlementController.getSettlementsByCheckout);

// Get settlement summary by checkout ID
// router.get('/summary/:checkoutId', ldgSettlementController.getSettlementSummary);

// Replace settlements (batch update for editing)
router.put('/replace', ldgSettlementController.replaceSettlement);

// Bulk update settlement status
// router.put('/status', ldgSettlementController.updateSettlementStatus);

// ==================== CRUD ROUTES ====================

// Create settlement
router.post('/', ldgSettlementController.createSettlement);

// List settlements with filters
router.get('/', ldgSettlementController.getSettlements);

// Get single settlement by ID
router.get('/:id', ldgSettlementController.getSettlementById);

// Update settlement
router.put('/:id', ldgSettlementController.updateSettlement);

// Soft delete settlement
router.delete('/:id', ldgSettlementController.deleteSettlement);

// ==================== EXPORT ====================
module.exports = router;