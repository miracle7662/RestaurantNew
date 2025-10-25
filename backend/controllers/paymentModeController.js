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
    const { outletid, orderedPaymentTypeIds } = req.body;

    if (!outletid || !Array.isArray(orderedPaymentTypeIds)) {
      return res.status(400).json({ error: "Outlet ID and an array of ordered payment type IDs are required" });
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
    const { outletid } = req.params;
    if (!outletid) {
      return res.status(400).json({ error: "Outlet ID is required" });
    }

    const sql = `
      SELECT pm.id, pm.paymenttypeid, pt.mode_name, pm.outletid
      FROM payment_modes pm
      JOIN payment_types pt ON pm.paymenttypeid = pt.paymenttypeid
      WHERE pm.outletid = ? AND pm.is_active = 1 AND pt.status = 1
    `;
    const rows = db.prepare(sql).all(outletid);
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