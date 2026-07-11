// routes/checkoutRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/checkoutController');

router.get('/', controller.getCheckouts);
router.get('/bill-preview', controller.getBillPreview);
router.get('/:id', controller.getCheckoutById);
router.get('/by-checkin/:checkin_id', controller.getCheckoutByCheckinId);
router.get('/backups', controller.getBackupCheckins);
router.post('/perform', controller.performCheckout);
router.put("/rooms/available", controller.makeRoomsVacant);
router.delete('/:id', controller.deleteCheckout);


module.exports = router;