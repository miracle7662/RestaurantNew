const db = require('../../../config/db');

// Helper to get current user ID
const getCurrentUserId = (req) => {
  return req.user?.id || null;
};

// ✅ GET ALL HOTEL CATEGORIES
exports.getHotelCategories = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM hotelcategorymaster');

    res.json({
      success: true,
      message: "Data fetched successfully",
      data: rows
    });

  } catch (error) {
    console.error("Error fetching hotel categories:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
      error: error.message
    });
  }
};

// ✅ ADD HOTEL CATEGORY
exports.addHotelCategory = async (req, res) => {
  try {
    const { category_type, status } = req.body;

    const created_by_id = getCurrentUserId(req);
    const created_date = new Date();

    const query = `
      INSERT INTO hotelcategorymaster 
      (category_type, status, created_by_id, created_date)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      category_type,
      status,
      created_by_id,
      created_date
    ]);

    res.status(201).json({
      success: true,
      message: "Hotel category added successfully",
      data: {
        hotelcategoryid: result.insertId,
        category_type,
        status,
        created_by_id,
        created_date
      }
    });

  } catch (error) {
    console.error("Error adding hotel category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add hotel category",
      error: error.message
    });
  }
};

// ✅ UPDATE HOTEL CATEGORY
exports.updateHotelCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_type, status } = req.body;

    const updated_by_id = getCurrentUserId(req);
    const updated_date = new Date();

    const query = `
      UPDATE hotelcategorymaster 
      SET category_type = ?, 
          status = ?, 
          updated_by_id = ?, 
          updated_date = ?
      WHERE hotelcategoryid = ?
    `;

    const [result] = await db.execute(query, [
      category_type,
      status,
      updated_by_id,
      updated_date,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Hotel category not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Hotel category updated successfully",
      data: {
        hotelcategoryid: parseInt(id),
        category_type,
        status,
        updated_by_id,
        updated_date
      }
    });

  } catch (error) {
    console.error("Error updating hotel category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update hotel category",
      error: error.message
    });
  }
};

// ✅ DELETE HOTEL CATEGORY
exports.deleteHotelCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM hotelcategorymaster WHERE hotelcategoryid = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Hotel category not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Hotel category deleted successfully",
      data: { hotelcategoryid: parseInt(id) }
    });

  } catch (error) {
    console.error("Error deleting hotel category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete hotel category",
      error: error.message
    });
  }
};