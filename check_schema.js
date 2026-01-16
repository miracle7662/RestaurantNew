const db = require('./backend/config/db');

const schema = db.prepare("PRAGMA table_info(TrnSettlementLog)").all();

console.log('TrnSettlementLog schema:');
console.log(schema);
