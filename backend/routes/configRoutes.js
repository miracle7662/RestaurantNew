const express = require('express');
const os = require('os');
const router = express.Router();

// 🌐 Get server network info for clients
router.get('/server-info', (req, res) => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  
  res.json({
    port: parseInt(process.env.PORT || '3001'),
    ips: addresses,
    hostname: os.hostname(),
    timestamp: new Date().toISOString(),
    message: 'Multi-machine POS Server Ready'
  });
});

// 🔧 Server status + DB ping
router.get('/status', async (req, res) => {
  try {
    const db = require('../config/db');
    const [result] = await db.execute('SELECT 1 as ping');
    res.json({
      status: 'healthy',
      db: result[0].ping === 1,
      port: parseInt(process.env.PORT || '3001'),
      env: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', db: false, error: error.message });
  }
});

module.exports = router;

