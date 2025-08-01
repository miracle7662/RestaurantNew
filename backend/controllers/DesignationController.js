const db = require('../config/db');

exports.getDesignation = (req, res) => {
    const Designation = db.prepare('SELECT * FROM mstdesignation').all();
    res.json(Designation);
};

exports.addDesignation = (req, res) => {
    const { Designation, status, created_by_id, created_date  } = req.body;
    const stmt = db.prepare('INSERT INTO mstdesignation (Designation, status, created_by_id, created_date) VALUES (?, ?, ?, ?)');
    const result = stmt.run(Designation, status, created_by_id, created_date);
    res.json({ id: result.lastInsertRowid, Designation, status,created_by_id, created_date});
};

exports.updateDesignation = (req, res) => {
    const { id } = req.params;
    const { Designation, status,updated_by_id,updated_date} = req.body;
    const stmt = db.prepare('UPDATE mstdesignation SET Designation = ?, status = ?,updated_by_id =?,updated_date =? WHERE designationid = ?');
    stmt.run(Designation, status,updated_by_id,updated_date, id);
    res.json({ id, Designation, status,updated_by_id,updated_date});
};

exports.deleteDesignation = (req, res) => {
    const {id} = req.params;
    const stmt = db.prepare('DELETE FROM mstdesignation WHERE designationid = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
};
