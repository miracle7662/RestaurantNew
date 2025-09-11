const db = require('./backend/config/db');

const tables = db.prepare('SELECT tableid, table_name, outletid FROM msttablemanagement WHERE outletid = 19').all();
console.log('Tables with outletid 19:', tables);

const allTables = db.prepare('SELECT tableid, table_name, outletid FROM msttablemanagement LIMIT 10').all();
console.log('First 10 tables:', allTables);
