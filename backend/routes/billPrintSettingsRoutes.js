const express = require('express');
const router = express.Router();
const billPrintSettingsController = require('../controllers/billPrintSettingsController');

// Create a new bill print setting
router.post('/', billPrintSettingsController.createBillPrintSetting);

// Get all bill print settings
router.get('/', billPrintSettingsController.getAllBillPrintSettings);

// Get a single bill print setting by ID
router.get('/:id', billPrintSettingsController.getBillPrintSettingById);

// Update a bill print setting by ID
router.put('/:id', billPrintSettingsController.updateBillPrintSetting);

// Delete a bill print setting by ID
router.delete('/:id', billPrintSettingsController.deleteBillPrintSetting);

module.exports = router;