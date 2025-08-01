const db = require('../config/db');

exports.getKitchenSubCategory = (req, res) => {
    const KitchenSubCategory = db.prepare('SELECT * FROM mstkitchensubcategory').all();
    res.json(KitchenSubCategory);
};

exports.addKitchenSubCategory  = (req, res) => {
    const { Kitchen_sub_category,kitchencategoryid, kitchenmaingroupid,  status, created_by_id, created_date, hotelid, marketid , updated_by_id, updated_date} = req.body;
    const stmt = db.prepare('INSERT INTO mstkitchensubcategory (Kitchen_sub_category,kitchencategoryid, kitchenmaingroupid, status, created_by_id, created_date, hotelid, marketid, updated_by_id, updated_date) VALUES (?, ?, ?, ?, ?, ?, ? ,? ,?, ?)');
    const result = stmt.run(Kitchen_sub_category, kitchencategoryid, kitchenmaingroupid, status, created_by_id, created_date, hotelid, marketid, updated_by_id, updated_date );
    res.json({ id: result.lastInsertRowid, Kitchen_sub_category, kitchencategoryid, kitchenmaingroupid,  status, created_by_id, created_date, hotelid, marketid, updated_by_id, updated_date  });
};

exports.updateKitchenSubCategory = (req, res) => {
    const { id } = req.params;
    const { Kitchen_sub_category,  kitchencategoryid, kitchenmaingroupid, status} = req.body;
    const stmt = db.prepare('UPDATE mstkitchensubcategory  SET Kitchen_sub_category = ?, kitchencategoryid = ?, kitchenmaingroupid = ?, status = ? WHERE kitchensubcategoryid = ?');
    stmt.run(Kitchen_sub_category,  kitchencategoryid, kitchenmaingroupid, status, id);
    res.json({ id, Kitchen_sub_category,  kitchencategoryid, kitchenmaingroupid, status});
};


exports.deleteKitchenSubCategory = (req, res) => {
    const {id} = req.params;
    const stmt = db.prepare('DELETE FROM mstkitchensubcategory WHERE kitchensubcategoryid = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
};
