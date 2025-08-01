const db = require('./config/db');

console.log('🔍 Checking Database Structure...\n');

// Check table names
console.log('📋 Table names:');
const tables = db.prepare('SELECT name FROM sqlite_master WHERE type="table"').all();
tables.forEach(table => console.log('  -', table.name));

console.log('\n🏨 HotelMasters table structure:');
const hotelColumns = db.prepare('PRAGMA table_info(HotelMasters)').all();
hotelColumns.forEach(col => console.log('  -', col.name, '(', col.type, ')'));

console.log('\n👥 mst_users table structure:');
const userColumns = db.prepare('PRAGMA table_info(mst_users)').all();
userColumns.forEach(col => console.log('  -', col.name, '(', col.type, ')'));

console.log('\n🔗 Foreign key constraints for mst_users:');
const fkConstraints = db.prepare('PRAGMA foreign_key_list(mst_users)').all();
fkConstraints.forEach(fk => {
    console.log('  -', fk.from, '->', fk.table + '.' + fk.to);
});

console.log('\n📊 Sample data from HotelMasters:');
const hotels = db.prepare('SELECT Hotelid, hotel_name FROM HotelMasters LIMIT 3').all();
hotels.forEach(hotel => console.log('  - ID:', hotel.Hotelid, 'Name:', hotel.hotel_name));

console.log('\n👤 Sample data from mst_users:');
const users = db.prepare('SELECT userid, username, role_level FROM mst_users LIMIT 3').all();
users.forEach(user => console.log('  - ID:', user.userid, 'Username:', user.username, 'Role:', user.role_level));

db.close(); 