const db = require('../config/db');

exports.getItemGroup = (req, res) => {
    const ItemGroup = db.prepare('SELECT * FROM mst_Item_Group').all();
    res.json(ItemGroup);
};

exports.addItemGroup = (req, res) => {
    const { itemgroupname,code, kitchencategoryid, status,created_by_id,created_date ,hotelid,marketid} = req.body;
    const stmt = db.prepare('INSERT INTO mst_Item_Group (itemgroupname,code, kitchencategoryid, status, created_by_id, created_date ,hotelid,marketid) VALUES (?, ?,?,? ,?,?,?,?)');
    const result = stmt.run(itemgroupname,code, kitchencategoryid, status,created_by_id,created_date,hotelid,marketid);
    res.json({ id: result.lastInsertRowid, itemgroupname,code, kitchencategoryid, status ,created_by_id, created_date ,hotelid,marketid});
};


exports.updateItemGroup = (req, res) => {
    const { id } = req.params;
    const { itemgroupname,code,kitchencategoryid, status,updated_by_id,updated_date } = req.body;
    const stmt = db.prepare('UPDATE mst_Item_Group SET itemgroupname = ?,code = ?,kitchencategoryid = ?, status = ?, updated_by_id=?,updated_date=? WHERE item_groupid = ?');
    stmt.run(itemgroupname,code,kitchencategoryid, status,updated_by_id,updated_date, id);
    res.json({ id, itemgroupname,code,kitchencategoryid, status,updated_by_id,updated_date });
};



exports.deleteItemGroup = (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM mst_Item_Group WHERE item_groupid = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
};


