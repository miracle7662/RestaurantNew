const express = require('express');
const settingsController = require('../controllers/settingsController');
const outletController = require('../controllers/outletController');
const router = express.Router();

// Existing routes
router.put('/bill-preview-settings/:outletid', settingsController.updateBillPreviewSettings);
router.put('/kot-print-settings/:outletid', settingsController.updateKOTPrintSettings);
router.put('/bill-print-settings/:outletid', settingsController.updateBillPrintSettings);
router.put('/general-settings/:outletid', settingsController.updateGeneralSettings);
router.put('/online-order-settings/:outletid', settingsController.updateOnlineOrderSettings);
router.put('/outlet-settings/:outletid', settingsController.updateOutletSettings);

// Add route to get outlet settings
router.get('/outlet-settings/:outletid', outletController.getOutletSettings);
module.exports = router;