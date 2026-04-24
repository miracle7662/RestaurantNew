const mysql = require('mysql2/promise');

// 🌐 Load config from Electron userData (for packaged app)
const fs = require('fs');
const path = require('path');

// Try to load config.json from Electron userData
let configPath;
if (process.env.ELECTRON_USER_DATA_PATH) {
  configPath = path.join(process.env.ELECTRON_USER_DATA_PATH, 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log('✅ Loaded DB config from:', configPath);
      
      // Override env vars for MySQL pool
      process.env.DB_HOST = config.dbHost || process.env.DB_HOST || '192.168.241.207';
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
  host: process.env.DB_HOST || '192.168.241.207',
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

