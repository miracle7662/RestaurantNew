// checkoutPaymentController.js - Updated (removed 6 tax fields)
const db = require('../../../config/db');

const getCurrentUserId = (req) => req.user?.id || null;
const getCurrentUserHotelId = (req) => req.user?.hotelid || null;


const safeDecimal = (value) => {
  if (value === null || value === undefined) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

const getCleaningStatusId = async (connection) => {
  const [statuses] = await connection.query(
    "SELECT room_status_id FROM room_status WHERE LOWER(status_name) = 'cleaning' LIMIT 1"
  );
  if (statuses.length > 0) return statuses[0].room_status_id;
  
  const [altStatuses] = await connection.query(
    "SELECT room_status_id FROM room_status WHERE LOWER(status_name) IN ('cleaning', 'dirty', 'clean') LIMIT 1"
  );
  return altStatuses.length > 0 ? altStatuses[0].room_status_id : 2;
};

const getAvailableStatusId = async (connection) => {
  const [statuses] = await connection.query(
    "SELECT room_status_id FROM room_status WHERE LOWER(status_name) = 'available' LIMIT 1"
  );
  if (statuses.length > 0) return statuses[0].room_status_id;
  
  const [altStatuses] = await connection.query(
    "SELECT room_status_id FROM room_status WHERE LOWER(status_name) IN ('available', 'vacant', 'free') LIMIT 1"
  );
  return altStatuses.length > 0 ? altStatuses[0].room_status_id : 1;
};


const getOccupiedStatusId = async (connection) => {
  const [statuses] = await connection.query(
    "SELECT room_status_id FROM room_status WHERE LOWER(status_name) = 'occupied' LIMIT 1"
  );
  if (statuses.length > 0) return statuses[0].room_status_id;
  
  const [altStatuses] = await connection.query(
    "SELECT room_status_id FROM room_status WHERE LOWER(status_name) IN ('occupied', 'booked', 'in_house') LIMIT 1"
  );
  return altStatuses.length > 0 ? altStatuses[0].room_status_id : 2;
};

const getSettlementStatusId = async (connection) => {
  const [statuses] = await connection.query(
    "SELECT room_status_id FROM room_status WHERE LOWER(status_name) = 'settlement' LIMIT 1"
  );
  if (statuses.length > 0) return statuses[0].room_status_id;
  
  // If 'settlement' doesn't exist, try alternative
  const [altStatuses] = await connection.query(
    "SELECT room_status_id FROM room_status WHERE LOWER(status_name) IN ('settlement', 'checkout', 'bill') LIMIT 1"
  );
  return altStatuses.length > 0 ? altStatuses[0].room_status_id : null;
};


const generateNextInvoiceNo = async (connection) => {
  const [rows] = await connection.query(`
    SELECT MAX(CAST(ldg_bill_no AS UNSIGNED)) AS max_no
    FROM Checkout_Master
    WHERE ldg_bill_no IS NOT NULL
      AND ldg_bill_no REGEXP '^[0-9]+$'
  `);
  const maxNo = rows[0]?.max_no || 0;
  const nextNo = maxNo + 1;
  return String(nextNo).padStart(4, '0');
};

const safeValue = (value) => {
  if (value === null || value === undefined) return null;
  return value;
};

const safeNumber = (value) => {
  if (value === null || value === undefined) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

const formatDateTime = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) {
    return dateValue.toISOString().slice(0, 19).replace('T', ' ');
  }
  if (typeof dateValue === 'string' && dateValue.includes('T')) {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 19).replace('T', ' ');
    }
  }
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  return dateValue;
};
// GET all checkout payments
exports.getCheckoutPayments = async (req, res) => {
  try {
    const { checkout_id, checkin_id } = req.query;
    let hotelId = req.query.hotelid || getCurrentUserHotelId(req);

    let query = `SELECT * FROM Checkout_Payment_Master`;
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
    
    if (conditions.length) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    
    query += ` ORDER BY payment_id DESC`;

    const [payments] = await db.query(query, params);
    res.json({ success: true, data: payments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

// GET checkout payment by ID
exports.getCheckoutPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const [payments] = await db.query('SELECT * FROM Checkout_Payment_Master WHERE payment_id = ?', [id]);
    const payment = payments[0];
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Checkout payment not found' });
    }
    res.json({ success: true, data: payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

// GET checkout payments by checkout_id
exports.getCheckoutPaymentsByCheckoutId = async (req, res) => {
  try {
    const { checkout_id } = req.params;
    const [payments] = await db.query(
      'SELECT * FROM Checkout_Payment_Master WHERE checkout_id = ? ORDER BY payment_id DESC',
      [checkout_id]
    );
    res.json({ success: true, data: payments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

// CREATE checkout payment (UPDATED - removed 6 tax fields)
exports.addCheckoutPayment = async (req, res) => {
  try {
    const {
      checkout_id,
      checkin_id,
      total_amount,
      payment_method,
      round_off_amount,
      net_payable,
      created_by_id,
      
    } = req.body;

    const userId = created_by_id || getCurrentUserId(req);
    const created_date = new Date();

    const [result] = await db.query(`
      INSERT INTO Checkout_Payment_Master (
        checkout_id, checkin_id, total_amount, payment_method,
        round_off_amount, net_payable,
        transaction_datetime, created_by_id, created_date,
        
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?,  ?)
        transaction_datetime, created_by_id, created_date
        
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      checkout_id, checkin_id, total_amount || 0, payment_method || 'Cash',
      round_off_amount || 0, net_payable || total_amount || 0,
      created_date, userId, created_date,
      
      
    ]);


    res.status(201).json({
      success: true,
      message: 'Checkout payment recorded successfully',
      data: { payment_id: result.insertId, ...req.body }
    });
  } catch (error) {
    console.error('Error adding checkout payment:', error);
    res.status(500).json({ success: false, message: 'Failed to add checkout payment', error: error.message });
  }
};

// DELETE checkout payment
exports.deleteCheckoutPayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existing] = await db.query('SELECT payment_id FROM Checkout_Payment_Master WHERE payment_id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: 'Checkout payment not found' });
    }

    const [result] = await db.query('DELETE FROM Checkout_Payment_Master WHERE payment_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Checkout payment not found' });
    }

    res.status(200).json({ success: true, message: 'Checkout payment deleted successfully', data: { payment_id: parseInt(id) } });
  } catch (error) {
    console.error('Error deleting checkout payment:', error);
    res.status(500).json({ success: false, message: 'Failed to delete checkout payment', error: error.message });
  }
};

module.exports = exports;