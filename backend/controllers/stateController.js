const db = require('../config/db');

// ✅ GET all states
exports.getStates = async (req, res) => {
  try {
    const [states] = await db.query(`
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
      INNER JOIN mstcountrymaster C 
        ON C.countryid = S.countryid
    `);

    res.status(200).json({
      success: true,
      message: "Data fetched successfully",
      data: states
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch states",
      error: error.message
    });
  }
};


// ✅ ADD state
exports.addState = async (req, res) => {
  try {
    const {
      state_name,
      state_code,
      state_capital,
      countryid,
      status,
      created_by_id,
      created_date
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO mststatemaster 
      (state_name, state_code, state_capital, countryid, status, created_by_id, created_date) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [state_name, state_code, state_capital, countryid, status, created_by_id, created_date]
    );

    res.status(200).json({
      success: true,
      message: "State added successfully",
      data: {
        id: result.insertId,
        state_name,
        state_code,
        state_capital,
        countryid,
        status,
        created_by_id,
        created_date
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add state",
      error: error.message
    });
  }
};


// ✅ UPDATE state
exports.updateState = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      state_name,
      state_code,
      state_capital,
      countryid,
      status,
      updated_by_id,
      updated_date
    } = req.body;

    const [result] = await db.query(
      `UPDATE mststatemaster 
       SET state_name = ?, state_code = ?, state_capital = ?, 
           countryid = ?, status = ?, updated_by_id = ?, updated_date = ? 
       WHERE stateid = ?`,
      [state_name, state_code, state_capital, countryid, status, updated_by_id, updated_date, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "State not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "State updated successfully",
      data: {
        id,
        state_name,
        state_code,
        state_capital,
        countryid,
        status,
        updated_by_id,
        updated_date
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update state",
      error: error.message
    });
  }
};


// ✅ DELETE state
exports.deleteState = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
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
      data: { id }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete state",
      error: error.message
    });
  }
};