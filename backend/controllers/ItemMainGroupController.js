const db = require('../config/db');

exports.getItemMainGroup = (req, res) => {
    const Item_Main_Group = db.prepare('SELECT * FROM mst_Item_Main_Group').all();
    res.json(Item_Main_Group);
};

exports.addItemMainGroup = (req, res) => {
    const { item_group_name, status,created_by_id,created_date ,hotelid,marketid} = req.body;
    const stmt = db.prepare('INSERT INTO mst_Item_Main_Group (item_group_name, status, created_by_id, created_date ,hotelid,marketid) VALUES (?, ?,?,? ,?,?)');
    const result = stmt.run(item_group_name, status,created_by_id,created_date,hotelid,marketid);
    res.json({ id: result.lastInsertRowid, item_group_name, status ,created_by_id, created_date ,hotelid,marketid});
};

exports.updateItemMainGroup = (req, res) => {
    const { id } = req.params;
    const { item_group_name, status,updated_by_id,updated_date } = req.body;
    const stmt = db.prepare('UPDATE mst_Item_Main_Group SET item_group_name = ?, status = ?, updated_by_id=?,updated_date=? WHERE item_maingroupid = ?');
    stmt.run(item_group_name, status,updated_by_id,updated_date, id);
    res.json({ id, item_group_name, status,updated_by_id,updated_date });
};

exports.deleteItemMainGroup = (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM mst_Item_Main_Group WHERE item_maingroupid = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
};