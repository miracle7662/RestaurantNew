const db = require('../config/db');

async function addSystemAndLockDatetimeToTrnDayend() {
  try {
    // Add system_datetime and lock_datetime columns to trn_dayend table
    db.exec(`
      ALTER TABLE trn_dayend
      ADD COLUMN system_datetime DATETIME DEFAULT CURRENT_TIMESTAMP
    `);
  } catch (error) {
    if (!error.message.includes('duplicate column name')) {
      console.error('Error adding system_datetime column:', error);
      throw error;
    }
  }

  try {
    db.exec(`
      ALTER TABLE trn_dayend
      ADD COLUMN lock_datetime DATETIME
    `);
  } catch (error) {
    if (!error.message.includes('duplicate column name')) {
      console.error('Error adding lock_datetime column:', error);
      throw error;
    }
  }

  console.log('✅ Added system_datetime and lock_datetime columns to trn_dayend table');
}

addSystemAndLockDatetimeToTrnDayend()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
