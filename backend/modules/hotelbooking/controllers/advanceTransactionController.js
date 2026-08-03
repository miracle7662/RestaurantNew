// backend/controllers/advanceTransactionController.js
// COMPLETE UPDATED VERSION - Uses stored procedures for core operations

const db = require('../../../config/db');

const getCurrentUserId = (req) => req.user?.id || null;

// Helper to parse decimal
const parseDecimal = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;
  const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? defaultValue : parsed;
};

// Helper to format datetime for MySQL
const formatMySQLDateTime = (dateValue) => {
  if (!dateValue) return null;

  if (dateValue instanceof Date) {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    const hours = String(dateValue.getHours()).padStart(2, '0');
    const minutes = String(dateValue.getMinutes()).padStart(2, '0');
    const seconds = String(dateValue.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  if (typeof dateValue === 'string') {
    let cleaned = dateValue.replace('Z', '').replace('T', ' ');
    cleaned = cleaned.replace(/\.\d{3}/, '');
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(cleaned)) {
      return cleaned;
    }
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Generate UNIQUE receipt number with timestamp to prevent duplicates
// (Kept as fallback, but the stored procedure also generates one)
const generateReceiptNo = async (hotelId, type) => {
  const prefix = type === 'Booking Receipt' ? 'BR' :
                 type === 'Advance Refund'   ? 'RF' :
                 type === 'Advance Cancel'   ? 'CN' :
                 type === 'Advance Posting'  ? 'PS' : 'AD';
  const now = new Date();
  const year  = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day   = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins  = String(now.getMinutes()).padStart(2, '0');
  const secs  = String(now.getSeconds()).padStart(2, '0');
  const ms    = String(now.getMilliseconds()).padStart(3, '0');

  const uniqueSuffix = `${hours}${mins}${secs}${ms}`;
  const receiptNo = `${prefix}/${year}${month}${day}/${uniqueSuffix}`;

  let isUnique = false;
  let attempt = 0;
  let finalReceiptNo = receiptNo;

  while (!isUnique && attempt < 5) {
    const [existing] = await db.query(
      'SELECT receipt_no FROM advance_transactions WHERE receipt_no = ?',
      [finalReceiptNo]
    );
    if (!existing || existing.length === 0) {
      isUnique = true;
    } else {
      attempt++;
      finalReceiptNo = `${prefix}/${year}${month}${day}/${uniqueSuffix}-${attempt}`;
    }
  }

  return finalReceiptNo;
};

// Calculate pending advance for a specific room within a checkin
// (Kept for any outside use, but the procedure handles it internally)
const calculatePendingAdvanceForRoom = async (checkinId, roomId) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type IN ('Booking Receipt', 'Advance Addition') THEN credit_amount ELSE 0 END), 0) as total_credit,
        COALESCE(SUM(CASE WHEN transaction_type IN ('Advance Posting', 'Advance Refund') THEN debit_amount ELSE 0 END), 0) as total_debit
      FROM advance_transactions
      WHERE checkin_id = ? 
        AND room_id = ?
        AND status = 'active'
    `, [checkinId, roomId]);

    const totalCredit = parseDecimal(rows[0]?.total_credit);
    const totalDebit  = parseDecimal(rows[0]?.total_debit);
    return totalCredit - totalDebit;
  } catch (error) {
    console.error('Error calculating pending advance for room:', error);
    return 0;
  }
};

// Calculate pending advance for a checkin (all rooms combined)
// (Kept for any outside use)
const calculatePendingAdvance = async (checkinId) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type IN ('Booking Receipt', 'Advance Addition') THEN credit_amount ELSE 0 END), 0) as total_credit,
        COALESCE(SUM(CASE WHEN transaction_type IN ('Advance Posting', 'Advance Refund') THEN debit_amount ELSE 0 END), 0) as total_debit
      FROM advance_transactions 
      WHERE checkin_id = ? AND status = 'active'
    `, [checkinId]);

    const totalCredit = parseDecimal(rows[0]?.total_credit);
    const totalDebit  = parseDecimal(rows[0]?.total_debit);
    return totalCredit - totalDebit;
  } catch (error) {
    console.error('Error calculating pending advance:', error);
    return 0;
  }
};

// Helper function to determine payment method from items
const determinePaymentMethod = (items, defaultMethod = 'Cash') => {
  if (!items || items.length === 0) return defaultMethod;
  const uniquePayTypes = [...new Set(items.map(item => item.payType || item.payment_method_name).filter(Boolean))];
  if (uniquePayTypes.length === 1) return uniquePayTypes[0];
  return 'Multiple';
};

// ==================== GET ALL (UNCHANGED) ====================
exports.getAdvanceTransactions = async (req, res) => {
  try {
    const { checkin_id, hotel_id, room_id } = req.query;
    let query = `SELECT * FROM advance_transactions WHERE 1=1`;
    const params = [];

    if (checkin_id) { query += ` AND checkin_id = ?`; params.push(checkin_id); }
    if (hotel_id)   { query += ` AND hotel_id = ?`;   params.push(hotel_id); }
    if (room_id)    { query += ` AND room_id = ?`;     params.push(room_id); }

    query += ` ORDER BY transaction_datetime DESC`;

    const [transactions] = await db.query(query, params);
    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Error in getAdvanceTransactions:', error);
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// ==================== GET BY ID (UNCHANGED) ====================
exports.getAdvanceTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const [transactions] = await db.query(
      'SELECT * FROM advance_transactions WHERE advance_id = ?',
      [id]
    );

    if (!transactions[0]) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, data: transactions[0] });
  } catch (error) {
    console.error('Error in getAdvanceTransactionById:', error);
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// ==================== GET SUMMARY (all rooms) – USES SP ====================
exports.getAdvanceSummary = async (req, res) => {
  try {
    const { checkinId } = req.params;
    const [rows] = await db.query('CALL sp_get_advance_summary(?, NULL)', [checkinId]);
    const summary = rows[0][0] || {};
    res.json({
      success: true,
      data: {
        total_advance_received: parseDecimal(summary.total_advance_received),
        total_advance_used: parseDecimal(summary.total_advance_used),
        total_advance_refunded: parseDecimal(summary.total_advance_refunded),
        total_advance_cancelled: parseDecimal(summary.total_advance_cancelled || 0),
        pending_advance: parseDecimal(summary.pending_advance)
      }
    });
  } catch (error) {
    console.error('Error in getAdvanceSummary:', error);
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// ==================== GET SUMMARY (per room) – USES SP ====================
exports.getAdvanceSummaryForRoom = async (req, res) => {
  try {
    const { checkinId, roomId } = req.params;
    const [rows] = await db.query('CALL sp_get_advance_summary(?, ?)', [checkinId, roomId]);
    const summary = rows[0][0] || {};
    res.json({
      success: true,
      data: {
        total_advance_received: parseDecimal(summary.total_advance_received),
        total_advance_used: parseDecimal(summary.total_advance_used),
        total_advance_refunded: parseDecimal(summary.total_advance_refunded),
        total_advance_cancelled: parseDecimal(summary.total_advance_cancelled || 0),
        pending_advance: parseDecimal(summary.pending_advance)
      }
    });
  } catch (error) {
    console.error('Error in getAdvanceSummaryForRoom:', error);
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// ==================== GET AVAILABLE ADVANCE – USES SP ====================
exports.getAvailableAdvance = async (req, res) => {
  try {
    const { checkinId } = req.params;
    const { room_id } = req.query;
    const [rows] = await db.query('CALL sp_get_available_advance(?, ?)', [checkinId, room_id || null]);
    const transactions = rows[0] || [];
    const totalAvailable = transactions.reduce((sum, t) => sum + parseDecimal(t.available_balance), 0);
    const formatted = transactions.map(t => ({
      advance_id: t.advance_id,
      receipt_no: t.receipt_no,
      credit_amount: parseDecimal(t.credit_amount),
      available_balance: parseDecimal(t.available_balance)
    }));
    res.json({
      success: true,
      data: {
        available_advance: totalAvailable,
        transactions: formatted
      }
    });
  } catch (error) {
    console.error('Error in getAvailableAdvance:', error);
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// ==================== CREATE ADVANCE TRANSACTION – USES SP ====================
exports.addAdvanceTransaction = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      hotelid,
      hotel_id,
      checkin_id,
      detail_id,
      room_id,
      guest_name,
      room_no,
      transaction_type,
      receipt_no,
      payment_method,
      amount,
      debit_amount,
      credit_amount,
      reason,
      narration,
      reference_no,
      transaction_datetime,
      created_by_id,
      items,
      cancel_items,
      selected_refunds,
      posting_items,
      refund_items
    } = req.body;

    // Normalize hotel id
    const normalizedHotelId = hotelid ?? hotel_id ?? null;
    if (!normalizedHotelId) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "hotel_id is required (send 'hotelid' or 'hotel_id' from frontend)",
        error: 'MISSING_HOTEL_ID',
        debug: { hotelid, hotel_id }
      });
    }

    // Auto-fetch detail_id if missing
    let finalDetailId = detail_id || null;
    if (!finalDetailId && checkin_id && room_id) {
      const [rows] = await connection.query(
        `SELECT detail_id FROM checkin_detail_master WHERE checkin_id = ? AND room_id = ? LIMIT 1`,
        [checkin_id, room_id]
      );
      if (rows && rows.length > 0) {
        finalDetailId = rows[0].detail_id;
      }
    }

    const userId = created_by_id || getCurrentUserId(req) || 1;
    const formattedDateTime = transaction_datetime
      ? formatMySQLDateTime(transaction_datetime)
      : formatMySQLDateTime(new Date());

    // Determine payment method
    let finalPaymentMethod = payment_method || 'Cash';
    if ((transaction_type === 'Advance Addition' || transaction_type === 'Booking Receipt') && items && items.length > 0) {
      finalPaymentMethod = determinePaymentMethod(items, payment_method || 'Cash');
    }
    if (transaction_type === 'Advance Refund' && refund_items && refund_items.length > 0) {
      finalPaymentMethod = determinePaymentMethod(refund_items, payment_method || 'Cash');
    }

    // Build comma-separated lists for cancel and refund IDs
    let cancelIds = '';
    if (cancel_items && cancel_items.length > 0) {
      cancelIds = cancel_items
        .filter(item => item.advance_id)
        .map(item => item.advance_id)
        .join(',');
    }

    let refundIds = '';
    if (selected_refunds && selected_refunds.length > 0) {
      refundIds = selected_refunds
        .filter(item => item.advance_id)
        .map(item => item.advance_id)
        .join(',');
    }

    // Set OUT parameter
    await connection.query('SET @new_advance_id = 0');

    // Call stored procedure
    await connection.query(
      `CALL sp_add_advance_transaction(
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, @new_advance_id
      )`,
      [
        normalizedHotelId,
        checkin_id,
        finalDetailId,
        room_id || null,
        guest_name,
        room_no,
        transaction_type,
        receipt_no || null,       // NULL -> auto-generate
        finalPaymentMethod,
        parseDecimal(amount),
        parseDecimal(debit_amount),
        parseDecimal(credit_amount),
        reason || null,
        narration || null,
        reference_no || null,
        formattedDateTime,
        userId,
        cancelIds || null,
        refundIds || null
      ]
    );

    // Retrieve new advance ID
    const [outRows] = await connection.query('SELECT @new_advance_id as new_id');
    const advanceId = outRows[0].new_id;

    // Fetch the newly created transaction
    const [newTransaction] = await connection.query(
      'SELECT * FROM advance_transactions WHERE advance_id = ?',
      [advanceId]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: `${transaction_type} processed successfully`,
      data: newTransaction[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error adding advance transaction:', error);

    if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry')) {
      res.status(409).json({
        success: false,
        message: 'Duplicate receipt number. Please try again.',
        error: 'DUPLICATE_RECEIPT_NO'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to process transaction',
        error: error.message,
        stack: error.stack
      });
    }
  } finally {
    connection.release();
  }
};

// ==================== UPDATE (UNCHANGED) ====================
exports.updateAdvanceTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const [existing] = await db.query('SELECT advance_id FROM advance_transactions WHERE advance_id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const allowedFields = [
      'transaction_type', 'receipt_no', 'payment_method', 'amount',
      'debit_amount', 'credit_amount', 'balance_amount', 'reason',
      'narration', 'reference_no', 'status',
      'room_id', 'room_no'
    ];

    const updates = [];
    const values = [];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const query = `UPDATE advance_transactions SET ${updates.join(', ')} WHERE advance_id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found or no changes' });
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: { advance_id: parseInt(id), ...updateData }
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ success: false, message: 'Failed to update transaction', error: error.message });
  }
};

// ==================== DELETE (UNCHANGED) ====================
exports.deleteAdvanceTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query('SELECT advance_id FROM advance_transactions WHERE advance_id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const [result] = await db.query('DELETE FROM advance_transactions WHERE advance_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, message: 'Transaction deleted successfully', data: { advance_id: parseInt(id) } });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ success: false, message: 'Failed to delete transaction', error: error.message });
  }
};

// ==================== ROOM SWAP – USES SP ====================
exports.swapAdvanceBetweenRooms = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      room_a_checkin_id,
      room_a_room_id,
      room_a_room_no,
      room_b_checkin_id,
      room_b_room_id,
      room_b_room_no
    } = req.body;

    if (
      !room_a_checkin_id || !room_a_room_id || !room_a_room_no ||
      !room_b_checkin_id || !room_b_room_id || !room_b_room_no
    ) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'room_a_checkin_id, room_a_room_id, room_a_room_no, room_b_checkin_id, room_b_room_id, room_b_room_no are all required',
      });
    }

    if (Number(room_a_room_id) === Number(room_b_room_id)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot swap: both rooms have the same room_id',
      });
    }

    // Set OUT parameters
    await connection.query('SET @swapped_a = 0, @swapped_b = 0');

    // Call procedure
    await connection.query(
      'CALL sp_swap_advance_between_rooms(?, ?, ?, ?, ?, ?, @swapped_a, @swapped_b)',
      [
        room_a_checkin_id, room_a_room_id, room_a_room_no,
        room_b_checkin_id, room_b_room_id, room_b_room_no
      ]
    );

    const [outRows] = await connection.query('SELECT @swapped_a as swapped_a, @swapped_b as swapped_b');
    const swapped_a = outRows[0].swapped_a;
    const swapped_b = outRows[0].swapped_b;

    await connection.commit();

    // Build response message
    let parts = [];
    if (swapped_a > 0) {
      const [guestA] = await connection.query('SELECT guest_name FROM CheckIn_Master WHERE checkin_id = ?', [room_a_checkin_id]);
      const nameA = guestA[0]?.guest_name || 'Guest A';
      parts.push(`"${nameA}" moved ${room_a_room_no}→${room_b_room_no} with ${swapped_a} advance(s)`);
    }
    if (swapped_b > 0) {
      const [guestB] = await connection.query('SELECT guest_name FROM CheckIn_Master WHERE checkin_id = ?', [room_b_checkin_id]);
      const nameB = guestB[0]?.guest_name || 'Guest B';
      parts.push(`"${nameB}" moved ${room_b_room_no}→${room_a_room_no} with ${swapped_b} advance(s)`);
    }
    const message = parts.length > 0 ? parts.join('; ') : 'Rooms swapped; no advances found to move.';

    res.json({
      success: true,
      message,
      data: { swapped_a, swapped_b },
      swapped_a,
      swapped_b
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error in swapAdvanceBetweenRooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to swap advance transactions. All changes have been rolled back.',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// ==================== ROOM TRANSFER – USES SP ====================
exports.transferAdvanceToRoom = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { checkin_id, old_room_id, new_room_id, new_room_no } = req.body;

    if (!checkin_id || !old_room_id || !new_room_id || !new_room_no) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'checkin_id, old_room_id, new_room_id, new_room_no are required'
      });
    }

    // Set OUT parameter
    await connection.query('SET @transferred = 0');

    // Call procedure
    await connection.query(
      'CALL sp_transfer_advance_to_room(?, ?, ?, ?, @transferred)',
      [checkin_id, old_room_id, new_room_id, new_room_no]
    );

    const [outRows] = await connection.query('SELECT @transferred as transferred');
    const transferred = outRows[0].transferred;

    await connection.commit();

    res.json({
      success: true,
      message: `${transferred} advance transaction(s) transferred from room_id ${old_room_id} to room_id ${new_room_id} (${new_room_no})`,
      transferred,
      data: { transferred }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error transferring advance to room:', error);
    res.status(500).json({ success: false, message: 'Failed to transfer advance transactions', error: error.message });
  } finally {
    connection.release();
  }
};

