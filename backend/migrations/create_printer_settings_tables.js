const db = require('../config/db.js');

console.log('Creating printer settings tables...');

try {
    // KOT Printer Settings
    db.prepare(`
        CREATE TABLE IF NOT EXISTS kot_printer_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            printer_name TEXT NOT NULL,
            source TEXT NOT NULL,
            order_type TEXT NOT NULL,
            size TEXT NOT NULL,
            copies INTEGER NOT NULL,
            outlet_id INTEGER NOT NULL,
            enableKotPrint BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Bill Printer Settings
    db.prepare(`
        CREATE TABLE IF NOT EXISTS bill_printer_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            printer_name TEXT NOT NULL,
            source TEXT NOT NULL,
            order_type TEXT NOT NULL,
            size TEXT NOT NULL,
            copies INTEGER NOT NULL,
            outlet_id INTEGER NOT NULL,
            enableBillPrint BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Table-wise KOT Printer
    db.prepare(`
        CREATE TABLE IF NOT EXISTS table_wise_kot_printer (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_no TEXT NOT NULL,
            printer_name TEXT NOT NULL,
            size TEXT NOT NULL,
            source TEXT NOT NULL,
            copies INTEGER NOT NULL,
            outlet_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Table-wise Bill Printer
    db.prepare(`
        CREATE TABLE IF NOT EXISTS table_wise_bill_printer (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_no TEXT NOT NULL,
            printer_name TEXT NOT NULL,
            size TEXT NOT NULL,
            source TEXT NOT NULL,
            copies INTEGER NOT NULL,
            outlet_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Category-wise Printer
    db.prepare(`
        CREATE TABLE IF NOT EXISTS category_wise_printer (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            printer_name TEXT NOT NULL,
            order_type TEXT NOT NULL,
            size TEXT NOT NULL,
            source TEXT NOT NULL,
            copies INTEGER NOT NULL,
            outlet_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Department-wise Printer
    db.prepare(`
        CREATE TABLE IF NOT EXISTS department_wise_printer (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            department TEXT NOT NULL,
            printer_name TEXT NOT NULL,
            order_type TEXT NOT NULL,
            size TEXT NOT NULL,
            source TEXT NOT NULL,
            copies INTEGER NOT NULL,
            outlet_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Label Printer Settings
    db.prepare(`
        CREATE TABLE IF NOT EXISTS label_printer_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            printer_name TEXT NOT NULL,
            paper_width INTEGER NOT NULL,
            is_enabled BOOLEAN DEFAULT 1,
            outlet_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Report Printer Settings
    db.prepare(`
        CREATE TABLE IF NOT EXISTS report_printer_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            printer_name TEXT NOT NULL,
            paper_size TEXT NOT NULL,
            auto_print BOOLEAN DEFAULT 0,
            outlet_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // KDS Department User
    db.prepare(`
        CREATE TABLE IF NOT EXISTS kds_department_user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            department TEXT NOT NULL,
            user TEXT NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            outlet_id INTEGER NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    console.log('✅ All printer settings tables created successfully!');
} catch (error) {
    console.error('❌ Error creating printer settings tables:', error);
} finally {
    db.close();
}
