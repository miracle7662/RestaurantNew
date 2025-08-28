const Database = require('better-sqlite3');
const db = new Database('D:\\Restaurant_Database\\miresto.db');

const query = `
    SELECT u.*                
    FROM mst_users u
    WHERE (u.role_level = 'outlet_user' OR u.role_level = 'hotel_admin')
    AND u.hotelid = ?
    GROUP BY u.userid 
    ORDER BY CASE WHEN u.role_level = 'hotel_admin' THEN 0 ELSE 1 END, u.created_date DESC
`;

const params = [19];

console.log('Query:', query);
console.log('Params:', params);

try {
    const users = db.prepare(query).all(...params);
    console.log('Results:', users);
} catch (error) {
    console.error('Error:', error.message);
}
