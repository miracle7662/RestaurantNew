const db = require('../../../config/db');

// Helper to get current user ID
const getCurrentUserId = (req) => {
  return req.user?.id || null;
};

// Helper to convert status number to string
const formatStatus = (status) => {
  return status === 1 ? 'Active' : 'Inactive';
};

// Helper to convert status string to number
const convertStatusToNumber = (status) => {
  return status === 'Active' ? 1 : 0;
};

// ✅ GET ALL NATIONALITIES
exports.getNationalities = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM nationalitymaster ORDER BY nationality_id DESC'
    );

    // Convert status from number to string for frontend
    const formattedRows = rows.map(row => ({
      ...row,
      status: row.status === 1 ? 'Active' : 'Inactive'
    }));

    res.json({
      success: true,
      message: 'Data fetched successfully',
      data: formattedRows
    });

  } catch (error) {
    console.error('Error fetching nationalities:', error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
};

// ✅ ADD NATIONALITY
exports.addNationality = async (req, res) => {
  try {
    const { nationality, nationality_code, status } = req.body;

    const created_by_id = getCurrentUserId(req);
    const created_date = new Date();
    
    // Convert status string to number (1 for Active, 0 for Inactive)
    const statusNumber = convertStatusToNumber(status || 'Active');

    const query = `
      INSERT INTO nationalitymaster 
      (nationality, nationality_code, status, created_by_id, created_date)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      nationality,
      nationality_code,
      statusNumber,
      created_by_id,
      created_date
    ]);

    // Fetch the inserted record to return complete data
    const [newRecord] = await db.execute(
      'SELECT * FROM nationalitymaster WHERE nationality_id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Nationality added successfully',
      data: {
        ...newRecord[0],
        status: newRecord[0].status === 1 ? 'Active' : 'Inactive'
      }
    });

  } catch (error) {
    console.error('Error adding nationality:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add nationality',
      error: error.message
    });
  }
};

// ✅ UPDATE NATIONALITY
exports.updateNationality = async (req, res) => {
  try {
    const { id } = req.params;
    const { nationality, nationality_code, status } = req.body;

    const updated_by_id = getCurrentUserId(req);
    const updated_date = new Date();
    
    // Convert status string to number (1 for Active, 0 for Inactive)
    const statusNumber = convertStatusToNumber(status);

    const query = `
      UPDATE nationalitymaster 
      SET nationality = ?, 
          nationality_code = ?, 
          status = ?, 
          updated_by_id = ?, 
          updated_date = ?
      WHERE nationality_id = ?
    `;

    const [result] = await db.execute(query, [
      nationality,
      nationality_code,
      statusNumber,
      updated_by_id,
      updated_date,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nationality not found'
      });
    }

    // Fetch the updated record
    const [updatedRecord] = await db.execute(
      'SELECT * FROM nationalitymaster WHERE nationality_id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Nationality updated successfully',
      data: {
        ...updatedRecord[0],
        status: updatedRecord[0].status === 1 ? 'Active' : 'Inactive'
      }
    });

  } catch (error) {
    console.error('Error updating nationality:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update nationality',
      error: error.message
    });
  }
};

// ✅ DELETE NATIONALITY
exports.deleteNationality = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM nationalitymaster WHERE nationality_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nationality not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Nationality deleted successfully',
      data: { nationality_id: parseInt(id) }
    });

  } catch (error) {
    console.error('Error deleting nationality:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete nationality',
      error: error.message
    });
  }
};