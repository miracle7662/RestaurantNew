const db = require('../config/db');

// ================= LIST =================
exports.listAccountNatures = (req, res) => {
  try {
    const hotelid = req.hotelid;

    const stmt = db.prepare(`
      SELECT *
      FROM accountnaturemaster
      WHERE hotelid = ?
    `);

    const accountnatures = stmt.all(hotelid);
    res.json(accountnatures);

  } catch (error) {
    console.error('Error fetching account natures:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ================= GET BY ID =================
exports.getAccountNatureById = (req, res) => {
  try {
    const { id } = req.params;
    const hotelid = req.hotelid;

    const stmt = db.prepare(`
      SELECT *
      FROM accountnaturemaster
      WHERE nature_id = ? AND hotelid = ?
    `);

    const accountnature = stmt.get(id, hotelid);

    if (accountnature) {
      res.json(accountnature);
    } else {
      res.status(404).json({ error: 'Account Nature not found' });
    }

  } catch (error) {
    console.error('Error fetching account nature:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ================= CREATE =================
exports.createAccountNature = (req, res) => {
  try {
    const { accountnature, status, created_by_id, created_date, hotelid } = req.body;

    const stmt = db.prepare(`
      INSERT INTO accountnaturemaster
      (accountnature, status, created_by_id, created_date, hotelid)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      accountnature,
      status,
      created_by_id,
      created_date,
      hotelid
    );

    res.status(201).json({
      message: 'Account Nature created successfully',
      insertedId: result.lastInsertRowid
    });

  } catch (error) {
    console.error('Error creating account nature:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ================= UPDATE =================
exports.updateAccountNature = (req, res) => {
  try {
    const { id } = req.params;
    const { accountnature, status, updated_by_id, updated_date, hotelid } = req.body;

    // Check ownership
    const exists = db.prepare(`
      SELECT nature_id
      FROM accountnaturemaster
      WHERE nature_id = ? AND hotelid = ?
    `).get(id, hotelid);

    if (!exists) {
      return res.status(404).json({ error: 'Account Nature not found or access denied' });
    }

    const stmt = db.prepare(`
      UPDATE accountnaturemaster
      SET accountnature = ?, status = ?, updated_by_id = ?, updated_date = ?, hotelid = ?
      WHERE nature_id = ? AND hotelid = ?
    `);

    stmt.run(
      accountnature,
      status,
      updated_by_id,
      updated_date,
      hotelid,
      id,
      hotelid
    );

    res.json({ message: 'Account Nature updated successfully' });

  } catch (error) {
    console.error('Error updating account nature:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ================= DELETE =================
exports.deleteAccountNature = (req, res) => {
  try {
    const { id } = req.params;
    const hotelid = req.hotelid;

    // Validate record
    const exists = db.prepare(`
      SELECT nature_id
      FROM accountnaturemaster
      WHERE nature_id = ? AND hotelid = ?
    `).get(id, hotelid);

    if (!exists) {
      return res.status(404).json({ error: 'Account Nature not found or access denied' });
    }

    db.prepare(`
      DELETE FROM accountnaturemaster
      WHERE nature_id = ? AND hotelid = ?
    `).run(id, hotelid);

    res.json({ message: 'Account Nature deleted successfully' });

  } catch (error) {
    console.error('Error deleting account nature:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
