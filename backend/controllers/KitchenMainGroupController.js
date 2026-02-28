const db = require('../config/db');

// GET Kitchen Main Groups
exports.getKitchenMainGroup = (req, res) => {
  try {
    const KitchenMainGroup = db.prepare('SELECT * FROM mstkitchenmaingroup').all();

    res.status(200).json({
      success: true,
      message: "Kitchen Main Groups fetched successfully",
      data: KitchenMainGroup,
      error: null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch Kitchen Main Groups",
      data: null,
      error: error.message
    });
  }
};

// ADD Kitchen Main Group
exports.addKitchenMainGroup = (req, res) => {
  try {
    const { Kitchen_main_Group, status, created_by_id, created_date, hotelid, marketid } = req.body;

    const stmt = db.prepare(`
      INSERT INTO mstkitchenmaingroup 
      (Kitchen_main_Group, status, created_by_id, created_date, hotelid, marketid)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(Kitchen_main_Group, status, created_by_id, created_date, hotelid, marketid);

    res.status(201).json({
      success: true,
      message: "Kitchen Main Group added successfully",
      data: { id: result.lastInsertRowid, Kitchen_main_Group, status, created_by_id, created_date, hotelid, marketid },
      error: null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add Kitchen Main Group",
      data: null,
      error: error.message
    });
  }
};

// UPDATE Kitchen Main Group
exports.updateKitchenMainGroup = (req, res) => {
  try {
    const { id } = req.params;
    const { Kitchen_main_Group, status, updated_by_id, updated_date } = req.body;

    const stmt = db.prepare(`
      UPDATE mstkitchenmaingroup
      SET Kitchen_main_Group = ?, status = ?, updated_by_id = ?, updated_date = ?
      WHERE kitchenmaingroupid = ?
    `);

    stmt.run(Kitchen_main_Group, status, updated_by_id, updated_date, id);

    res.status(200).json({
      success: true,
      message: "Kitchen Main Group updated successfully",
      data: { id, Kitchen_main_Group, status, updated_by_id, updated_date },
      error: null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update Kitchen Main Group",
      data: null,
      error: error.message
    });
  }
};

// DELETE Kitchen Main Group
exports.deleteKitchenMainGroup = (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM mstkitchenmaingroup WHERE kitchenmaingroupid = ?');
    stmt.run(id);

    res.status(200).json({
      success: true,
      message: "Kitchen Main Group deleted successfully",
      data: { id },
      error: null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete Kitchen Main Group",
      data: null,
      error: error.message
    });
  }
};