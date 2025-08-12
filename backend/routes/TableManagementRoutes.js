const express = require('express');
const router = express.Router();
const TableManagementController = require('../controllers/TableManagementController');

// Public routes
router.post('/', TableManagementController.createTableManagement);
router.get('/', TableManagementController.getAllTableManagements);
router.get('/:id', TableManagementController.getTableManagementById);
router.put('/:id', TableManagementController.updateTableManagement);
router.delete('/:id', TableManagementController.deleteTableManagement);
router.get('/hotel/:hotelid', TableManagementController.getTablesByHotel);
router.get('/outlet/:outletid', TableManagementController.getTablesByOutlet);
router.put('/status/bulk', TableManagementController.updateTableStatus);

module.exports = router;
