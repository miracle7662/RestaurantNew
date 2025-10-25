const db = require("../config/db");

// Create a payment mode
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
      return res.status(400).json({ error: "Invalid data types for required fields" });
    }

    if (!outletid || !hotelid || !paymenttypeid) {
      return res.status(400).json({ error: "Outlet ID, Hotel ID and Payment Type ID are required" });
    }

    const stmt = db.prepare(
      `INSERT INTO payment_modes (outletid, hotelid, paymenttypeid, is_active) 
       VALUES (?, ?, ?, ?)`
    );
    const result = stmt.run(outletid, hotelid, paymenttypeid, is_active ?? 1);

    res.json({
      id: result.lastInsertRowid,
      outletid,
      hotelid,
      paymenttypeid,
      is_active: is_active ?? 1,
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ error: "Invalid foreign key or duplicate entry" });
    } else {
      res.status(500).json({ error: err.message });
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

    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update payment mode sequence for an outlet
exports.updatePaymentModeSequence = (req, res) => {
  try {
    console.log('Received req.body:', req.body);
    let { outletid, orderedPaymentTypeIds } = req.body;

    outletid = parseInt(outletid);
    if (isNaN(outletid) || outletid <= 0 || !Array.isArray(orderedPaymentTypeIds) || orderedPaymentTypeIds.length === 0) {
      return res.status(400).json({ error: "Valid outlet ID and non-empty array of ordered payment type IDs are required" });
    }

    const transaction = db.transaction(() => {
      // First, reset sequence for all payment modes for the given outlet to 0
      const resetStmt = db.prepare('UPDATE payment_modes SET sequence = 0 WHERE outletid = ?');
      resetStmt.run(outletid);

      // Then, update the sequence for the provided payment modes in order
      const updateStmt = db.prepare(
        'UPDATE payment_modes SET sequence = ? WHERE outletid = ? AND paymenttypeid = ?'
      );

      orderedPaymentTypeIds.forEach((paymenttypeid, index) => {
        updateStmt.run(index + 1, outletid, paymenttypeid);
      });
    });

    transaction();

    // Return the updated list, ordered by the new sequence
    const updatedModes = db.prepare(`
        SELECT pm.id, pm.hotelid, pm.outletid, pm.paymenttypeid, pm.sequence, pt.mode_name
        FROM payment_modes pm
        JOIN payment_types pt ON pm.paymenttypeid = pt.paymenttypeid
        WHERE pm.outletid = ? AND pm.sequence > 0 ORDER BY pm.sequence ASC`).all(outletid);

    res.json(updatedModes);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update payment mode
exports.updatePaymentMode = (req, res) => {
  try {
    const { id } = req.params;
    const { outletid, hotelid, paymenttypeid, is_active } = req.body;

    if (!id || !paymenttypeid) {
      return res.status(400).json({ error: "ID and paymenttypeid are required" });
    }

    if (
      typeof outletid !== 'number' ||
      typeof hotelid !== 'number' ||
      typeof paymenttypeid !== 'number' ||
      (is_active !== undefined && typeof is_active !== 'number')
    ) {
      return res.status(400).json({ error: "Invalid data types for required fields" });
    }

    const stmt = db.prepare(`
      UPDATE payment_modes
      SET outletid = ?, hotelid = ?, paymenttypeid = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(outletid, hotelid, paymenttypeid, is_active ?? 1, id);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Payment mode not found" });
    }

    res.json({ message: "Payment mode updated successfully" });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ error: "Invalid foreign key or duplicate entry" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

// Delete payment mode
exports.deletePaymentMode = (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare("DELETE FROM payment_modes WHERE id = ?");
    const result = stmt.run(id);

    res.json({ message: "Payment mode deleted", changes: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all payment types (master list)
exports.getPaymentTypes = (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM payment_types").all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};