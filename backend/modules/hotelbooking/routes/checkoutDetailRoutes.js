// checkoutDetailRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/checkoutDetailController');

router.get('/', controller.getCheckoutDetails);
router.get('/:id', controller.getCheckoutDetailById);
router.get('/by-checkout/:checkout_id', controller.getCheckoutDetailsByCheckoutId);
router.delete('/:id', controller.deleteCheckoutDetail);

module.exports = router;