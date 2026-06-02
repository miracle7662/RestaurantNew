// checkoutFolioController.js
const db = require('../../../config/db');

const getCurrentUserHotelId = (req) => req.user?.hotel_id || null;

// GET all checkout folio entries
exports.getCheckoutFolios = async (req, res) => {
  try {
    const { checkout_id, checkin_id } = req.query;
    let hotelId = req.query.hotelid || getCurrentUserHotelId(req);

    if (!hotelId && !checkout_id && !checkin_id) {
      return res.status(400).json({ success: false, message: "Hotel ID, checkout_id or checkin_id required" });
    }

    let query = `SELECT * FROM Checkout_Folio_Master`;
    const params = [];

    if (checkout_id) {
      query += ` WHERE checkout_id = ?`;
      params.push(checkout_id);
    } else if (checkin_id) {
      query += ` WHERE checkin_id = ?`;
      params.push(checkin_id);
    } else if (hotelId) {
      query += ` WHERE hotel_id = ?`;
      params.push(hotelId);
    }

    query += ` ORDER BY transaction_datetime DESC`;

    const [entries] = await db.query(query, params);
    res.json({ success: true, message: "Data fetched successfully", data: entries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// GET checkout folio by ID
exports.getCheckoutFolioById = async (req, res) => {
  try {
    const { id } = req.params;
    const [entries] = await db.query('SELECT * FROM Checkout_Folio_Master WHERE folio_id = ?', [id]);
    const entry = entries[0];
    
    if (!entry) {
      return res.status(404).json({ success: false, message: "Checkout folio entry not found" });
    }
    res.json({ success: true, message: "Data fetched successfully", data: entry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// GET checkout folios by checkout_id
exports.getCheckoutFoliosByCheckoutId = async (req, res) => {
  try {
    const { checkout_id } = req.params;
    const [entries] = await db.query(
      'SELECT * FROM Checkout_Folio_Master WHERE checkout_id = ? ORDER BY transaction_datetime DESC',
      [checkout_id]
    );
    res.json({ success: true, message: "Data fetched successfully", data: entries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// DELETE checkout folio entry
exports.deleteCheckoutFolio = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existing] = await db.query('SELECT folio_id FROM Checkout_Folio_Master WHERE folio_id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: "Checkout folio entry not found" });
    }

    const [result] = await db.query('DELETE FROM Checkout_Folio_Master WHERE folio_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Checkout folio entry not found" });
    }

    res.status(200).json({ success: true, message: "Checkout folio entry deleted successfully", data: { folio_id: parseInt(id) } });
  } catch (error) {
    console.error("Error deleting checkout folio entry:", error);
    res.status(500).json({ success: false, message: "Failed to delete checkout folio entry", error: error.message });
  }
};