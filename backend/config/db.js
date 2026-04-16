const mysql = require('mysql2/promise');

// 🌐 Multi-machine ready: Use environment variables
const dbConfig = {
  host: process.env.DB_HOST || '192.168.92.51',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restaurant_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);
module.exports = pool;

