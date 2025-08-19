const express = require('express');
const router = express.Router();
const kotPrintSettingsController = require('../controllers/kotPrintSettingsController');

// Create a new KOT print setting
router.post('/', kotPrintSettingsController.createKotPrintSetting);

// Get all KOT print settings
router.get('/', kotPrintSettingsController.getAllKotPrintSettings);

// Get a single KOT print setting by ID
router.get('/:id', kotPrintSettingsController.getKotPrintSettingById);

// Update a KOT print setting by ID
router.put('/:id', kotPrintSettingsController.updateKotPrintSetting);

// Delete a KOT print setting by ID
router.delete('/:id', kotPrintSettingsController.deleteKotPrintSetting);

module.exports = router;