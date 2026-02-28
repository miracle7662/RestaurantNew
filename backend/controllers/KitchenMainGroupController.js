const db = require('../config/db');

// GET all Kitchen Main Groups
exports.getKitchenMainGroup = (req, res) => {
  const KitchenMainGroup = db.prepare('SELECT * FROM mstkitchenmaingroup').all();
  res.json({
    success: true,
    message: 'Kitchen Main Groups fetched successfully',
    data: KitchenMainGroup,
    error: null
  });
};

// ADD Kitchen Main Group
exports.addKitchenMainGroup = (req, res) => {
  const { Kitchen_main_Group, status, created_by_id, created_date, hotelid, marketid } = req.body;
  const stmt = db.prepare('INSERT INTO mstkitchenmaingroup (Kitchen_main_Group, status, created_by_id, created_date, hotelid, marketid) VALUES (?, ?, ?, ?, ?, ?)');
  const result = stmt.run(Kitchen_main_Group, status, created_by_id, created_date, hotelid, marketid);

  res.json({
    success: true,
    message: 'Kitchen Main Group added successfully',
    data: { id: result.lastInsertRowid, Kitchen_main_Group, status, created_by_id, created_date, hotelid, marketid },
    error: null
  });
};

// UPDATE Kitchen Main Group
exports.updateKitchenMainGroup = (req, res) => {
  const { id } = req.params;
  const { Kitchen_main_Group, status, updated_by_id, updated_date } = req.body;
  const stmt = db.prepare('UPDATE mstkitchenmaingroup SET Kitchen_main_Group = ?, status = ?, updated_by_id = ?, updated_date = ? WHERE kitchenmaingroupid = ?');
  stmt.run(Kitchen_main_Group, status, updated_by_id, updated_date, id);

  res.json({
    success: true,
    message: 'Kitchen Main Group updated successfully',
    data: { id, Kitchen_main_Group, status, updated_by_id, updated_date },
    error: null
  });
};

// DELETE Kitchen Main Group
exports.deleteKitchenMainGroup = (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM mstkitchenmaingroup WHERE kitchenmaingroupid = ?');
  stmt.run(id);

  res.json({
    success: true,
    message: 'Kitchen Main Group deleted successfully',
    data: { id },
    error: null
  });
};