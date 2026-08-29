// routes/checkoutRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/checkoutController');

// ✅ Saare specific/static routes upar rakho — /:id se pehle
router.get('/bill-preview', controller.getBillPreview);
router.get('/backups', controller.getBackupCheckins);
router.get('/active-orders-check', controller.checkActiveRoomServiceOrders); // ✅ MOVED UP
router.get('/live-data/:hotelid', controller.getLiveData);
router.get('/by-checkin/:checkin_id', controller.getCheckoutByCheckinId);

router.get('/', controller.getCheckouts);

router.post('/perform', controller.performCheckout);
router.put('/rooms/available', controller.makeRoomsVacant);

// ✅ Dynamic /:id route sabse aakhri mein (GET aur DELETE dono)
router.get('/:id', controller.getCheckoutById);
router.delete('/:id', controller.deleteCheckout);

module.exports = router;