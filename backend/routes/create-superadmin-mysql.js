const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const authController = require('../controllers/authController');

router.get('/create-superadmin', async (req, res) => {
  try {
    await authController.createInitialSuperAdmin();
    res.json({ message: 'SuperAdmin setup complete. Email: superadmin@miracle.com, Password: superadmin123' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

