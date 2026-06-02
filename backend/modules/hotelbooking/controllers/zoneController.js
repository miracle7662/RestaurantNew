const db = require('../../../config/db');

// Helper to get current user ID
const getCurrentUserId = (req) => {
  return req.user?.id || null;
};

// ✅ GET ALL ZONES
exports.getZones = async (req, res) => {
  try {
    const query = `
      SELECT 
        z.zoneid,
        z.zonename,
        z.zonecode,
        z.cityid,
        c.city_name,
        z.description,
        z.status,
        z.created_date,
        z.updated_date
      FROM mstzonemaster z
      LEFT JOIN mstcitymaster c ON c.cityid = z.cityid
    `;

    const [rows] = await db.execute(query);

    res.json({
      success: true,
      message: "Data fetched successfully",
      data: rows
    });

  } catch (error) {
    console.error("Error fetching zones:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
      error: error.message
    });
  }
};

// ✅ ADD ZONE
exports.addZone = async (req, res) => {
  try {
    const { zonename, zonecode, cityid, description, status } = req.body;

    const created_by_id = getCurrentUserId(req);
    const created_date = new Date();

    const insertQuery = `
      INSERT INTO mstzonemaster 
      (zonename, zonecode, cityid, description, status, created_by_id, created_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(insertQuery, [
      zonename,
      zonecode,
      cityid,
      description || null,
      status,
      created_by_id,
      created_date
    ]);

    // Fetch newly created zone
    const [rows] = await db.execute(`
      SELECT 
        z.zoneid,
        z.zonename,
        z.zonecode,
        z.cityid,
        c.city_name,
        z.description,
        z.status,
        z.created_date,
        z.updated_date
      FROM mstzonemaster z
      LEFT JOIN mstcitymaster c ON c.cityid = z.cityid
      WHERE z.zoneid = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: "Zone added successfully",
      data: rows[0]
    });

  } catch (error) {
    console.error("Error adding zone:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add zone",
      error: error.message
    });
  }
};

// ✅ UPDATE ZONE
exports.updateZone = async (req, res) => {
  try {
    const { id } = req.params;
    const { zonename, zonecode, cityid, description, status } = req.body;

    const updated_by_id = getCurrentUserId(req);
    const updated_date = new Date();

    const updateQuery = `
      UPDATE mstzonemaster 
      SET zonename = ?, 
          zonecode = ?, 
          cityid = ?, 
          description = ?, 
          status = ?, 
          updated_by_id = ?, 
          updated_date = ?
      WHERE zoneid = ?
    `;

    const [result] = await db.execute(updateQuery, [
      zonename,
      zonecode,
      cityid,
      description || null,
      status,
      updated_by_id,
      updated_date,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Zone not found"
      });
    }

    // Fetch updated zone
    const [rows] = await db.execute(`
      SELECT 
        z.zoneid,
        z.zonename,
        z.zonecode,
        z.cityid,
        c.city_name,
        z.description,
        z.status,
        z.created_date,
        z.updated_date
      FROM mstzonemaster z
      LEFT JOIN mstcitymaster c ON c.cityid = z.cityid
      WHERE z.zoneid = ?
    `, [id]);

    res.status(200).json({
      success: true,
      message: "Zone updated successfully",
      data: rows[0]
    });

  } catch (error) {
    console.error("Error updating zone:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update zone",
      error: error.message
    });
  }
};

// ✅ DELETE ZONE
exports.deleteZone = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM mstzonemaster WHERE zoneid = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Zone not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Zone deleted successfully",
      data: { zoneid: parseInt(id) }
    });

  } catch (error) {
    console.error("Error deleting zone:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete zone",
      error: error.message
    });
  }
};