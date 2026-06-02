const db = require('../../../config/db');
const healthCheck = (req, res) => {
  db.get('SELECT 1 AS result', (err, row) => {
    if (err) {
      console.error('Health check failed:', err.message);
      return res.status(500).json({
        status: 'error',
        message: 'Database connection failed'
      });
    }

    res.json({
      status: 'ok',
      database: row?.result === 1
    });
  });
};

module.exports = { healthCheck };
