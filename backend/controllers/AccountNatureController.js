const db = require('../config/db');
const { formatMySQLDate } = require('../utils/dateUtils');

// ================= LIST =================
exports.listAccountNatures = async (req, res) => {
  try {
    const hotelid = req.hotelid;

    const query = `
      SELECT *
      FROM accountnaturemaster
      WHERE hotelid = ?
    `;

    const [accountnatures] = await db.query(query, [hotelid]);
    res.json(accountnatures);

  } catch (error) {
    // console.error('Error fetching account natures:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ================= GET BY ID =================
exports.getAccountNatureById = async (req, res) => {
  try {
    const { id } = req.params;
    const hotelid = req.hotelid;

    const query = `
      SELECT *
      FROM accountnaturemaster
      WHERE nature_id = ? AND hotelid = ?
    `;

    const [result] = await db.query(query, [id, hotelid]);

    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).json({ error: 'Account Nature not found' });
    }

  } catch (error) {
    // console.error('Error fetching account nature:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ================= CREATE =================
exports.createAccountNature = async (req, res) => {
  try {
    const { accountnature, status, created_by_id, created_date, hotelid } = req.body;

    const query = `
      INSERT INTO accountnaturemaster
      (accountnature, status, created_by_id, created_date, hotelid)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      accountnature,
      status,
      created_by_id,
      formatMySQLDate(created_date),
      hotelid
    ]);

    res.status(201).json({
      message: 'Account Nature created successfully',
      insertedId: result.insertId
    });

  } catch (error) {
    // console.error('Error creating account nature:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ================= UPDATE =================
exports.updateAccountNature = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountnature, status, updated_by_id, updated_date, hotelid } = req.body;

    // Check ownership
    const [existsResult] = await db.query(`
      SELECT nature_id
      FROM accountnaturemaster
      WHERE nature_id = ? AND hotelid = ?
    `, [id, hotelid]);

    if (!existsResult || existsResult.length === 0) {
      return res.status(404).json({ error: 'Account Nature not found or access denied' });
    }

    const query = `
      UPDATE accountnaturemaster
      SET accountnature = ?, status = ?, updated_by_id = ?, updated_date = ?, hotelid = ?
      WHERE nature_id = ? AND hotelid = ?
    `;

    await db.query(query, [
      accountnature,
      status,
      updated_by_id,
      formatMySQLDate(updated_date),
      hotelid,
      id,
      hotelid
    ]);

    res.json({ message: 'Account Nature updated successfully' });

  } catch (error) {
    // console.error('Error updating account nature:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ================= DELETE =================
exports.deleteAccountNature = async (req, res) => {
  try {
    const { id } = req.params;
    const hotelid = req.hotelid;

    // Validate record
    const [existsResult] = await db.query(`
      SELECT nature_id
      FROM accountnaturemaster
      WHERE nature_id = ? AND hotelid = ?
    `, [id, hotelid]);

    if (!existsResult || existsResult.length === 0) {
      return res.status(404).json({ error: 'Account Nature not found or access denied' });
    }

    await db.query(`
      DELETE FROM accountnaturemaster
      WHERE nature_id = ? AND hotelid = ?
    `, [id, hotelid]);

    res.json({ message: 'Account Nature deleted successfully' });

  } catch (error) {
    // console.error('Error deleting account nature:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

