const db = require('../config/db');
const { formatMySQLDate } = require('../utils/dateUtils');

// ================= LIST =================
exports.listAccountTypes = async (req, res) => {
  try {
    const hotelid = req.hotelid;

    const query = `
      SELECT *
      FROM accounttypedetails
      WHERE hotelid = ?
    `;

    const [accountTypes] = await db.query(query, [hotelid]);
    res.json(accountTypes);

  } catch (error) {
    // console.error('Error fetching account types:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ================= GET BY ID =================
exports.getAccountTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const hotelid = req.hotelid;

    const query = `
      SELECT *
      FROM accounttypedetails
      WHERE AccID = ? AND hotelid = ?
    `;

    const [result] = await db.query(query, [id, hotelid]);

    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).json({ error: 'Account Type not found' });
    }

  } catch (error) {
    // console.error('Error fetching account type:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ================= CREATE =================
exports.createAccountType = async (req, res) => {
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

    const query = `
      INSERT INTO accounttypedetails
      (AccName, UnderID, NatureOfC, status, created_by_id, created_date, updated_by_id, updated_date, hotelid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      AccName,
      UnderID,
      NatureOfC,
      status,
      created_by_id,
      formatMySQLDate(created_date),
      updated_by_id,
      formatMySQLDate(updated_date),
      hotelid
    ]);

    res.status(201).json({
      message: 'Account Type created successfully',
      insertedId: result.insertId
    });

  } catch (error) {
    // console.error('Error creating account type:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ================= UPDATE =================
exports.updateAccountType = async (req, res) => {
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
    const [existsResult] = await db.query(`
      SELECT AccID
      FROM accounttypedetails
      WHERE AccID = ? AND hotelid = ?
    `, [id, hotelid]);

    if (!existsResult || existsResult.length === 0) {
      return res.status(404).json({ error: 'Account Type not found or access denied' });
    }

    const query = `
      UPDATE accounttypedetails
      SET AccName = ?, UnderID = ?, NatureOfC = ?, status = ?, updated_by_id = ?, updated_date = ?
      WHERE AccID = ? AND hotelid = ?
    `;

    await db.query(query, [
      AccName,
      UnderID,
      NatureOfC,
      status,
      updated_by_id,
      formatMySQLDate(updated_date),
      id,
      hotelid
    ]);

    res.json({ message: 'Account Type updated successfully' });

  } catch (error) {
    // console.error('Error updating account type:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ================= DELETE =================
exports.deleteAccountType = async (req, res) => {
  try {
    const { id } = req.params;
    const hotelid = req.hotelid;

    // Validate record
    const [existsResult] = await db.query(`
      SELECT AccID
      FROM accounttypedetails
      WHERE AccID = ? AND hotelid = ?
    `, [id, hotelid]);

    if (!existsResult || existsResult.length === 0) {
      return res.status(404).json({ error: 'Account Type not found or access denied' });
    }

    await db.query(`
      DELETE FROM accounttypedetails
      WHERE AccID = ? AND hotelid = ?
    `, [id, hotelid]);

    res.json({ message: 'Account Type deleted successfully' });

  } catch (error) {
    // console.error('Error deleting account type:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
