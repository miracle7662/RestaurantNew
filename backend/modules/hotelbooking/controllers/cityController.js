const db = require('../../../config/db');

// Helper to get current user ID
const getCurrentUserId = (req) => {
  return req.user?.id || null;
};

// ✅ GET ALL CITIES
exports.getCities = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.cityid,
        c.city_name,
        c.city_Code,
        c.stateId,
        s.state_name,
        s.countryid,
        ct.country_name,
        c.iscoastal,
        c.status,
        c.created_by_id,
        c.created_date,
        c.updated_by_id,
        c.updated_date
      FROM mstcitymaster c
      LEFT JOIN mststatemaster s ON s.stateid = c.stateId
      LEFT JOIN mstcountrymaster ct ON ct.countryid = s.countryid
    `;

    const [rows] = await db.execute(query);

    res.json({
      success: true,
      message: "Data fetched successfully",
      data: rows
    });

  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
      error: error.message
    });
  }
};

// ✅ ADD CITY
exports.addCity = async (req, res) => {
  try {
    const { city_name, city_Code, stateId, iscoastal, status } = req.body;

    const created_by_id = getCurrentUserId(req);
    const created_date = new Date();

    const insertQuery = `
      INSERT INTO mstcitymaster 
      (city_name, city_Code, stateId, iscoastal, status, created_by_id, created_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(insertQuery, [
      city_name,
      city_Code,
      stateId,
      iscoastal ? 1 : 0,
      status,
      created_by_id,
      created_date
    ]);

    // Fetch newly created city
    const [rows] = await db.execute(`
      SELECT 
        c.cityid,
        c.city_name,
        c.city_Code,
        c.stateId,
        s.state_name,
        s.countryid,
        ct.country_name,
        c.iscoastal,
        c.status,
        c.created_by_id,
        c.created_date,
        c.updated_by_id,
        c.updated_date
      FROM mstcitymaster c
      LEFT JOIN mststatemaster s ON s.stateid = c.stateId
      LEFT JOIN mstcountrymaster ct ON ct.countryid = s.countryid
      WHERE c.cityid = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: "City added successfully",
      data: rows[0]
    });

  } catch (error) {
    console.error("Error adding city:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add city",
      error: error.message
    });
  }
};

// ✅ UPDATE CITY
exports.updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { city_name, city_Code, stateId, iscoastal, status } = req.body;

    const updated_by_id = getCurrentUserId(req);
    const updated_date = new Date();

    const updateQuery = `
      UPDATE mstcitymaster 
      SET city_name = ?, 
          city_Code = ?, 
          stateId = ?, 
          iscoastal = ?, 
          status = ?, 
          updated_by_id = ?, 
          updated_date = ?
      WHERE cityid = ?
    `;

    const [result] = await db.execute(updateQuery, [
      city_name,
      city_Code,
      stateId,
      iscoastal ? 1 : 0,
      status,
      updated_by_id,
      updated_date,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "City not found"
      });
    }

    // Fetch updated city
    const [rows] = await db.execute(`
      SELECT 
        c.cityid,
        c.city_name,
        c.city_Code,
        c.stateId,
        s.state_name,
        s.countryid,
        ct.country_name,
        c.iscoastal,
        c.status,
        c.created_by_id,
        c.created_date,
        c.updated_by_id,
        c.updated_date
      FROM mstcitymaster c
      LEFT JOIN mststatemaster s ON s.stateid = c.stateId
      LEFT JOIN mstcountrymaster ct ON ct.countryid = s.countryid
      WHERE c.cityid = ?
    `, [id]);

    res.status(200).json({
      success: true,
      message: "City updated successfully",
      data: rows[0]
    });

  } catch (error) {
    console.error("Error updating city:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update city",
      error: error.message
    });
  }
};

// ✅ DELETE CITY
exports.deleteCity = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM mstcitymaster WHERE cityid = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "City not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "City deleted successfully",
      data: { cityid: parseInt(id) }
    });

  } catch (error) {
    console.error("Error deleting city:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete city",
      error: error.message
    });
  }
};