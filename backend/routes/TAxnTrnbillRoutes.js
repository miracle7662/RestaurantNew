const express = require('express')
const router = express.Router()
const controller = require('../controllers/TAxnTrnbillControllers')

// Create new bill
router.post('/', controller.createBill)

// Update bill (header fields) or add items (you can reuse update or create a separate add-items if needed)
router.put('/:id', controller.updateBill)

// Get bill by id (with details)
router.get('/:id', controller.getBillById)
router.get('/', controller.getAllBills)

// Settle bill (multiple payment modes supported)
router.post('/:id/settle', controller.settleBill)

module.exports = router



