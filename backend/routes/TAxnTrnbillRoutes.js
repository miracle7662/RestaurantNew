const express = require('express')
const router = express.Router()
const controller = require('../controllers/TAxnTrnbillControllers');

// --- Bill & KOT Creation ---
router.post('/', controller.createBill); // Create a new bill record
router.post('/kot', controller.createKOT); // Create or update a KOT, which may create a bill
router.post('/generateTxnNo', controller.generateTxnNo); // Generate TxnNo and create a bill record

// --- Bill & KOT Retrieval ---
router.get('/', controller.getAllBills); // Get all bills (can be filtered)
router.get('/all', controller.getAllBillsForBillingTab); // Optimized for the "Billing" tab
router.get('/by-type/:type', controller.getBillsByType); // Get bills by Order_Type (e.g., "Quick Bill")
router.get('/kots/saved', controller.getSavedKOTs); // Get saved (unbilled) KOTs
router.get('/latest-kot', controller.getLatestKOTForTable); // Get latest KOT for a table
router.get('/unbilled-items/:tableId', controller.getUnbilledItemsByTable); // Get unbilled items for a table
router.get('/billed-bill/by-table/:tableId', controller.getLatestBilledBillForTable); // Get latest billed (but unsettled) bill for a table

// --- Pending Orders (Pickup/Delivery) ---
router.get('/pending-orders', controller.getPendingOrders); // Get pending pickup/delivery orders
router.put('/:id/update', controller.updatePendingOrder); // Update a pending order
router.get('/:id/linked-pending-items', controller.getLinkedPendingItems); // Get linked items for a pending order

// --- Day End ---
router.post('/save', controller.saveDayEnd); // Save day end report

// --- Specific Bill Actions (by TxnID) ---
router.get('/:id', controller.getBillById); // Get a single bill by its TxnID
router.put('/:id', controller.updateBill); // Generic update for a bill
router.delete('/:id', controller.deleteBill); // Delete a bill

// --- Item & Status Updates ---
router.post('/:id/items', controller.addItemToBill); // Add items to an existing bill
router.put('/:id/mark-billed', controller.markBillAsBilled); // Mark a bill and its items as "Billed"
router.put('/:id/print', controller.printBill); // Alias for mark-billed
router.put('/:id/items/billed', controller.updateBillItemsIsBilled); // Mark all items in a bill as "Billed"

// --- Financial Actions ---
router.post('/:id/settle', controller.settleBill); // Settle a bill with payments
router.put('/:id/apply-nckot', controller.applyNCKOT); // Apply NCKOT to an entire bill
router.post('/:id/discount', controller.applyDiscountToBill); // Apply a discount to a bill

// --- Reversal / F8 Actions ---
router.post('/reverse-qty', controller.handleF8KeyPress); // Legacy F8 handler
router.post('/reverse-quantity', controller.reverseQuantity); // Simple reverse quantity for one item

module.exports = router;
