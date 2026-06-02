const db = require('../../../config/db');

// Helper to get current user ID
const getCurrentUserId = (req) => {
  return req.user?.id || null;
};

// ✅ GET ALL FEATURES
exports.getFeatures = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM featuremaster');

    res.json({
      success: true,
      message: "Data fetched successfully",
      data: rows
    });

  } catch (error) {
    console.error("Error fetching features:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
      error: error.message
    });
  }
};

// ✅ ADD FEATURE
exports.addFeature = async (req, res) => {
  try {
    const { feature, description, status } = req.body;

    const created_by_id = getCurrentUserId(req);
    const created_date = new Date();

    const query = `
      INSERT INTO featuremaster 
      (feature, description, status, created_by_id, created_date)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      feature,
      description || null,
      status,
      created_by_id,
      created_date
    ]);

    res.status(201).json({
      success: true,
      message: "Feature added successfully",
      data: {
        feature_id: result.insertId,
        feature,
        description,
        status,
        created_by_id,
        created_date
      }
    });

  } catch (error) {
    console.error("Error adding feature:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add feature",
      error: error.message
    });
  }
};

// ✅ UPDATE FEATURE
exports.updateFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const { feature, description, status } = req.body;

    const updated_by_id = getCurrentUserId(req);
    const updated_date = new Date();

    const query = `
      UPDATE featuremaster 
      SET feature = ?, 
          description = ?, 
          status = ?, 
          updated_by_id = ?, 
          updated_date = ?
      WHERE feature_id = ?
    `;

    const [result] = await db.execute(query, [
      feature,
      description || null,
      status,
      updated_by_id,
      updated_date,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Feature not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Feature updated successfully",
      data: {
        feature_id: parseInt(id),
        feature,
        description,
        status,
        updated_by_id,
        updated_date
      }
    });

  } catch (error) {
    console.error("Error updating feature:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update feature",
      error: error.message
    });
  }
};

// ✅ DELETE FEATURE
exports.deleteFeature = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM featuremaster WHERE feature_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Feature not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Feature deleted successfully",
      data: { feature_id: parseInt(id) }
    });

  } catch (error) {
    console.error("Error deleting feature:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete feature",
      error: error.message
    });
  }
};