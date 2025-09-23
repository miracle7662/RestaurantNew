const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Connect to the database
const dbPath = path.join('D:', 'Restaurant_Database', 'miresto.db');
const db = new Database(dbPath);

console.log('🔧 Executing SQL Triggers for Bill Totals Auto-Update...\n');

try {
    // Read the SQL triggers file
    const sqlFilePath = path.join(__dirname, 'bill_totals_triggers.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL script
    db.exec(sqlContent);

    console.log('✅ SQL Triggers executed successfully!');

    // Verify triggers were created
    console.log('\n🔍 Verifying triggers...');
    const triggers = db.prepare(`
        SELECT name, sql
        FROM sqlite_master
        WHERE type='trigger' AND name LIKE 'tr_update_totals%'
    `).all();

    if (triggers.length > 0) {
        console.log('✅ Triggers created successfully:');
        triggers.forEach(trigger => {
            console.log(`   - ${trigger.name}`);
        });
    } else {
        console.log('❌ No triggers found. Something went wrong.');
    }

} catch (error) {
    console.error('❌ Error executing triggers:', error.message);
    console.error('Full error:', error);
} finally {
    db.close();
    console.log('\n📋 Next Steps:');
    console.log('1. The triggers are now active and will automatically update bill totals');
    console.log('2. Test the triggers by adding/updating/deleting items in TAxnTrnbilldetails');
    console.log('3. Check TAxnTrnbill table to verify totals are updated correctly');
}
