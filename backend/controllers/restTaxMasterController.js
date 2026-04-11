const db = require('../config/db');

// Get all rest tax masters
exports.getAll = async (req, res) => {
  try {
    const hotelid = req.query.hotelid || req.hotelid || 0;
    const [rows] = await db.query(`
      SELECT t.*, h.hotel_name ,mu.username, tg.taxgroup_name 
      FROM mst_resttaxmaster t
      LEFT JOIN msthotelmasters h ON t.hotelid = h.hotelid
      LEFT JOIN msttaxgroup tg ON t.taxgroupid = tg.taxgroupid
      left join mst_users mu on mu.userid=t.created_by_id
      WHERE t.hotelid = 0 OR t.hotelid = ?
    `, [hotelid]);
    res.json(rows);
  } catch (err) {
    // console.error('Error fetching rest taxes:', err.message);
    res.status(500).json({ error: 'Failed to fetch data', details: err.message });
  }
};

// Get a single rest tax master by ID
exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, h.hotel_name AS brandName, tg.taxgroup_name AS taxProductGroup
      FROM mst_resttaxmaster t
      LEFT JOIN msthotelmasters h ON t.hotelid = h.hotelid
      LEFT JOIN msttaxgroup tg ON t.taxgroupid = tg.taxgroupid
      WHERE t.resttaxid = ?
    `, [Number(req.params.id) || null]);

    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    // console.error('Error fetching rest tax by ID:', err.message);
    res.status(500).json({ error: 'Failed to fetch data by ID', details: err.message });
  }
};

// Create a new rest tax master
exports.create = async (req, res) => {
  try {
    const {
      hotelid, outletid, isapplicablealloutlet,
      resttax_name, resttax_value,
      restcgst, restsgst, restigst,restcess,
      taxgroupid, status, created_by_id
    } = req.body;

    // console.log("Received body:", req.body); // Debugging

    const [result] = await db.query(`
      INSERT INTO mst_resttaxmaster (
        hotelid, outletid, isapplicablealloutlet,
        resttax_name, resttax_value,
        restcgst, restsgst, restigst,restcess,
        taxgroupid, status, created_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `, [
      Number(hotelid) || null,
      Number(outletid) || null,
      isapplicablealloutlet ? 1 : 0,
      String(resttax_name) || null,
      Number(resttax_value) || null,
      Number(restcgst) || null,
      Number(restsgst) || null,
      Number(restigst) || null,
      Number(restcess) || null,
      Number(taxgroupid) || null,
      Number(status) ?? 1,
      Number(created_by_id) || null
    ]);
    res.json({ success: true, resttaxid: result.insertId });
  } catch (err) {
    // console.error('Error creating rest tax:', err.message);
    res.status(500).json({ error: 'Failed to create record', details: err.message });
  }
};

// Update a rest tax master
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      hotelid, outletid, isapplicablealloutlet,
      resttax_name, resttax_value,
      restcgst, restsgst, restigst, restcess,
      taxgroupid, status, updated_by_id
    } = req.body;

    const [result] = await db.query(`
      UPDATE mst_resttaxmaster SET
        hotelid = ?, outletid = ?, isapplicablealloutlet = ?,
        resttax_name = ?, resttax_value = ?,
        restcgst = ?, restsgst = ?, restigst = ?, restcess = ?,
        taxgroupid = ?, status = ?,
        updated_by_id = ?, updated_date = CURRENT_TIMESTAMP
      WHERE resttaxid = ?
    `, [
      Number(hotelid) || null,
      Number(outletid) || null,
      isapplicablealloutlet ? 1 : 0,
      String(resttax_name) || null,
      Number(resttax_value) || null,
      Number(restcgst) || null,
      Number(restsgst) || null,
      Number(restigst) || null,
      Number(restcess) || null,
      Number(taxgroupid) || null,
      Number(status) ?? 1,
      Number(updated_by_id) || null,
      Number(id) || null
    ]);

    res.json({ success: result.affectedRows > 0 });
  } catch (err) {
    // console.error('Error updating rest tax:', err.message);
    res.status(500).json({ error: 'Failed to update record', details: err.message });
  }
};

// Delete a rest tax master
exports.remove = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM mst_resttaxmaster WHERE resttaxid = ?', [Number(req.params.id) || null]);
    res.json({ success: result.affectedRows > 0 });
  } catch (err) {
    // console.error('Error deleting rest tax:', err.message);
    res.status(500).json({ error: 'Failed to delete record', details: err.message });
  }
};

module.exports = exports;