const express = require('express');
const router = express.Router();
const controller = require('../controllers/purposeController');

router.get('/', controller.getPurposes);
router.post('/', controller.addPurpose);

module.exports = router;