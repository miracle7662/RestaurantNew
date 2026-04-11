const db = require('../config/db');

// GET all Kitchen Main Groups
exports.getKitchenMainGroup = async (req, res) => {
  try {
    const [KitchenMainGroup] = await db.query('SELECT * FROM mstkitchenmaingroup');

    res.json({
      success: true,
      message: 'Kitchen Main Groups fetched successfully',
      data: KitchenMainGroup,
      error: null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Kitchen Main Groups',
      data: null,
      error: error.message
    });
  }
};


// ADD Kitchen Main Group
exports.addKitchenMainGroup = async (req, res) => {
  try {
    const { Kitchen_main_Group, status, created_by_id, created_date, hotelid, marketid } = req.body;

    const [result] = await db.query(
      `INSERT INTO mstkitchenmaingroup 
       (Kitchen_main_Group, status, created_by_id, created_date, hotelid, marketid) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [Kitchen_main_Group, status, created_by_id, created_date, hotelid, marketid]
    );

    res.json({
      success: true,
      message: 'Kitchen Main Group added successfully',
      data: {
        id: result.insertId,
        Kitchen_main_Group,
        status,
        created_by_id,
        created_date,
        hotelid,
        marketid
      },
      error: null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add Kitchen Main Group',
      data: null,
      error: error.message
    });
  }
};


// UPDATE Kitchen Main Group
exports.updateKitchenMainGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { Kitchen_main_Group, status, updated_by_id, updated_date } = req.body;

    const [result] = await db.query(
      `UPDATE mstkitchenmaingroup 
       SET Kitchen_main_Group = ?, status = ?, updated_by_id = ?, updated_date = ? 
       WHERE kitchenmaingroupid = ?`,
      [Kitchen_main_Group, status, updated_by_id, updated_date, id]
    );

    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: 'Kitchen Main Group not found',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Kitchen Main Group updated successfully',
      data: { id, Kitchen_main_Group, status, updated_by_id, updated_date },
      error: null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update Kitchen Main Group',
      data: null,
      error: error.message
    });
  }
};


// DELETE Kitchen Main Group
exports.deleteKitchenMainGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM mstkitchenmaingroup WHERE kitchenmaingroupid = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: 'Kitchen Main Group not found',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Kitchen Main Group deleted successfully',
      data: { id },
      error: null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete Kitchen Main Group',
      data: null,
      error: error.message
    });
  }
};