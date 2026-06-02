const db = require('../../../config/db');

// Helper to get current user ID
const getCurrentUserId = (req) => {
  return req.user?.id || null;
};

// ✅ GET ALL HOTEL TYPES
exports.getHotelTypes = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM msthoteltype');

    res.json({
      success: true,
      message: "Data fetched successfully",
      data: rows
    });

  } catch (error) {
    console.error("Error fetching hotel types:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
      error: error.message
    });
  }
};

// ✅ ADD HOTEL TYPE
exports.addHotelType = async (req, res) => {
  try {
    const { hotel_type, status } = req.body;

    const created_by_id = getCurrentUserId(req);
    const created_date = new Date();

    const query = `
      INSERT INTO msthoteltype 
      (hotel_type, status, created_by_id, created_date)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      hotel_type,
      status,
      created_by_id,
      created_date
    ]);

    res.status(201).json({
      success: true,
      message: "Hotel type added successfully",
      data: {
        hoteltypeid: result.insertId,
        hotel_type,
        status,
        created_by_id,
        created_date
      }
    });

  } catch (error) {
    console.error("Error adding hotel type:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add hotel type",
      error: error.message
    });
  }
};

// ✅ UPDATE HOTEL TYPE
exports.updateHotelType = async (req, res) => {
  try {
    const { id } = req.params;
    const { hotel_type, status } = req.body;

    const updated_by_id = getCurrentUserId(req);
    const updated_date = new Date();

    const query = `
      UPDATE msthoteltype 
      SET hotel_type = ?, 
          status = ?, 
          updated_by_id = ?, 
          updated_date = ?
      WHERE hoteltypeid = ?
    `;

    const [result] = await db.execute(query, [
      hotel_type,
      status,
      updated_by_id,
      updated_date,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Hotel type not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Hotel type updated successfully",
      data: {
        hoteltypeid: parseInt(id),
        hotel_type,
        status,
        updated_by_id,
        updated_date
      }
    });

  } catch (error) {
    console.error("Error updating hotel type:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update hotel type",
      error: error.message
    });
  }
};

// ✅ DELETE HOTEL TYPE
exports.deleteHotelType = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM msthoteltype WHERE hoteltypeid = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Hotel type not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Hotel type deleted successfully",
      data: { hoteltypeid: parseInt(id) }
    });

  } catch (error) {
    console.error("Error deleting hotel type:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete hotel type",
      error: error.message
    });
  }
};