const express = require('express');
const router = express.Router();
const ldgSettlementController = require('../controllers/ldgSettlementController');

router.post('/', ldgSettlementController.createSettlement);          // Create
router.get('/', ldgSettlementController.getSettlements);             // List with filters
router.get('/:id', ldgSettlementController.getSettlementById);       // Single
router.put('/:id', ldgSettlementController.updateSettlement);        // Update (with log)
router.delete('/:id', ldgSettlementController.deleteSettlement);     // Soft delete (isSettled=0)
router.post('/replace', ldgSettlementController.replaceSettlement);  // Batch replace by OrderNo/TxnNo

module.exports = router;