const express = require('express');
const settingsController = require('../controllers/settingsController');
const router = express.Router();

// Existing routes
router.get('/bill-preview-settings/:outletId', settingsController.getBillPreviewSettings);
router.put('/bill-preview-settings/:outletId', settingsController.updateBillPreviewSettings);
router.get('/kot-print-settings/:outletId', settingsController.getKOTPrintSettings);
router.put('/kot-print-settings/:outletId', settingsController.updateKOTPrintSettings);
router.get('/bill-print-settings/:outletId', settingsController.getBillPrintSettings);
router.put('/bill-print-settings/:outletId', settingsController.updateBillPrintSettings);
router.get('/general-settings/:outletId', settingsController.getGeneralSettings);
router.put('/general-settings/:outletId', settingsController.updateGeneralSettings);
router.get('/online-order-settings/:outletId', settingsController.getOnlineOrderSettings);
router.put('/online-order-settings/:outletId', settingsController.updateOnlineOrderSettings);

// New outlet settings routes
router.get('/outlet-settings/:outletId', settingsController.getOutletSettings);
router.put('/outlet-settings/:outletId', settingsController.updateOutletSettings);

module.exports = router;