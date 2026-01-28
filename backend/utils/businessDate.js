const db = require('../config/db');

/**
 * Get the latest business date (curr_date) from trn_dayend table
 * @param {number} outletId - Outlet ID
 * @param {number} hotelId - Hotel ID
 * @returns {string|null} - Latest curr_date or null if not found
 */
const getBusinessDate = (outletId, hotelId) => {
  try {
    const query = `
      SELECT curr_date FROM trn_dayend
      WHERE outlet_id = ? AND hotel_id = ?
      ORDER BY id DESC LIMIT 1
    `;
    const row = db.prepare(query).get(outletId, hotelId);
    return row ? row.curr_date : null;
  } catch (error) {
    console.error('Error fetching business date:', error);
    return null;
  }
};

module.exports = { getBusinessDate };
