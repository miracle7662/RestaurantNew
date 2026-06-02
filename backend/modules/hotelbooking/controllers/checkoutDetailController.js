// checkoutDetailController.js
const db = require('../../../config/db');

const getCurrentUserHotelId = (req) => req.user?.hotelid || null;

// GET all checkout details
exports.getCheckoutDetails = async (req, res) => {
  try {
    const { checkout_id, checkin_id } = req.query;
    let hotelId = req.query.hotelid || getCurrentUserHotelId(req);

    if (!hotelId && !checkout_id && !checkin_id) {
      return res.status(400).json({ success: false, message: "Hotel ID, checkout_id or checkin_id required" });
    }

    let query = `SELECT * FROM Checkout_Detail`;
    const params = [];

    if (checkout_id) {
      query += ` WHERE checkout_id = ?`;
      params.push(checkout_id);
    } else if (checkin_id) {
      query += ` WHERE checkin_id = ?`;
      params.push(checkin_id);
    } else if (hotelId) {
      query += ` WHERE hotelid = ?`;
      params.push(hotelId);
    }

    query += ` ORDER BY detail_id DESC`;

    const [details] = await db.query(query, params);
    res.json({ success: true, message: "Data fetched successfully", data: details });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// GET checkout detail by ID
exports.getCheckoutDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const [details] = await db.query('SELECT * FROM Checkout_Detail WHERE detail_id = ?', [id]);
    const detail = details[0];
    
    if (!detail) {
      return res.status(404).json({ success: false, message: "Checkout detail not found" });
    }
    res.json({ success: true, message: "Data fetched successfully", data: detail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// GET checkout details by checkout_id
exports.getCheckoutDetailsByCheckoutId = async (req, res) => {
  try {
    const { checkout_id } = req.params;
    const [details] = await db.query(
      'SELECT * FROM Checkout_Detail WHERE checkout_id = ? ORDER BY detail_id ASC',
      [checkout_id]
    );
    res.json({ success: true, message: "Data fetched successfully", data: details });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// DELETE checkout detail
exports.deleteCheckoutDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existing] = await db.query('SELECT detail_id FROM Checkout_Detail WHERE detail_id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: "Checkout detail not found" });
    }

    const [result] = await db.query('DELETE FROM Checkout_Detail WHERE detail_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Checkout detail not found" });
    }

    res.status(200).json({ success: true, message: "Checkout detail deleted successfully", data: { detail_id: parseInt(id) } });
  } catch (error) {
    console.error("Error deleting checkout detail:", error);
    res.status(500).json({ success: false, message: "Failed to delete checkout detail", error: error.message });
  }
};