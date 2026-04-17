const db = require('../config/db');
const { formatMySQLDate } = require('../utils/dateUtils');

// Get all hotel types with optional filtering
exports.gethoteltype = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM msthoteltype WHERE 1=1';
    const params = [];

    if (status !== undefined) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND hotel_type LIKE ?';
      params.push(`%${search}%`);
    }
    query += ' ORDER BY hotel_type ASC';

    const [hoteltypes] = await db.query(query, params);

    res.json({
      success: true,
      count: hoteltypes.length,
      data: hoteltypes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch hotel types', data: [] });
  }
};


// Add new hotel type
exports.addhoteltype = async (req, res) => {
  try {
    const { hotel_type, status, hotelid, created_by_id, created_date } = req.body;

    if (!hotel_type || status === undefined) {
      return res.status(400).json({ error: 'Hotel type and status are required' });
    }

    const [result] = await db.query(
      'INSERT INTO msthoteltype (hotel_type, status, created_by_id, created_date, hotelid) VALUES (?, ?, ?, ?, ?)',
[hotel_type, status, created_by_id || 1, formatMySQLDate(created_date || new Date()), hotelid]
    );

    const newHoteltype = {
      hoteltypeid: result.insertId,
      hotel_type,
      status,
      created_by_id: created_by_id || 1,
      created_date: created_date || new Date().toISOString(),
      updated_by_id: null,
      updated_date: null,
      hotelid: hotelid || null
    };

    res.status(201).json({ success: true, data: newHoteltype });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add hotel type', data: null });
  }
};


// Update hotel type
exports.updatehoteltype = async (req, res) => {
  try {
    const { id } = req.params;
    const { hotel_type, status, updated_by_id, updated_date, hotelid } = req.body;

    if (!hotel_type || status === undefined) {
      return res.status(400).json({ error: 'Hotel type and status are required' });
    }

    const [result] = await db.query(
      'UPDATE msthoteltype SET hotel_type = ?, status = ?, updated_by_id = ?, updated_date = ?, hotelid = ? WHERE hoteltypeid = ?',
      [hotel_type, status, updated_by_id || 2, formatMySQLDate(updated_date || new Date()), hotelid, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Hotel type not found', data: null });
    }

    const updatedHoteltype = {
      hoteltypeid: id,
      hotel_type,
      status,
      updated_by_id: updated_by_id || 2,
      updated_date: updated_date || new Date().toISOString(),
      hotelid: hotelid || null
    };

    res.json({ success: true, data: updatedHoteltype });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update hotel type', data: null });
  }
};


// Delete hotel type
exports.deletehoteltype = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM msthoteltype WHERE hoteltypeid = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Hotel type not found', data: null });
    }

    res.json({
      success: true,
      data: { hoteltypeid: Number(id) },
      message: 'Hotel type deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete hotel type', data: null });
  }
};


// Get hotel type by ID
exports.gethoteltypeById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      'SELECT * FROM msthoteltype WHERE hoteltypeid = ?',
      [id]
    );

    const hoteltype = rows[0];

    if (!hoteltype) {
      return res.status(404).json({ success: false, message: 'Hotel type not found', data: null });
    }

    res.json({ success: true, data: hoteltype });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch hotel type', data: null });
  }
};


// Get hotel types count
exports.gethoteltypeCount = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM msthoteltype');
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch count', data: null });
  }
};
