const db = require('../../../config/db');

// Helper to get current user ID
const getCurrentUserId = (req) => {
  return req.user?.id || null;
};

// ✅ GET ALL COUNTRIES
exports.getCountries = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM mstcountrymaster');

    res.json({
      success: true,
      message: "Data fetched successfully",
      data: rows
    });
  } catch (error) {
    console.error("Error fetching countries:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
      error: error.message
    });
  }
};

// ✅ ADD COUNTRY
exports.addCountry = async (req, res) => {
  try {
    const { country_name, country_code, country_capital, status } = req.body;

    const created_by_id = getCurrentUserId(req);
    const created_date = new Date();

    const query = `
      INSERT INTO mstcountrymaster 
      (country_name, country_code, country_capital, status, created_by_id, created_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      country_name,
      country_code,
      country_capital,
      status,
      created_by_id,
      created_date
    ]);

    res.status(201).json({
      success: true,
      message: "Country added successfully",
      data: {
        countryid: result.insertId,
        country_name,
        country_code,
        country_capital,
        status,
        created_by_id,
        created_date
      }
    });

  } catch (error) {
    console.error("Error adding country:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add country",
      error: error.message
    });
  }
};

// ✅ UPDATE COUNTRY
exports.updateCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const { country_name, country_code, country_capital, status } = req.body;

    const updated_by_id = getCurrentUserId(req);
    const updated_date = new Date();

    const query = `
      UPDATE mstcountrymaster 
      SET country_name = ?, 
          country_code = ?, 
          country_capital = ?, 
          status = ?, 
          updated_by_id = ?, 
          updated_date = ?
      WHERE countryid = ?
    `;

    const [result] = await db.execute(query, [
      country_name,
      country_code,
      country_capital,
      status,
      updated_by_id,
      updated_date,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Country not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Country updated successfully",
      data: {
        countryid: parseInt(id),
        country_name,
        country_code,
        country_capital,
        status,
        updated_by_id,
        updated_date
      }
    });

  } catch (error) {
    console.error("Error updating country:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update country",
      error: error.message
    });
  }
};

// ✅ DELETE COUNTRY
exports.deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM mstcountrymaster WHERE countryid = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Country not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Country deleted successfully",
      data: { countryid: parseInt(id) }
    });

  } catch (error) {
    console.error("Error deleting country:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete country",
      error: error.message
    });
  }
};