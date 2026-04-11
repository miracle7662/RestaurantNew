const db = require('../config/db');

// ✅ GET all countries
exports.getCountries = async (req, res) => {
  try {
    const [countries] = await db.query('SELECT * FROM mstcountrymaster');

    res.json({
      success: true,
      message: "Data fetched successfully",
      data: countries
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch countries",
      error: error.message
    });
  }
};


// ✅ ADD country
exports.addCountry = async (req, res) => {
  try {
    const {
      country_name,
      country_code,
      country_capital,
      status,
      created_by_id,
      created_date
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO mstcountrymaster 
      (country_name, country_code, country_capital, status, created_by_id, created_date) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [country_name, country_code, country_capital, status, created_by_id, created_date]
    );

    res.status(200).json({
      success: true,
      message: "Country added successfully",
      data: {
        id: result.insertId,
        country_name,
        country_code,
        country_capital,
        status,
        created_by_id,
        created_date
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add country",
      error: error.message
    });
  }
};


// ✅ UPDATE country
exports.updateCountry = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      country_name,
      country_code,
      country_capital,
      status,
      updated_by_id,
      updated_date
    } = req.body;

    const [result] = await db.query(
      `UPDATE mstcountrymaster 
       SET country_name = ?, country_code = ?, country_capital = ?, 
           status = ?, updated_by_id = ?, updated_date = ? 
       WHERE countryid = ?`,
      [country_name, country_code, country_capital, status, updated_by_id, updated_date, id]
    );

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
        id,
        country_name,
        country_code,
        country_capital,
        status,
        updated_by_id,
        updated_date
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update country",
      error: error.message
    });
  }
};


// ✅ DELETE country
exports.deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
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
      data: { id }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete country",
      error: error.message
    });
  }
};