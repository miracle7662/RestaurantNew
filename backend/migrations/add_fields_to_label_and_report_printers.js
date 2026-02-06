const db = require('../config/db.js');

console.log('Adding fields to label and report printer settings...');

try {
    // Add columns to label_printer_settings
    db.prepare(`ALTER TABLE label_printer_settings ADD COLUMN source TEXT DEFAULT ''`).run();
    db.prepare(`ALTER TABLE label_printer_settings ADD COLUMN order_type TEXT DEFAULT ''`).run();
    db.prepare(`ALTER TABLE label_printer_settings ADD COLUMN size TEXT DEFAULT ''`).run();
    db.prepare(`ALTER TABLE label_printer_settings ADD COLUMN copies INTEGER DEFAULT 1`).run();
    db.prepare(`ALTER TABLE label_printer_settings ADD COLUMN enablePrint BOOLEAN DEFAULT 1`).run();

    // Add columns to report_printer_settings
    db.prepare(`ALTER TABLE report_printer_settings ADD COLUMN source TEXT DEFAULT ''`).run();
    db.prepare(`ALTER TABLE report_printer_settings ADD COLUMN order_type TEXT DEFAULT ''`).run();
    db.prepare(`ALTER TABLE report_printer_settings ADD COLUMN size TEXT DEFAULT ''`).run();
    db.prepare(`ALTER TABLE report_printer_settings ADD COLUMN copies INTEGER DEFAULT 1`).run();
    db.prepare(`ALTER TABLE report_printer_settings ADD COLUMN enablePrint BOOLEAN DEFAULT 1`).run();

    console.log('✅ Fields added successfully!');
} catch (error) {
    console.error('❌ Error adding fields:', error);
} finally {
    db.close();
}
