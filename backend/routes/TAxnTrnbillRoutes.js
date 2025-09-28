const express = require('express')
const router = express.Router()
const controller = require('../controllers/TAxnTrnbillControllers')

// Create new bill
router.post('/', controller.createBill)

// Generate TxnNo and create bill record
router.post('/generateTxnNo', controller.generateTxnNo)

// Get all bills
router.get('/', controller.getAllBills)

// Specific :id routes must come before the generic /:id route
// Mark bill as billed (simple update)
router.put('/:id/mark-billed', controller.markBillAsBilled);

// Print bill and mark as billed
router.put('/:id/print', controller.printBill);

// Get bill by id (with details)
router.get('/:id', controller.getBillById)

// Settle bill (multiple payment modes supported)
router.post('/:id/settle', controller.settleBill)

// Add items to bill with isBilled and isNCKOT logic
router.post('/:id/items', controller.addItemToBill)

// Update isBilled = 1 for all items in a bill
router.put('/:id/items/billed', controller.updateBillItemsIsBilled)

// Route for next KOT number




// KOT Management Routes
router.post('/kot', controller.createKOT);
router.get('/kots/saved', controller.getSavedKOTs);
router.get('/latest-kot', controller.getLatestKOTForTable);

// Get unbilled items by table
router.get('/unbilled-items/:tableId', controller.getUnbilledItemsByTable);

// F8 Key Press - Reverse Quantity Mode (also handles individual item reverse)
router.post('/reverse-qty', controller.handleF8KeyPress);

// Simple reverse quantity for individual items
router.post('/reverse-quantity', controller.reverseQuantity);

// Get latest billed bill for a table
router.get('/billed-bill/by-table/:tableId', controller.getLatestBilledBillForTable);

// Generic update bill route (must be last of the /:id routes)
router.put('/:id', controller.updateBill)


module.exports = router
