const db = require('../../../config/db');

// Helper to get current user ID
const getCurrentUserId = (req) => {
  return req.user?.id || null;
};

// ✅ GET STATES (WITH OPTIONAL COUNTRY FILTER)
exports.getStates = async (req, res) => {
  try {
    const { countryid } = req.query;

    let query = `
      SELECT 
        S.stateid, 
        S.state_name, 
        S.state_code, 
        S.state_capital, 
        S.countryid, 
        C.country_name, 
        S.status, 
        S.created_by_id, 
        S.created_date, 
        S.updated_by_id, 
        S.updated_date 
      FROM mststatemaster S
      INNER JOIN mstcountrymaster C ON C.countryid = S.countryid
    `;

    let params = [];

    if (countryid) {
      query += " WHERE S.countryid = ?";
      params.push(countryid);
    }

    const [rows] = await db.execute(query, params);

    res.json({
      success: true,
      message: "Data fetched successfully",
      data: rows
    });

  } catch (error) {
    console.error("Error fetching states:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
      error: error.message
    });
  }
};

// ✅ ADD STATE
exports.addState = async (req, res) => {
  try {
    const { state_name, state_code, state_capital, countryid, status } = req.body;

    const created_by_id = getCurrentUserId(req);
    const created_date = new Date();

    const insertQuery = `
      INSERT INTO mststatemaster 
      (state_name, state_code, state_capital, countryid, status, created_by_id, created_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(insertQuery, [
      state_name,
      state_code,
      state_capital,
      countryid,
      status,
      created_by_id,
      created_date
    ]);

    // Fetch country name
    const [countryRows] = await db.execute(
      'SELECT country_name FROM mstcountrymaster WHERE countryid = ?',
      [countryid]
    );

    const country_name = countryRows.length > 0 ? countryRows[0].country_name : null;

    res.status(201).json({
      success: true,
      message: "State added successfully",
      data: {
        stateid: result.insertId,
        state_name,
        state_code,
        state_capital,
        countryid,
        country_name,
        status,
        created_by_id,
        created_date
      }
    });

  } catch (error) {
    console.error("Error adding state:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add state",
      error: error.message
    });
  }
};

// ✅ UPDATE STATE
exports.updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const { state_name, state_code, state_capital, countryid, status } = req.body;

    const updated_by_id = getCurrentUserId(req);
    const updated_date = new Date();

    const updateQuery = `
      UPDATE mststatemaster 
      SET state_name = ?, 
          state_code = ?, 
          state_capital = ?, 
          countryid = ?, 
          status = ?, 
          updated_by_id = ?, 
          updated_date = ?
      WHERE stateid = ?
    `;

    const [result] = await db.execute(updateQuery, [
      state_name,
      state_code,
      state_capital,
      countryid,
      status,
      updated_by_id,
      updated_date,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "State not found"
      });
    }

    // Fetch country name
    const [countryRows] = await db.execute(
      'SELECT country_name FROM mstcountrymaster WHERE countryid = ?',
      [countryid]
    );

    const country_name = countryRows.length > 0 ? countryRows[0].country_name : null;

    res.status(200).json({
      success: true,
      message: "State updated successfully",
      data: {
        stateid: parseInt(id),
        state_name,
        state_code,
        state_capital,
        countryid,
        country_name,
        status,
        updated_by_id,
        updated_date
      }
    });

  } catch (error) {
    console.error("Error updating state:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update state",
      error: error.message
    });
  }
};

// ✅ DELETE STATE
exports.deleteState = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM mststatemaster WHERE stateid = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "State not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "State deleted successfully",
      data: { stateid: parseInt(id) }
    });

  } catch (error) {
    console.error("Error deleting state:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete state",
      error: error.message
    });
  }
};