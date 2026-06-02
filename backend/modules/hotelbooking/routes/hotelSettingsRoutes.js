// routes/hotelSettingsRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/hotelSettingsController');

router.get('/', controller.getUiSettings);
router.post('/', controller.saveUiSettings);
router.post('/reset', controller.resetUiSettings);

module.exports = router;