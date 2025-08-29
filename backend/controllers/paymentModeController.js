const db = require("../config/db");

// Create a payment mode
exports.createPaymentMode = (req, res) => {
  try {
    const { outletid, mode_name, is_active } = req.body;

    const stmt = db.prepare(
      "INSERT INTO payment_modes (outletid, mode_name, is_active) VALUES (?, ?, ?)"
    );
    const result = stmt.run(outletid, mode_name, is_active ?? 1);

    res.json({
      id: result.lastInsertRowid,
      outletid,
      mode_name,
      is_active: is_active ?? 1,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all payment modes
exports.getAllPaymentModes = (req, res) => {
  try {
    const { outletid } = req.query;
    let sql = "SELECT * FROM payment_modes";
    const params = [];

    if (outletid) {
      sql += " WHERE outletid = ?";
      params.push(outletid);
    }

    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single payment mode by ID
exports.getPaymentModeById = (req, res) => {
  try {
    const { id } = req.params;
    const row = db.prepare("SELECT * FROM payment_modes WHERE id = ?").get(id);

    if (!row) return res.status(404).json({ message: "Payment mode not found" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a payment mode
exports.updatePaymentMode = (req, res) => {
  try {
    const { id } = req.params;
    const { mode_name, is_active, outletid } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Payment mode ID is required" });
    }
    if (!mode_name || !outletid) {
      return res.status(400).json({ error: "mode_name and outletid are required" });
    }

    const stmt = db.prepare(`
      UPDATE payment_modes
      SET mode_name = ?, outletid = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(mode_name, outletid, is_active ?? 1, id);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Payment mode not found" });
    }

    res.json({
      message: "Payment mode updated successfully",
      changes: result.changes,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a payment mode
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

// Get all outlets (for dropdown)
exports.getOutlets = (req, res) => {
  try {
    const rows = db.prepare("SELECT outletid, outlet_name FROM mst_outlets").all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
