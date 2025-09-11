const db = require('./backend/config/db');

const outlets = db.prepare('SELECT outletid, outlet_name FROM mst_outlets LIMIT 10').all();
console.log('Outlets:', outlets);

const kotSettings = db.prepare('SELECT outletid FROM mstkot_print_settings LIMIT 10').all();
console.log('KOT Settings:', kotSettings);
