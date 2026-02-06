const db = require('../config/db.js');

console.log('Adding user column to printer settings tables...');

try {
    // Add user column to kot_printer_settings
    db.exec(`ALTER TABLE kot_printer_settings ADD COLUMN user_id INTEGER`);

    // Add user column to bill_printer_settings
    db.exec(`ALTER TABLE bill_printer_settings ADD COLUMN user_id INTEGER`);

    console.log('✅ User column added to printer settings tables successfully!');
} catch (error) {
    console.error('❌ Error adding user column:', error);
} finally {
    db.close();
}
