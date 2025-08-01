const db = require('./config/db');

console.log('🔍 Debugging msthotelmasters API...\n');

try {
    // Check if tables exist
    console.log('1. Checking if tables exist:');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('HotelMasters', 'mstmarkets')").all();
    console.log('   Found tables:', tables.map(t => t.name));
    
    // Check markets table
    console.log('\n2. Checking markets table:');
    const markets = db.prepare('SELECT * FROM mstmarkets LIMIT 5').all();
    console.log('   Markets count:', markets.length);
    console.log('   Sample markets:', markets);
    
    // Check hotelmasters table
    console.log('\n3. Checking hotelmasters table:');
    const hotels = db.prepare('SELECT * FROM HotelMasters LIMIT 5').all();
    console.log('   Hotels count:', hotels.length);
    console.log('   Sample hotels:', hotels);
    
    // Test the actual query
    console.log('\n4. Testing the actual query:');
    try {
        const result = db.prepare('select HotelMasters.Hotelid, HotelMasters.hotel_name,HotelMasters.marketid,HotelMasters.short_name,HotelMasters.phone,HotelMasters.email,HotelMasters.fssai_no, HotelMasters.trn_gstno,HotelMasters.panno,HotelMasters.website,HotelMasters.address,HotelMasters.stateid,HotelMasters.hoteltypeid,HotelMasters.Masteruserid,HotelMasters.status,HotelMasters.created_by_id,HotelMasters.created_date,HotelMasters.updated_by_id,HotelMasters.updated_date,  M.market_name from HotelMasters inner join mstmarkets M on M.marketid=HotelMasters.marketid').all();
        console.log('   Query successful!');
        console.log('   Result count:', result.length);
        console.log('   Sample result:', result[0] || 'No data');
    } catch (error) {
        console.log('   Query failed:', error.message);
    }
    
} catch (error) {
    console.error('❌ Error:', error);
} 