const db = require('../config/db');

exports.getKitchenMainGroup = (req, res) => {
    const KitchenMainGroup  = db.prepare('SELECT * FROM mstkitchenmaingroup ').all();
    res.json(KitchenMainGroup );
};


exports.addKitchenMainGroup = (req, res) => {
    const { Kitchen_main_Group, status, created_by_id, created_date, hotelid, marketid  } = req.body;
    const stmt = db.prepare('INSERT INTO mstkitchenmaingroup (Kitchen_main_Group, status, created_by_id, created_date, hotelid, marketid) VALUES (?, ?, ?, ?, ?, ?)');
    const result = stmt.run(Kitchen_main_Group, status, created_by_id, created_date, hotelid, marketid);
    res.json({ id: result.lastInsertRowid, Kitchen_main_Group, status, created_by_id, created_date, hotelid, marketid });
};

exports.updateKitchenMainGroup = (req, res) => {
    const { id } = req.params;
    const { Kitchen_main_Group, status,updated_by_id,updated_date} = req.body;
    const stmt = db.prepare('UPDATE mstkitchenmaingroup SET Kitchen_main_Group = ?, status = ?, updated_by_id = ?,updated_date = ? WHERE kitchenmaingroupid = ?');
    stmt.run(Kitchen_main_Group,status, updated_by_id,updated_date, id);
    res.json({ id, Kitchen_main_Group, status, updated_by_id,updated_date });
};

exports.deleteKitchenMainGroup = (req, res) => {
    const {id} = req.params;
    const stmt = db.prepare('DELETE FROM mstkitchenmaingroup WHERE kitchenmaingroupid = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
};

