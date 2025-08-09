const db = require('../config/db');

// Get all rest tax masters
exports.getAll = (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT t.*, h.hotel_name ,mu.username, tg.taxgroup_name 
      FROM mst_resttaxmaster t
      LEFT JOIN msthotelmasters h ON t.hotelid = h.hotelid
      LEFT JOIN msttaxgroup tg ON t.taxgroupid = tg.taxgroupid
      left join mst_users mu on mu.userid=t.created_by_id
    `).all();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching rest taxes:', err.message);
    res.status(500).json({ error: 'Failed to fetch data', details: err.message });
  }
};

// Get a single rest tax master by ID
exports.getById = (req, res) => {
  try {
    const row = db.prepare(`
      SELECT t.*, h.hotel_name AS brandName, tg.taxgroup_name AS taxProductGroup
      FROM mst_resttaxmaster t
      LEFT JOIN msthotelmasters h ON t.hotelid = h.hotelid
      LEFT JOIN msttaxgroup tg ON t.taxgroupid = tg.taxgroupid
      WHERE t.resttaxid = ?
    `).get(Number(req.params.id) || null);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    console.error('Error fetching rest tax by ID:', err.message);
    res.status(500).json({ error: 'Failed to fetch data by ID', details: err.message });
  }
};

// Create a new rest tax master
exports.create = (req, res) => {
  try {
    const {
      hotelid, outletid, isapplicablealloutlet,
      resttax_name, resttax_value,
      restcgst, restsgst, restigst,
      taxgroupid, status, created_by_id
    } = req.body;

    console.log("Received body:", req.body); // Debugging

    const stmt = db.prepare(`
      INSERT INTO mst_resttaxmaster (
        hotelid, outletid, isapplicablealloutlet,
        resttax_name, resttax_value,
        restcgst, restsgst, restigst,
        taxgroupid, status, created_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      Number(hotelid) || null,
      Number(outletid) || null,
      isapplicablealloutlet ? 1 : 0,
      String(resttax_name) || null,
      Number(resttax_value) || null,
      Number(restcgst) || null,
      Number(restsgst) || null,
      Number(restigst) || null,
      Number(taxgroupid) || null,
      Number(status) ?? 1,
      Number(created_by_id) || null
    );
    res.json({ success: true, resttaxid: result.lastInsertRowid });
  } catch (err) {
    console.error('Error creating rest tax:', err.message);
    res.status(500).json({ error: 'Failed to create record', details: err.message });
  }
};

// Update a rest tax master
exports.update = (req, res) => {
  try {
    const { id } = req.params;
    const {
      hotelid, outletid, isapplicablealloutlet,
      resttax_name, resttax_value,
      restcgst, restsgst, restigst,
      taxgroupid, status, updated_by_id
    } = req.body;

    const stmt = db.prepare(`
      UPDATE mst_resttaxmaster SET
        hotelid = ?, outletid = ?, isapplicablealloutlet = ?,
        resttax_name = ?, resttax_value = ?,
        restcgst = ?, restsgst = ?, restigst = ?,
        taxgroupid = ?, status = ?,
        updated_by_id = ?, updated_date = CURRENT_TIMESTAMP
      WHERE resttaxid = ?
    `);

    const result = stmt.run(
      Number(hotelid) || null,
      Number(outletid) || null,
      isapplicablealloutlet ? 1 : 0,
      String(resttax_name) || null,
      Number(resttax_value) || null,
      Number(restcgst) || null,
      Number(restsgst) || null,
      Number(restigst) || null,
      Number(taxgroupid) || null,
      Number(status) ?? 1,
      Number(updated_by_id) || null,
      Number(id) || null
    );

    res.json({ success: result.changes > 0 });
  } catch (err) {
    console.error('Error updating rest tax:', err.message);
    res.status(500).json({ error: 'Failed to update record', details: err.message });
  }
};

// Delete a rest tax master
exports.remove = (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM mst_resttaxmaster WHERE resttaxid = ?');
    const result = stmt.run(Number(req.params.id) || null);
    res.json({ success: result.changes > 0 });
  } catch (err) {
    console.error('Error deleting rest tax:', err.message);
    res.status(500).json({ error: 'Failed to delete record', details: err.message });
  }
};

module.exports = exports;