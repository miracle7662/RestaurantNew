const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login route
router.post('/login', authController.login);

// Get current user info
router.get('/me', authController.getCurrentUser);

// Verify password for F8 action on billed tables
router.post('/verify-f8-password', authController.verifyF8Password);

module.exports = router;
