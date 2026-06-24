const express = require('express');
const router = express.Router();
const frontdeskSettingsController = require('../controllers/frontdeskSettingsController');

// CRUD Routes
router.post('/', frontdeskSettingsController.createSetting);
router.get('/', frontdeskSettingsController.getAllSettings);
router.put('/:id', frontdeskSettingsController.updateSetting);
router.delete('/:id', frontdeskSettingsController.deleteSetting);

// NEW: Get settings by outlet or hotel
router.get('/outlet/:outletid', frontdeskSettingsController.getSettingByOutlet);
// router.get('/hotel/:hotelid', frontdeskSettingsController.getSettingsByHotel);

module.exports = router;