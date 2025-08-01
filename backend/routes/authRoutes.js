const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login route
router.post('/login', authController.login);

// Get current user info
router.get('/me', authController.getCurrentUser);

module.exports = router; 