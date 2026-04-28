const mysql = require('mysql2/promise');

// 🌐 Load config from Electron userData (for packaged app)
const fs = require('fs');
const path = require('path');
const os = require('os'); // ✅ NEW

// ✅ Get current machine IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// ✅ Update config.json with latest IP
function updateConfigIP(configPath) {
  try {
    const currentIP = getLocalIP();
    let config = {};

    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    // 🔄 Check & update IP
    if (config.dbHost !== currentIP) {
      console.log('🔄 IP Changed:', config.dbHost, '➡', currentIP);

      config.dbHost = currentIP;

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log('✅ config.json updated with new IP');
    }

    return config;

  } catch (err) {
    console.error('❌ Error updating config:', err.message);
    return {};
  }
}

// Try to load config.json from Electron userData
let configPath;
if (process.env.ELECTRON_USER_DATA_PATH) {
  configPath = path.join(process.env.ELECTRON_USER_DATA_PATH, 'config.json');

  if (fs.existsSync(configPath)) {
    try {
      // ✅ REPLACED (auto update IP + load config)
      const config = updateConfigIP(configPath);

      console.log('✅ Loaded DB config from:', configPath);
      
      // Override env vars for MySQL pool
      process.env.DB_HOST = config.dbHost || process.env.DB_HOST || 'localhost';
      process.env.DB_USER = config.dbUser || process.env.DB_USER || 'root';
      process.env.DB_PASSWORD = config.dbPass || process.env.DB_PASSWORD || 'sharmin';
      process.env.DB_NAME = config.dbName || process.env.DB_NAME || 'restaurant_db';
      process.env.DB_PORT = config.dbPort?.toString() || process.env.DB_PORT || '3306';

    } catch (error) {
      console.error('❌ Failed to load config.json:', error.message);
    }
  } else {
    console.log('ℹ️ No config.json found at:', configPath);
  }
}

// Use env vars (now possibly overridden by config.json)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'sharmin',
  database: process.env.DB_NAME || 'restaurant_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('🗄️ MySQL Config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  hasPassword: !!dbConfig.password
});

const pool = mysql.createPool(dbConfig);
module.exports = pool;