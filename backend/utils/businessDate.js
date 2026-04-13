const db = require('../config/db');

/**
 * Get the latest business date (curr_date) from trn_dayend table
 * @param {number} outletId - Outlet ID
 * @param {number} hotelId - Hotel ID
 * @returns {string|null} - Latest curr_date or null if not found
 */
const getBusinessDate = async (outletId, hotelId) => {
  try {
    const query = `
      SELECT curr_date FROM trn_dayend
      WHERE outlet_id = ? AND hotel_id = ?
      ORDER BY id DESC LIMIT 1
    `;
    const [rows] = await db.query(query, [outletId, hotelId]);
    const row = rows[0] || null;
    return row ? row.curr_date : null;
  } catch (error) {
    console.error('Error fetching business date:', error);
    return null;
  }
};

module.exports = { getBusinessDate };
