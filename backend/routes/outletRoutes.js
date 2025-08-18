const express = require('express');
const router = express.Router();
const outletController = require('../controllers/outletController');

router.get('/brands', outletController.getBrands);

// New route for logging outlet statuses
router.get('/log-statuses', outletController.logOutletStatuses);

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

// // Get outlets for dropdown outlet

// router.get('/outlets/dropdown', outletController.getOutletsForDropdown);

module.exports = router; 