const express = require('express');
const router = express.Router();
const generalSettingsController = require('../controllers/generalSettingsController');

// Create a new general setting
router.post('/', generalSettingsController.createGeneralSetting);

// Get all general settings
router.get('/', generalSettingsController.getAllGeneralSettings);

// Get a single general setting by ID
router.get('/:id', generalSettingsController.getGeneralSettingById);

// Update a general setting by ID
router.put('/:id', generalSettingsController.updateGeneralSetting);

// Delete a general setting by ID
router.delete('/:id', generalSettingsController.deleteGeneralSetting);

module.exports = router;