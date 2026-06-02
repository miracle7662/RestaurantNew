// checkoutFolioRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/checkoutFolioController');

router.get('/', controller.getCheckoutFolios);
router.get('/:id', controller.getCheckoutFolioById);
router.get('/by-checkout/:checkout_id', controller.getCheckoutFoliosByCheckoutId);
router.delete('/:id', controller.deleteCheckoutFolio);

module.exports = router;