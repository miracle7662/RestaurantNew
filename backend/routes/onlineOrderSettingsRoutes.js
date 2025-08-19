const express = require('express');
const router = express.Router();
const onlineOrderSettingsController = require('../controllers/onlineOrderSettingsController');

// Create a new online order setting
router.post('/', onlineOrderSettingsController.createOnlineOrderSetting);

// Get all online order settings
router.get('/', onlineOrderSettingsController.getAllOnlineOrderSettings);

// Get a single online order setting by ID
router.get('/:id', onlineOrderSettingsController.getOnlineOrderSettingById);

// Update a online order setting by ID
router.put('/:id', onlineOrderSettingsController.updateOnlineOrderSetting);

// Delete a online order setting by ID
router.delete('/:id', onlineOrderSettingsController.deleteOnlineOrderSetting);

module.exports = router;