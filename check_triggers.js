const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join('D:', 'Restaurant_Database', 'miresto.db');
const db = new Database(dbPath);

console.log('🔍 Checking all triggers in the database...\n');

try {
    // Check all triggers
    const triggers = db.prepare(`
        SELECT name, sql
        FROM sqlite_master
        WHERE type='trigger'
        ORDER BY name
    `).all();

    if (triggers.length > 0) {
        console.log('✅ Triggers found:');
        triggers.forEach(trigger => {
            console.log(`   - ${trigger.name}`);
            console.log(`     SQL: ${trigger.sql.substring(0, 100)}...`);
            console.log('');
        });
    } else {
        console.log('❌ No triggers found.');
    }

    // Test the new trigger specifically
    console.log('\n🧪 Testing the new trigger (trg_update_bill_amount_after_insert)...');
    const testTrigger = db.prepare(`
        SELECT name, sql
        FROM sqlite_master
        WHERE type='trigger' AND name = 'trg_update_bill_amount_after_insert'
    `).get();

    if (testTrigger) {
        console.log('✅ Your custom trigger is installed!');
        console.log(`   Name: ${testTrigger.name}`);
        console.log(`   SQL Preview: ${testTrigger.sql.substring(0, 150)}...`);
    } else {
        console.log('❌ Your custom trigger was not found. There might be an issue.');
    }

} catch (error) {
    console.error('❌ Error checking triggers:', error.message);
} finally {
    db.close();
    console.log('\n📋 Summary:');
    console.log('- If your trigger is listed above, it has been successfully installed');
    console.log('- The trigger will automatically update bill totals when new items are added');
}
