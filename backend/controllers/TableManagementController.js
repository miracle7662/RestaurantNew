const db = require('../config/db');

exports.getTableManagement = (req, res) => {
    const TableManagement  = db.prepare('SELECT * FROM msttablemanagement ').all();
    res.json(TableManagement );
};

exports.addTableManagement = (req, res) => {
    const { table_name,hotel_name,outlet_name, status, created_by_id, created_date, hotelid, marketid  } = req.body;
    const stmt = db.prepare('INSERT INTO msttablemanagement (table_name,hotel_name,outlet_name, status, created_by_id, created_date, hotelid, marketid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(table_name,hotel_name,outlet_name, status, created_by_id, created_date, hotelid, marketid);
    res.json({ id: result.lastInsertRowid, table_name,hotel_name,outlet_name, status, created_by_id, created_date, hotelid, marketid });
};

exports.updateTableManagement = (req, res) => {
    const { id } = req.params;
    const { table_name,hotel_name,outlet_name, status,updated_by_id,updated_date} = req.body;
    const stmt = db.prepare('UPDATE msttablemanagement SET table_name = ?,hotel_name = ?,outlet_name = ?, status = ?, updated_by_id = ?,updated_date = ? WHERE tablemanagementid = ?');
    stmt.run(table_name,hotel_name,outlet_name, status, updated_by_id,updated_date, id);
    res.json({ id, table_name,hotel_name,outlet_name, status, updated_by_id,updated_date });
};

exports.deleteTableManagement = (req, res) => {
    const {id} = req.params;
    const stmt = db.prepare('DELETE FROM msttablemanagement WHERE tablemanagementid = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
};