// routes/stockRoutes.js - COMPLETE FIXED VERSION
const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

// Stock Items
router.get('/items', stockController.getStockItems);
router.get('/items/:id', stockController.getStockItemById);
router.post('/items', stockController.createStockItem);
router.put('/items/:id', stockController.updateStockItem);
router.delete('/items/:id', stockController.deleteStockItem);

// Purchase
router.post('/purchases', stockController.createPurchase);
router.get('/purchases', stockController.getPurchases);

// Stock Transactions
router.get('/transactions', stockController.getStockTransactions);
router.get('/low-stock', stockController.getLowStockAlerts);

// Room Items
router.get('/room-items', stockController.getRoomIssuedItems);

// Auto assign and process return
router.post('/auto-assign', stockController.autoAssignAmenities);
router.post('/process-return', stockController.processReturnItemsAPI);

// Reports
router.get('/reports/daily-consumption', stockController.getDailyConsumptionReport);
router.get('/reports/stock', stockController.getStockReport);
router.get('/reports/damage', stockController.getDamageReport);

module.exports = router;