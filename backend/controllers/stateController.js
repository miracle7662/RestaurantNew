const db = require('../config/db');

exports.getStates = (req, res) => {
  try {
    const states = db.prepare('SELECT S.stateid, S.state_name,S.state_code,S.state_capital,S.countryid,C.country_name,S.status,S.created_by_id,S.created_date,S.updated_by_id,S.updated_date FROM mststatemaster S INNER JOIN mstcountrymaster C ON C.countryid = S.countryid').all();
    res.status(200).json({ success: true, message: "Data fetched successfully", data: states });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch states", error: error.message });
  }
};

exports.addState = (req, res) => {
  try {
    const { state_name, state_code, state_capital, countryid, status, created_by_id, created_date } = req.body;
    const result = db.prepare('INSERT INTO mststatemaster (state_name, state_code, state_capital, countryid, status, created_by_id, created_date) VALUES (?, ?, ?, ?, ?, ?, ?)').run(state_name, state_code, state_capital, countryid, status, created_by_id, created_date);
    res.status(200).json({ success: true, message: "State added successfully", data: { id: result.lastInsertRowid, state_name, state_code, state_capital, countryid, status, created_by_id, created_date } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add state", error: error.message });
  }
};

exports.updateState = (req, res) => {
  try {
    const { id } = req.params;
    const { state_name, state_code, state_capital, countryid, status, updated_by_id, updated_date } = req.body;
    const result = db.prepare('UPDATE mststatemaster SET state_name = ?, state_code = ?, state_capital = ?, countryid = ?, status = ?, updated_by_id = ?, updated_date = ? WHERE stateid = ?').run(state_name, state_code, state_capital, countryid, status, updated_by_id, updated_date, id);
    if (result.changes === 0) return res.status(404).json({ success: false, message: "State not found" });
    res.status(200).json({ success: true, message: "State updated successfully", data: { id, state_name, state_code, state_capital, countryid, status, updated_by_id, updated_date } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update state", error: error.message });
  }
};

exports.deleteState = (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM mststatemaster WHERE stateid = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ success: false, message: "State not found" });
    res.status(200).json({ success: true, message: "State deleted successfully", data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete state", error: error.message });
  }
};