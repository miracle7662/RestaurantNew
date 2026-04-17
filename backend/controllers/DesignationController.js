const db = require('../config/db');
const { formatMySQLDate } = require('../utils/dateUtils');

// GET ALL
exports.getDesignation = async (req, res) => {
  try {
    const [Designation] = await db.query('SELECT * FROM mstdesignation');

    res.json({
      success: true,
      message: 'Designation fetched successfully',
      data: Designation
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch designation',
      data: null,
      error: error.message
    });
  }
};


// ADD
exports.addDesignation = async (req, res) => {
  try {
    const { Designation, status, created_by_id, created_date } = req.body;

    const formattedCreatedDate = formatMySQLDate(created_date);

    const [result] = await db.query(
      `INSERT INTO mstdesignation 
       (Designation, status, created_by_id, created_date) 
       VALUES (?, ?, ?, ?)`,
      [Designation, status, created_by_id, formattedCreatedDate]
    );

    res.json({
      success: true,
      message: 'Designation added successfully',
      data: {
        id: result.insertId,
        Designation,
        status,
        created_by_id,
        created_date
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Failed to add designation',
      data: null,
      error: error.message
    });
  }
};


// UPDATE
exports.updateDesignation = async (req, res) => {
  try {
    const { id } = req.params;
    const { Designation, status, updated_by_id, updated_date } = req.body;

    const formattedUpdatedDate = formatMySQLDate(updated_date);

    const [result] = await db.query(
      `UPDATE mstdesignation 
       SET Designation = ?, status = ?, updated_by_id = ?, updated_date = ? 
       WHERE designationid = ?`,
      [Designation, status, updated_by_id, formattedUpdatedDate, id]
    );

    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: 'Designation not found',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Designation updated successfully',
      data: { id, Designation, status, updated_by_id, updated_date }
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Failed to update designation',
      data: null,
      error: error.message
    });
  }
};


// DELETE
exports.deleteDesignation = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM mstdesignation WHERE designationid = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: 'Designation not found',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Designation deleted successfully',
      data: null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete designation',
      data: null,
      error: error.message
    });
  }
};