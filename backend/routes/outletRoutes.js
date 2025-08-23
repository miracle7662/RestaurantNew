const express = require('express');
const router = express.Router();
const outletController = require('../controllers/outletController');


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

// router.get('/outlet-settings/:outletid', outletController.getOutletSettings);


// // GET route to fetch outlet settings by ID
router.get('/settings/:id/:hotelid', outletController.getOutletSettings);

// PUT route to update outlet settings by ID
router.put('/settings/:id', outletController.updateOutletSettings);// Get outlets for dropdown outlet

// router.get('/outlets/dropdown', outletController.getOutletsForDropdown);

module.exports = router; 