const db = require('../config/db');

// ================= LIST =================
exports.listAccountTypes = (req, res) => {
  try {
    const hotelid = req.hotelid;

    const stmt = db.prepare(`
      SELECT *
      FROM accounttypedetails
      WHERE hotelid = ?
    `);

    const accountTypes = stmt.all(hotelid);
    res.json(accountTypes);

  } catch (error) {
    console.error('Error fetching account types:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ================= GET BY ID =================
exports.getAccountTypeById = (req, res) => {
  try {
    const { id } = req.params;
    const hotelid = req.hotelid;

    const stmt = db.prepare(`
      SELECT *
      FROM accounttypedetails
      WHERE AccID = ? AND hotelid = ?
    `);

    const accountType = stmt.get(id, hotelid);

    if (accountType) {
      res.json(accountType);
    } else {
      res.status(404).json({ error: 'Account Type not found' });
    }

  } catch (error) {
    console.error('Error fetching account type:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ================= CREATE =================
exports.createAccountType = (req, res) => {
  try {
    const {
      AccName,
      UnderID,
      NatureOfC,
      status,
      created_by_id,
      created_date,
      updated_by_id,
      updated_date
    } = req.body;

    const hotelid = req.hotelid;

    const stmt = db.prepare(`
      INSERT INTO accounttypedetails
      (AccName, UnderID, NatureOfC, status, created_by_id, created_date, updated_by_id, updated_date, hotelid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      AccName,
      UnderID,
      NatureOfC,
      status,
      created_by_id,
      created_date,
      updated_by_id,
      updated_date,
      hotelid
    );

    res.status(201).json({
      message: 'Account Type created successfully',
      insertedId: result.lastInsertRowid
    });

  } catch (error) {
    console.error('Error creating account type:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ================= UPDATE =================
exports.updateAccountType = (req, res) => {
  try {
    const { id } = req.params;
    const {
      AccName,
      UnderID,
      NatureOfC,
      status,
      updated_by_id,
      updated_date
    } = req.body;

    const hotelid = req.hotelid;

    // Check ownership
    const exists = db.prepare(`
      SELECT AccID
      FROM accounttypedetails
      WHERE AccID = ? AND hotelid = ?
    `).get(id, hotelid);

    if (!exists) {
      return res.status(404).json({ error: 'Account Type not found or access denied' });
    }

    const stmt = db.prepare(`
      UPDATE accounttypedetails
      SET AccName = ?, UnderID = ?, NatureOfC = ?, status = ?, updated_by_id = ?, updated_date = ?
      WHERE AccID = ? AND hotelid = ?
    `);

    stmt.run(
      AccName,
      UnderID,
      NatureOfC,
      status,
      updated_by_id,
      updated_date,
      id,
      hotelid
    );

    res.json({ message: 'Account Type updated successfully' });

  } catch (error) {
    console.error('Error updating account type:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ================= DELETE =================
exports.deleteAccountType = (req, res) => {
  try {
    const { id } = req.params;
    const hotelid = req.hotelid;

    // Validate record
    const exists = db.prepare(`
      SELECT AccID
      FROM accounttypedetails
      WHERE AccID = ? AND hotelid = ?
    `).get(id, hotelid);

    if (!exists) {
      return res.status(404).json({ error: 'Account Type not found or access denied' });
    }

    db.prepare(`
      DELETE FROM accounttypedetails
      WHERE AccID = ? AND hotelid = ?
    `).run(id, hotelid);

    res.json({ message: 'Account Type deleted successfully' });

  } catch (error) {
    console.error('Error deleting account type:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
