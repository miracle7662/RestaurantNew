// checkoutRoomChargesController.js
const db = require('../../../config/db');

const getCurrentUserHotelId = (req) => req.user?.hotelid || null;

// GET all checkout room charges
exports.getCheckoutRoomCharges = async (req, res) => {
  try {
    const { checkout_id, checkin_id, guest_id, room_id } = req.query;
    let hotelId = req.query.hotelid || getCurrentUserHotelId(req);

    let query = `SELECT * FROM Checkout_Room_Charges`;
    const params = [];
    const conditions = [];

    if (checkout_id) {
      conditions.push(`checkout_id = ?`);
      params.push(checkout_id);
    }
    if (checkin_id) {
      conditions.push(`checkin_id = ?`);
      params.push(checkin_id);
    }
    if (guest_id) {
      conditions.push(`guest_id = ?`);
      params.push(guest_id);
    }
    if (room_id) {
      conditions.push(`room_id = ?`);
      params.push(room_id);
    }
    if (hotelId) {
      // No direct hotel_id column, but we can join later if needed
    }
    
    if (conditions.length) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    
    query += ` ORDER BY created_at DESC`;

    const [charges] = await db.query(query, params);
    res.json({ success: true, data: charges });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

// GET checkout room charge by ID
exports.getCheckoutRoomChargeById = async (req, res) => {
  try {
    const { id } = req.params;
    const [charges] = await db.query('SELECT * FROM Checkout_Room_Charges WHERE charge_id = ?', [id]);
    const charge = charges[0];
    
    if (!charge) {
      return res.status(404).json({ success: false, message: 'Checkout room charge not found' });
    }
    res.json({ success: true, data: charge });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

// GET checkout room charges by checkout_id
exports.getCheckoutRoomChargesByCheckoutId = async (req, res) => {
  try {
    const { checkout_id } = req.params;
    const [charges] = await db.query(
      'SELECT * FROM Checkout_Room_Charges WHERE checkout_id = ? ORDER BY created_at ASC',
      [checkout_id]
    );
    res.json({ success: true, data: charges });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

// DELETE checkout room charge
exports.deleteCheckoutRoomCharge = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existing] = await db.query('SELECT charge_id FROM Checkout_Room_Charges WHERE charge_id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: 'Checkout room charge not found' });
    }

    const [result] = await db.query('DELETE FROM Checkout_Room_Charges WHERE charge_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Checkout room charge not found' });
    }

    res.json({ success: true, message: 'Checkout room charge deleted successfully', data: { charge_id: parseInt(id) } });
  } catch (error) {
    console.error('Error deleting checkout room charge:', error);
    res.status(500).json({ success: false, message: 'Failed to delete checkout room charge', error: error.message });
  }
};