/**
 * SubTableRoutes.js
 * 
 * Routes for dynamic sub-table management
 */

const express = require('express');
const router = express.Router();
const SubTableController = require('../controllers/SubTableController');

// Get all sub-tables for a parent table
router.get('/:parentTableId', SubTableController.getSubTablesByParent);

// Get available sub-tables (status = 0)
router.get('/available/:parentTableId', SubTableController.getAvailableSubTables);

// Get next available sub-table (auto-allocate)
router.get('/next-available/:parentTableId', SubTableController.getNextAvailableSubTable);

// Get sub-table by ID
router.get('/by-id/:id', SubTableController.getSubTableById);

// Get sub-table by name
router.get('/by-name/:tableName', SubTableController.getSubTableByName);

// Create new sub-table
router.post('/', SubTableController.createSubTable);

// Initialize all sub-tables for a parent table
router.post('/initialize/:parentTableId', SubTableController.initializeSubTables);

// Update sub-table status
router.put('/:id/status', SubTableController.updateSubTableStatus);

// Link KOT to sub-table
router.put('/:id/kot', SubTableController.linkKOTToSubTable);

// Release sub-table (reset to available)
router.delete('/:id/release', SubTableController.releaseSubTable);

// Delete sub-table (admin)
router.delete('/:id', SubTableController.deleteSubTable);

module.exports = router;
