// backend/routes/hotelRegistrationRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/hotelRegistrationController');

router.get('/', controller.getRegistrations);
router.get('/:id', controller.getRegistrationById);   // NEW
router.post('/', controller.addRegistration);
router.put('/:id', controller.updateRegistration);
router.delete('/:id', controller.deleteRegistration);

module.exports = router;