const pool = require('./backend/config/db.js');
console.log('DB pool loaded successfully');

pool.execute('SELECT 1')
  .then(([rows]) => {
    console.log('DB CONNECT SUCCESS:', rows[0]);
    process.exit(0);
  })
  .catch(err => {
    console.error('DB CONNECT ERROR:', err.message);
    process.exit(1);
  });

