const db = require('../config/db');
exports.getCountries = (req, res) => {
    const countries = db.prepare('SELECT * FROM mstcountrymaster').all();
   res.json({success: true, message: "Data fetched successfully", data: countries});
};

exports.addCountry = (req, res) => {
  try {
    const { country_name, country_code, country_capital, status, created_by_id, created_date } = req.body;
    const stmt = db.prepare('INSERT INTO mstcountrymaster (country_name, country_code, country_capital,status,created_by_id,created_date) VALUES (?, ?, ?,?,?,?)');
    const result = stmt.run(country_name, country_code, country_capital, status, created_by_id, created_date);

    res.status(200).json({
      success: true,
      message: "Country added successfully",
      data: { id: result.lastInsertRowid, country_name, country_code, country_capital, status, created_by_id, created_date }
    });
  } catch (error) {
    console.error("Error adding country:", error);
    res.status(500).json({ success: false, message: "Failed to add country", error: error.message });
  }
};
exports.updateCountry = (req, res) => {
  try {
    const { id } = req.params;
    const { country_name, country_code, country_capital, status, updated_by_id, updated_date } = req.body;

    const stmt = db.prepare('UPDATE mstcountrymaster SET country_name = ?, country_code = ?, country_capital = ?, status = ?, updated_by_id = ?, updated_date = ? WHERE countryid = ?');
    const result = stmt.run(country_name, country_code, country_capital, status, updated_by_id, updated_date, id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Country not found" });
    }

    res.status(200).json({
      success: true,
      message: "Country updated successfully",
      data: { id, country_name, country_code, country_capital, status, updated_by_id, updated_date }
    });

  } catch (error) {
    console.error("Error updating country:", error);
    res.status(500).json({ success: false, message: "Failed to update country", error: error.message });
  }
};

exports.deleteCountry = (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM mstcountrymaster WHERE countryid = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Country not found" });
    }

    res.status(200).json({ success: true, message: "Country deleted successfully", data: { id } });

  } catch (error) {
    console.error("Error deleting country:", error);
    res.status(500).json({ success: false, message: "Failed to delete country", error: error.message });
  }
};
