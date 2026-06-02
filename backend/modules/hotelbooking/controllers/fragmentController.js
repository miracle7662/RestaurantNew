const db = require('../../../config/db');

// Helper (kept for consistency)
const getCurrentUserId = (req) => {
  return req.user?.id || null;
};

// ✅ GET ALL FRAGMENTS
exports.getFragments = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM fragmentmaster');

    res.json({
      success: true,
      message: "Data fetched successfully",
      data: rows
    });

  } catch (error) {
    console.error("Error fetching fragments:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
      error: error.message
    });
  }
};

// ✅ ADD FRAGMENT
exports.addFragment = async (req, res) => {
  try {
    const { name, status } = req.body;

    const created_date = new Date();

    const query = `
      INSERT INTO fragmentmaster 
      (name, status, created_date)
      VALUES (?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      name,
      status,
      created_date
    ]);

    res.status(201).json({
      success: true,
      message: "Fragment added successfully",
      data: {
        fragment_id: result.insertId,
        name,
        status,
        created_date
      }
    });

  } catch (error) {
    console.error("Error adding fragment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add fragment",
      error: error.message
    });
  }
};

// ✅ UPDATE FRAGMENT
exports.updateFragment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const updated_date = new Date();

    const query = `
      UPDATE fragmentmaster 
      SET name = ?, status = ?, updated_date = ?
      WHERE fragment_id = ?
    `;

    const [result] = await db.execute(query, [
      name,
      status,
      updated_date,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Fragment not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Fragment updated successfully",
      data: {
        fragment_id: parseInt(id),
        name,
        status,
        updated_date
      }
    });

  } catch (error) {
    console.error("Error updating fragment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update fragment",
      error: error.message
    });
  }
};

// ✅ DELETE FRAGMENT
exports.deleteFragment = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM fragmentmaster WHERE fragment_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Fragment not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Fragment deleted successfully",
      data: { fragment_id: parseInt(id) }
    });

  } catch (error) {
    console.error("Error deleting fragment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete fragment",
      error: error.message
    });
  }
};