const db = require('../config/db');

exports.getKitchenCategory = (req, res) => {
    const KitchenCategory = db.prepare('SELECT * FROM mstkitchencategory').all();
    res.json(KitchenCategory);
};


exports.addKitchenCategory = (req, res) => {
    const { Kitchen_Category, alternative_category_name, Description, alternative_category_Description, digital_order_image, categorycolor, status, created_by_id, created_date, hotelid, marketid } = req.body;
    const stmt = db.prepare('INSERT INTO mstkitchencategory (Kitchen_Category, alternative_category_name, Description, alternative_category_Description, digital_order_image, categorycolor, status, created_by_id, created_date ,hotelid, marketid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?,  ?)');
    const result = stmt.run(Kitchen_Category, alternative_category_name, Description, alternative_category_Description, digital_order_image, categorycolor, status, created_by_id, created_date, hotelid, marketid);
    res.json({ id: result.lastInsertRowid, Kitchen_Category, alternative_category_name, Description, alternative_category_Description, digital_order_image, categorycolor, status, created_by_id, created_date, hotelid, marketid });
};


exports.updateKitchenCategory = (req, res) => {
    const { id } = req.params;
    const { Kitchen_Category, alternative_category_name, Description, alternative_category_Description, digital_order_image, categorycolor, status,updated_by_id,updated_date} = req.body;
    const stmt = db.prepare('UPDATE mstkitchencategory SET Kitchen_Category = ?, alternative_category_name = ?, Description = ?, alternative_category_Description = ?, digital_order_image = ?, categorycolor = ?, status = ?, updated_by_id = ?, updated_date = ? WHERE kitchencategoryid = ?');
    stmt.run(Kitchen_Category,alternative_category_name, Description, alternative_category_Description, digital_order_image, categorycolor, status, updated_by_id, updated_date, id);
    res.json({ id, Kitchen_Category, alternative_category_name, Description, alternative_category_Description, digital_order_image, categorycolor, status, updated_by_id, updated_date });
};



exports.deleteKitchenCategory  = (req, res) => {
    const {id} = req.params;
    const stmt = db.prepare('DELETE FROM mstkitchencategory WHERE kitchencategoryid = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
};