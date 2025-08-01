const express = require('express');
const router = express.Router();
const outletController = require('../controllers/outletController');

// Get brands/hotels for dropdown
router.get('/brands', outletController.getBrands);

// Get all outlets
router.get('/', outletController.getOutlets);

// Get outlet by ID
router.get('/:id', outletController.getOutletById);

// Add new outlet
router.post('/', outletController.addOutlet);

// Update outlet
router.put('/:id', outletController.updateOutlet);

// Delete outlet
router.delete('/:id', outletController.deleteOutlet);

module.exports = router; 