const db = require("../config/db");

// Create a payment mode
exports.createPaymentMode = (req, res) => {
  try {
    const { outletid, hotelid, paymenttypeid, is_active } = req.body;

    // Validate required fields
    if (
      typeof outletid !== 'number' ||
      typeof hotelid !== 'number' ||
      typeof paymenttypeid !== 'number' ||
      (is_active !== undefined && typeof is_active !== 'number')
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid data types for required fields",
        error: "Invalid data types for required fields"
      });
    }

    if (!outletid || !hotelid || !paymenttypeid) {
      return res.status(400).json({
        success: false,
        message: "Outlet ID, Hotel ID and Payment Type ID are required",
        error: "Outlet ID, Hotel ID and Payment Type ID are required"
      });
    }

    const stmt = `
      INSERT INTO payment_modes (outletid, hotelid, paymenttypeid, is_active) 
      VALUES (?, ?, ?, ?)
    `;
    const result = db.query(stmt, [outletid, hotelid, paymenttypeid, is_active ?? 1]);

    res.status(201).json({
      success: true,
      message: "Payment mode created successfully",
      data: {
        id: result.insertId,
        outletid,
        hotelid,
        paymenttypeid,
        is_active: is_active ?? 1,
      }
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({
        success: false,
        message: "Invalid foreign key or duplicate entry",
        error: "Invalid foreign key or duplicate entry"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message
      });
    }
  }
};

// Get all payment modes with join to payment_types
exports.getAllPaymentModes = (req, res) => {
  try {
    const { outletid, hotelid } = req.query;

    let sql = `
      SELECT pm.id, pm.hotelid, pm.outletid, pm.paymenttypeid, 
             pm.is_active, pm.created_at, pm.updated_at,
             pt.mode_name
      FROM payment_modes pm
      LEFT JOIN payment_types pt ON pm.paymenttypeid = pt.paymenttypeid
      WHERE 1=1
    `;
    const params = [];

    if (outletid) {
      sql += " AND pm.outletid = ?";
      params.push(outletid);
    }
    if (hotelid) {
      sql += " AND pm.hotelid = ?";
      params.push(hotelid);
    }

    const rows = db.query(sql, params);
    res.status(200).json({
      success: true,
      message: "Payment modes fetched successfully",
      data: rows
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
};

// Update payment mode sequence for an outlet
exports.updatePaymentModeSequence = (req, res) => {
  try {
    // console.log('Received req.body:', req.body);
    let { outletid, orderedPaymentTypeIds } = req.body;

    outletid = parseInt(outletid);
    if (isNaN(outletid) || outletid <= 0 || !Array.isArray(orderedPaymentTypeIds) || orderedPaymentTypeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Valid outlet ID and non-empty array of ordered payment type IDs are required",
        error: "Valid outlet ID and non-empty array of ordered payment type IDs are required"
      });
    }

    // Start transaction
    db.query('START TRANSACTION');

    try {
      // First, reset sequence for all payment modes for the given outlet to 0
      const resetStmt = 'UPDATE payment_modes SET sequence = 0 WHERE outletid = ?';
      db.query(resetStmt, [outletid]);

      // Then, update the sequence for the provided payment modes in order
      const updateStmt = 'UPDATE payment_modes SET sequence = ? WHERE outletid = ? AND paymenttypeid = ?';

      for (let i = 0; i < orderedPaymentTypeIds.length; i++) {
        db.query(updateStmt, [i + 1, outletid, orderedPaymentTypeIds[i]]);
      }

      // Commit transaction
      db.query('COMMIT');

    } catch (err) {
      // Rollback on error
      db.query('ROLLBACK');
      throw err;
    }

    // Return the updated list, ordered by the new sequence
    const updatedModes = db.query(`
      SELECT pm.id, pm.hotelid, pm.outletid, pm.paymenttypeid, pm.sequence, pt.mode_name
      FROM payment_modes pm
      JOIN payment_types pt ON pm.paymenttypeid = pt.paymenttypeid
      WHERE pm.outletid = ? AND pm.sequence > 0 ORDER BY pm.sequence ASC
    `, [outletid]);

    res.status(200).json({
      success: true,
      message: "Payment mode sequence updated successfully",
      data: updatedModes
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
};

// Get payment modes by outlet ID
exports.getPaymentModesByOutlet = (req, res) => {
  try {
    const { outletid } = req.query; // Changed to query param for flexibility

    let sql = `
      SELECT pt.paymenttypeid as id, pt.mode_name, MIN(pm.sequence) as sequence
      FROM payment_modes pm
      JOIN payment_types pt ON pm.paymenttypeid = pt.paymenttypeid
      WHERE pm.is_active = 1 AND pt.status = 1
    `;
    const params = [];

    // If a specific outlet is requested, filter by it.
    // The 'outletid' will be a string from the query, so check for truthiness.
    if (outletid && outletid !== 'null' && outletid !== 'undefined') {
      sql += ' AND pm.outletid = ?';
      params.push(outletid);
    }

    // Group by payment type to get unique modes.
    // Order by sequence to maintain a consistent order.
    // If no outlet is selected, it will show all unique active payment modes.
    sql += ' GROUP BY pt.paymenttypeid, pt.mode_name ORDER BY sequence, pt.mode_name';

    const rows = db.query(sql, params);
    res.status(200).json({
      success: true,
      message: "Payment modes fetched successfully",
      data: rows
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
};

// Update payment mode
exports.updatePaymentMode = (req, res) => {
  try {
    const { id } = req.params;
    const { outletid, hotelid, paymenttypeid, is_active } = req.body;

    if (!id || !paymenttypeid) {
      return res.status(400).json({
        success: false,
        message: "ID and paymenttypeid are required",
        error: "ID and paymenttypeid are required"
      });
    }

    if (
      typeof outletid !== 'number' ||
      typeof hotelid !== 'number' ||
      typeof paymenttypeid !== 'number' ||
      (is_active !== undefined && typeof is_active !== 'number')
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid data types for required fields",
        error: "Invalid data types for required fields"
      });
    }

    const stmt = `
      UPDATE payment_modes
      SET outletid = ?, hotelid = ?, paymenttypeid = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const result = db.query(stmt, [outletid, hotelid, paymenttypeid, is_active ?? 1, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment mode not found",
        error: "Payment mode not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment mode updated successfully",
      data: { id, outletid, hotelid, paymenttypeid, is_active: is_active ?? 1 }
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({
        success: false,
        message: "Invalid foreign key or duplicate entry",
        error: "Invalid foreign key or duplicate entry"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message
      });
    }
  }
};

// Delete payment mode
exports.deletePaymentMode = (req, res) => {
  try {
    const { id } = req.params;
    const stmt = "DELETE FROM payment_modes WHERE id = ?";
    const result = db.query(stmt, [id]);

    res.status(200).json({
      success: true,
      message: "Payment mode deleted successfully",
      data: { changes: result.affectedRows }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
};

// Get all payment types (master list)
exports.getPaymentTypes = (req, res) => {
  try {
    const rows = db.query("SELECT * FROM payment_types");
    res.status(200).json({
      success: true,
      message: "Payment types fetched successfully",
      data: rows
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
};