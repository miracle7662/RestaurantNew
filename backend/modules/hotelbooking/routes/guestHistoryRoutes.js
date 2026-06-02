// routes/guestHistoryRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/guestHistoryController');

router.get('/:guestId', controller.getGuestHistory);
router.get('/checkout/:checkoutId/full', controller.getFullCheckoutDetails);

module.exports = router;