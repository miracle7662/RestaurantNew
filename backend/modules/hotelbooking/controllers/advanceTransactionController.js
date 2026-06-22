b// backend/controllers/advanceTransactionController.js
// COMPLETE UPDATED VERSION - Fixed table names (guest_folio_master → checkin_guest_folio_master)

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

// ==================== GET ALL ====================
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

// ==================== GET BY ID ====================
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

// ==================== GET SUMMARY (all rooms) ====================
exports.getAdvanceSummary = async (req, res) => {
  try {
    const { checkinId } = req.params;

    const [rows] = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type IN ('Booking Receipt', 'Advance Addition') THEN credit_amount ELSE 0 END), 0) as total_advance_received,
        COALESCE(SUM(CASE WHEN transaction_type = 'Advance Posting' THEN debit_amount ELSE 0 END), 0) as total_advance_used,
        COALESCE(SUM(CASE WHEN transaction_type = 'Advance Refund'  THEN debit_amount ELSE 0 END), 0) as total_advance_refunded,
        0 as total_advance_cancelled
      FROM advance_transactions 
      WHERE checkin_id = ? AND status = 'active'
    `, [checkinId]);

    const totalReceived   = parseDecimal(rows[0]?.total_advance_received);
    const totalUsed       = parseDecimal(rows[0]?.total_advance_used);
    const totalRefunded   = parseDecimal(rows[0]?.total_advance_refunded);
    const totalCancelled  = 0;
    const pendingAdvance  = totalReceived - totalUsed - totalRefunded - totalCancelled;

    res.json({
      success: true,
      data: {
        total_advance_received: totalReceived,
        total_advance_used: totalUsed,
        total_advance_refunded: totalRefunded,
        total_advance_cancelled: totalCancelled,
        pending_advance: pendingAdvance
      }
    });
  } catch (error) {
    console.error('Error in getAdvanceSummary:', error);
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// ==================== GET SUMMARY (per room) ====================
exports.getAdvanceSummaryForRoom = async (req, res) => {
  try {
    const { checkinId, roomId } = req.params;

    const [rows] = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type IN ('Booking Receipt', 'Advance Addition') THEN credit_amount ELSE 0 END), 0) as total_advance_received,
        COALESCE(SUM(CASE WHEN transaction_type = 'Advance Posting' THEN debit_amount ELSE 0 END), 0) as total_advance_used,
        COALESCE(SUM(CASE WHEN transaction_type = 'Advance Refund'  THEN debit_amount ELSE 0 END), 0) as total_advance_refunded,
        0 as total_advance_cancelled
      FROM advance_transactions 
      WHERE checkin_id = ? AND room_id = ? AND status = 'active'
    `, [checkinId, roomId]);

    const totalReceived   = parseDecimal(rows[0]?.total_advance_received);
    const totalUsed       = parseDecimal(rows[0]?.total_advance_used);
    const totalRefunded   = parseDecimal(rows[0]?.total_advance_refunded);
    const totalCancelled  = 0;
    const pendingAdvance  = totalReceived - totalUsed - totalRefunded - totalCancelled;

    res.json({
      success: true,
      data: {
        total_advance_received: totalReceived,
        total_advance_used: totalUsed,
        total_advance_refunded: totalRefunded,
        total_advance_cancelled: totalCancelled,
        pending_advance: pendingAdvance
      }
    });
  } catch (error) {
    console.error('Error in getAdvanceSummaryForRoom:', error);
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// ==================== GET AVAILABLE ADVANCE ====================
exports.getAvailableAdvance = async (req, res) => {
  try {
    const { checkinId } = req.params;
    const { room_id } = req.query;

    let pendingAdvance;
    if (room_id) {
      pendingAdvance = await calculatePendingAdvanceForRoom(checkinId, parseInt(room_id));
    } else {
      pendingAdvance = await calculatePendingAdvance(checkinId);
    }

    let query = `
      SELECT * FROM advance_transactions
      WHERE checkin_id = ? 
        AND status = 'active' 
        AND transaction_type IN ('Booking Receipt', 'Advance Addition')
        AND credit_amount > 0
    `;
    const params = [checkinId];

    if (room_id) {
      query += ` AND room_id = ?`;
      params.push(room_id);
    }

    query += ` ORDER BY transaction_datetime ASC`;
    const [transactions] = await db.query(query, params);

    let usageQuery = `
      SELECT reference_no, SUM(debit_amount) as used_amount
      FROM advance_transactions 
      WHERE checkin_id = ? 
        AND transaction_type = 'Advance Posting' 
        AND status = 'active'
        AND reference_no IS NOT NULL 
        AND reference_no != ''
    `;
    let usageParams = [checkinId];

    if (room_id) {
      usageQuery += ` AND room_id = ?`;
      usageParams.push(room_id);
    }
    usageQuery += ` GROUP BY reference_no`;

    const [usageEntries] = await db.query(usageQuery, usageParams);

    const usedMap = new Map();
    usageEntries.forEach(entry => {
      const receiptNos = entry.reference_no.split(',');
      const perReceiptAmount = parseDecimal(entry.used_amount) / receiptNos.length;
      receiptNos.forEach(no => {
        usedMap.set(no.trim(), (usedMap.get(no.trim()) || 0) + perReceiptAmount);
      });
    });

    const availableTransactions = transactions.map(t => {
      const used = usedMap.get(t.receipt_no) || 0;
      return {
        advance_id: t.advance_id,
        receipt_no: t.receipt_no,
        credit_amount: parseDecimal(t.credit_amount),
        available_balance: parseDecimal(t.credit_amount) - used
      };
    }).filter(t => t.available_balance > 0);

    res.json({
      success: true,
      data: {
        available_advance: pendingAdvance,
        transactions: availableTransactions
      }
    });
  } catch (error) {
    console.error('Error in getAvailableAdvance:', error);
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// ==================== CREATE ADVANCE TRANSACTION ====================
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


    // Normalize hotel id (DB column is hotel_id)
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

    // IMPORTANT: use normalizedHotelId in all DB inserts
    // (prevents ER_BAD_NULL_ERROR: Column 'hotel_id' cannot be null)
    const hotelIdForDb = normalizedHotelId;



    const userId = created_by_id || getCurrentUserId(req) || 1;
    const now = new Date();

    const formattedTransactionDateTime = transaction_datetime
      ? formatMySQLDateTime(transaction_datetime)
      : formatMySQLDateTime(now);

    let finalReceiptNo = receipt_no;
    if (!finalReceiptNo) {
      finalReceiptNo = await generateReceiptNo(hotelIdForDb, transaction_type);
    }


    let finalPaymentMethod = payment_method || 'Cash';
    if ((transaction_type === 'Advance Addition' || transaction_type === 'Booking Receipt') && items && items.length > 0) {
      finalPaymentMethod = determinePaymentMethod(items, payment_method || 'Cash');
    }
    if (transaction_type === 'Advance Refund' && refund_items && refund_items.length > 0) {
      finalPaymentMethod = determinePaymentMethod(refund_items, payment_method || 'Cash');
    }

    console.log(`Transaction: ${transaction_type}, Receipt No: ${finalReceiptNo}, Payment Method: ${finalPaymentMethod}`);

    let currentBalance;
    if (room_id) {
      currentBalance = await calculatePendingAdvanceForRoom(checkin_id, room_id);
    } else {
      currentBalance = await calculatePendingAdvance(checkin_id);
    }

    const finalCreditAmount = parseDecimal(credit_amount);
    const finalDebitAmount  = parseDecimal(debit_amount);

    let newBalance = currentBalance;
    if (finalCreditAmount > 0) {
      newBalance = currentBalance + finalCreditAmount;
    } else if (finalDebitAmount > 0) {
      newBalance = currentBalance - finalDebitAmount;
    }

    const [result] = await connection.query(`
      INSERT INTO advance_transactions (
        hotel_id, checkin_id, detail_id, room_id, guest_name, room_no,
        transaction_type, receipt_no, payment_method, amount,
        debit_amount, credit_amount, balance_amount, reason, narration,
        reference_no, transaction_datetime, status, created_by_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, NOW())
    `, [
      hotelIdForDb,
      checkin_id,

      detail_id || null,
      room_id || null,
      guest_name,
      room_no,
      transaction_type,
      finalReceiptNo,
      finalPaymentMethod,
      parseDecimal(amount),
      finalDebitAmount,
      finalCreditAmount,
      newBalance,
      reason || null,
      narration || null,
      reference_no || null,
      formattedTransactionDateTime,
      userId
    ]);

    const advanceId = result.insertId;

    if (transaction_type === 'Advance Cancel' && cancel_items && cancel_items.length > 0) {
      for (const cancelItem of cancel_items) {
        if (cancelItem.advance_id) {
          await connection.query(
            `UPDATE advance_transactions 
             SET status = 'cancelled', updated_at = NOW() 
             WHERE advance_id = ?`,
            [cancelItem.advance_id]
          );
        }
      }
    }

    if (transaction_type === 'Advance Refund' && selected_refunds && selected_refunds.length > 0) {
      for (const refundItem of selected_refunds) {
        if (refundItem.advance_id) {
          const [txRow] = await connection.query(
            `SELECT credit_amount FROM advance_transactions WHERE advance_id = ?`,
            [refundItem.advance_id]
          );
          if (txRow && txRow[0]) {
            const originalAmt = parseDecimal(txRow[0].credit_amount);
            const refundedAmt = parseDecimal(refundItem.amt);
            if (refundedAmt >= originalAmt) {
              await connection.query(
                `UPDATE advance_transactions 
                 SET status = 'refunded', updated_at = NOW() 
                 WHERE advance_id = ?`,
                [refundItem.advance_id]
              );
            }
          }
        }
      }
    }

    let folioTransactionType = '';
    let folioDescription     = '';
    let folioDebit           = 0;
    let folioCredit          = 0;

    // ✅ UI mapping (RoomDetailSummary.tsx):
    // - check-in on day 1 should show: "Check-in Day"
    // - day extension usage should show: "Day Extend"
    //
    // Backend source of truth for Advance description is advance_transactions.reason/narration;
    // but RoomDetailSummary uses advance_transactions.transaction_type to label.
    // So we standardize narration so UI gets consistent string.
    const normalizedReason = reason || narration || null;

    const setNarrationForDay = (type) => {
      if (type === 'Checkin Day') return 'Check-in Day';
      if (type === 'Day Extend') return 'Day Extend';
      return normalizedReason;
    };


    switch (transaction_type) {
      case 'Booking Receipt':
        folioTransactionType = 'Advance Receipt';
        folioDescription = `Advance receipt for Room ${room_no || 'N/A'} - Advance Payment`;
        folioCredit = finalCreditAmount;
        break;
      case 'Advance Addition':
        folioTransactionType = 'Advance Addition';
        folioDescription = reason || `Advance addition for Room ${room_no || 'N/A'} - Extra payment`;
        folioCredit = finalCreditAmount;
        break;
      case 'Advance Refund':
        folioTransactionType = 'Advance Refund';
        folioDescription = `Advance refund for Room ${room_no || 'N/A'} - ${reason || 'Customer request'}`;
        folioDebit = finalDebitAmount;
        break;
      case 'Advance Cancel':
        folioTransactionType = 'Advance Cancellation';
        folioDescription = `Advance cancellation for Room ${room_no || 'N/A'} - ${reason || 'Cancellation request'}`;
        folioDebit = finalDebitAmount;
        break;
      case 'Advance Posting':
        folioTransactionType = 'Advance Usage';
        folioDescription = `Advance posted to room ${room_no || 'N/A'} charges - ${reason || 'Room charge adjustment'}`;
        folioDebit = finalDebitAmount;
        break;
    }

    // FIXED: Use the correct table name 'checkin_guest_folio_master' instead of 'guest_folio_master'
    await connection.query(`
      INSERT INTO checkin_guest_folio_master (
        checkin_id, hotel_id, detail_id, transaction_type, transaction_datetime,
        description, debit_amount, credit_amount, reference_number, payment_method,
        created_by_id, created_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      checkin_id,
      hotelIdForDb,

      detail_id || null,
      folioTransactionType,
      formattedTransactionDateTime,
      folioDescription,
      folioDebit,
      folioCredit,
      finalReceiptNo,
      finalPaymentMethod,
      userId
    ]);

    if (transaction_type === 'Advance Addition' || transaction_type === 'Booking Receipt') {
      const [checkinRow] = await connection.query(
        'SELECT total_amount FROM CheckIn_Master WHERE checkin_id = ?',
        [checkin_id]
      );
      const currentTotal = parseDecimal(checkinRow[0]?.total_amount);
      const newTotal = currentTotal + finalCreditAmount;
      await connection.query(
        'UPDATE CheckIn_Master SET total_amount = ?, updated_by_id = ?, updated_date = NOW() WHERE checkin_id = ?',
        [newTotal, userId, checkin_id]
      );
    }

    if (transaction_type === 'Advance Cancel' || transaction_type === 'Advance Refund') {
      const [checkinRow] = await connection.query(
        'SELECT total_amount FROM CheckIn_Master WHERE checkin_id = ?',
        [checkin_id]
      );
      const currentTotal = parseDecimal(checkinRow[0]?.total_amount);
      const newTotal = Math.max(0, currentTotal - finalDebitAmount);
      await connection.query(
        'UPDATE CheckIn_Master SET total_amount = ?, updated_by_id = ?, updated_date = NOW() WHERE checkin_id = ?',
        [newTotal, userId, checkin_id]
      );
    }

    await connection.commit();

    const [newTransaction] = await connection.query(
      'SELECT * FROM advance_transactions WHERE advance_id = ?',
      [advanceId]
    );

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

// ==================== UPDATE ====================
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

// ==================== DELETE ====================
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

// ==================== ROOM SWAP (FIXED - advance stays with GUEST not room) ====================
//
// WHAT THIS FUNCTION DOES:
// When rooms are swapped (Rohit in 101 ↔ Prasad in 102):
//   - Rohit physically moves from Room 101 → Room 102
//   - Prasad physically moves from Room 102 → Room 101
//
// CORRECT BEHAVIOUR: Advances must follow the GUEST, not the room number.
//   - Rohit's ₹1000 advance: keep checkin_id (Rohit's), update room_id/room_no to Room 102
//   - Prasad's ₹2000 advance: keep checkin_id (Prasad's), update room_id/room_no to Room 101
//
// ALSO: checkin_guest_folio_master rows for these advances are linked via reference_number = receipt_no.
//       Their checkin_id must NOT change (the guest hasn't changed), but the description is
//       updated to note the room change for the audit trail.
//
// DATABASE TRANSACTION: START → park A → move B → unpark A → update folio → COMMIT / ROLLBACK
//
exports.swapAdvanceBetweenRooms = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      room_a_checkin_id,   // Rohit's checkin_id  (currently in Room 101)
      room_a_room_id,      // Room 101's room_id
      room_a_room_no,      // "101"
      room_b_checkin_id,   // Prasad's checkin_id (currently in Room 102)
      room_b_room_id,      // Room 102's room_id
      room_b_room_no,      // "102"
    } = req.body;

    console.log('=== swapAdvanceBetweenRooms (FIXED) ===');
    console.log('Input:', { room_a_checkin_id, room_a_room_id, room_a_room_no, room_b_checkin_id, room_b_room_id, room_b_room_no });

    // ── Validate all required fields ─────────────────────────────────────────
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

    // ── Guard: same room_id is an error ──────────────────────────────────────
    if (Number(room_a_room_id) === Number(room_b_room_id)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot swap: both rooms have the same room_id',
      });
    }

    // ── Fetch guest names for audit descriptions ──────────────────────────────
    const [checkinARows] = await connection.query(
      `SELECT guest_name, hotelid FROM CheckIn_Master WHERE checkin_id = ?`,
      [room_a_checkin_id]
    );
    const [checkinBRows] = await connection.query(
      `SELECT guest_name FROM CheckIn_Master WHERE checkin_id = ?`,
      [room_b_checkin_id]
    );

    const guestNameA = checkinARows[0]?.guest_name || '';
    const guestNameB = checkinBRows[0]?.guest_name || '';
    const hotelId    = checkinARows[0]?.hotelid || null;

    console.log(`Guest A: "${guestNameA}" (checkin ${room_a_checkin_id}, Room ${room_a_room_no}) → moving to Room ${room_b_room_no}`);
    console.log(`Guest B: "${guestNameB}" (checkin ${room_b_checkin_id}, Room ${room_b_room_no}) → moving to Room ${room_a_room_no}`);

    // ── Fetch Guest A's advance transactions (bound to their checkin + current room) ──
    const [rowsA] = await connection.query(
      `SELECT advance_id, receipt_no, room_id, room_no, checkin_id, credit_amount,
              debit_amount, transaction_type, status
       FROM advance_transactions
       WHERE checkin_id = ?
         AND (room_id = ? OR room_no = ?)
         AND status IN ('active', 'posted')`,
      [room_a_checkin_id, room_a_room_id, room_a_room_no]
    );

    // ── Fetch Guest B's advance transactions (bound to their checkin + current room) ──
    const [rowsB] = await connection.query(
      `SELECT advance_id, receipt_no, room_id, room_no, checkin_id, credit_amount,
              debit_amount, transaction_type, status
       FROM advance_transactions
       WHERE checkin_id = ?
         AND (room_id = ? OR room_no = ?)
         AND status IN ('active', 'posted')`,
      [room_b_checkin_id, room_b_room_id, room_b_room_no]
    );

    const idsA = rowsA.map(r => r.advance_id);
    const idsB = rowsB.map(r => r.advance_id);

    console.log(`Guest A advances (${idsA.length}):`, rowsA.map(r => ({ id: r.advance_id, credit: r.credit_amount, room: r.room_no })));
    console.log(`Guest B advances (${idsB.length}):`, rowsB.map(r => ({ id: r.advance_id, credit: r.credit_amount, room: r.room_no })));

    if (idsA.length === 0 && idsB.length === 0) {
      await connection.commit();
      return res.json({
        success: true,
        message: 'No advance transactions found in either room — room data swapped, no advance movement needed',
        data: { swapped_a: 0, swapped_b: 0 },
        swapped_a: 0,
        swapped_b: 0,
      });
    }

    // ────────────────────────────────────────────────────────────────────────
    // CORRECT SWAP LOGIC:
    //   Guest A's advances: checkin_id stays the SAME (Rohit is still Rohit),
    //                       only room_id/room_no updates to Room B (his new room).
    //   Guest B's advances: checkin_id stays the SAME (Prasad is still Prasad),
    //                       only room_id/room_no updates to Room A (his new room).
    //
    // We must use a temporary sentinel to avoid a unique-constraint collision
    // if any index covers (checkin_id, room_id) during the two-step update.
    // ────────────────────────────────────────────────────────────────────────

    const SENTINEL_ROOM_ID = -999;  // Impossible room_id used as a temporary parking spot
    const SENTINEL_ROOM_NO = '__SWAP_TMP__';

    // STEP 1: Park Guest A's advances at the sentinel room so that step 2
    //         won't conflict with any (checkin_id, room_id) constraints.
    if (idsA.length > 0) {
      const ph = idsA.map(() => '?').join(',');
      await connection.query(
        `UPDATE advance_transactions
         SET room_id  = ?,
             room_no  = ?,
             updated_at = NOW()
         WHERE advance_id IN (${ph})`,
        [SENTINEL_ROOM_ID, SENTINEL_ROOM_NO, ...idsA]
      );
      console.log(`Step 1: Parked ${idsA.length} advances for Guest A (Room ${room_a_room_no}) at sentinel`);
    }

    // STEP 2: Update Guest B's advances → Guest B keeps their checkin_id,
    //         but their room_id/room_no change to Room A (their new physical room).
    if (idsB.length > 0) {
      const ph = idsB.map(() => '?').join(',');
      await connection.query(
        `UPDATE advance_transactions
         SET room_id   = ?,
             room_no   = ?,
             guest_name = ?,
             updated_at = NOW()
         WHERE advance_id IN (${ph})`,
        [room_a_room_id, room_a_room_no, guestNameB, ...idsB]
      );
      console.log(`Step 2: Moved ${idsB.length} advances for Guest B to Room ${room_a_room_no} (their new room)`);
    }

    // STEP 3: Unpark Guest A's advances → Guest A keeps their checkin_id,
    //         but their room_id/room_no change to Room B (their new physical room).
    if (idsA.length > 0) {
      await connection.query(
        `UPDATE advance_transactions
         SET room_id   = ?,
             room_no   = ?,
             guest_name = ?,
             updated_at = NOW()
         WHERE room_no = ? AND room_id = ? AND status IN ('active', 'posted')`,
        [room_b_room_id, room_b_room_no, guestNameA, SENTINEL_ROOM_NO, SENTINEL_ROOM_ID]
      );
      console.log(`Step 3: Moved ${idsA.length} advances for Guest A to Room ${room_b_room_no} (their new room)`);
    }

    // ── Update checkin_guest_folio_master — AUDIT TRAIL ONLY ─────────────────────────
    //
    // The folio rows for advance transactions are linked via reference_number = receipt_no.
    // checkin_id stays the same (guest hasn't changed); we only append a description note
    // showing which room the guest moved to, for the audit trail.
    //
    const receiptNosA = rowsA.map(r => r.receipt_no).filter(Boolean);
    const receiptNosB = rowsB.map(r => r.receipt_no).filter(Boolean);

    if (receiptNosA.length > 0) {
      const ph = receiptNosA.map(() => '?').join(',');
      await connection.query(
        `UPDATE checkin_guest_folio_master
         SET description  = CONCAT('[Room Swap] Guest "${guestNameA}" moved ${room_a_room_no}→${room_b_room_no}. ', description),
             updated_date = NOW()
         WHERE reference_number IN (${ph})
           AND checkin_id = ?`,
        [...receiptNosA, room_a_checkin_id]
      );
      console.log(`Updated ${receiptNosA.length} folio entries for Guest A (audit note, checkin_id unchanged)`);
    }

    if (receiptNosB.length > 0) {
      const ph = receiptNosB.map(() => '?').join(',');
      await connection.query(
        `UPDATE checkin_guest_folio_master
         SET description  = CONCAT('[Room Swap] Guest "${guestNameB}" moved ${room_b_room_no}→${room_a_room_no}. ', description),
             updated_date = NOW()
         WHERE reference_number IN (${ph})
           AND checkin_id = ?`,
        [...receiptNosB, room_b_checkin_id]
      );
      console.log(`Updated ${receiptNosB.length} folio entries for Guest B (audit note, checkin_id unchanged)`);
    }

    // ── Commit ────────────────────────────────────────────────────────────────
    await connection.commit();
    console.log('=== Swap committed successfully ===');

    // Build a human-readable result message
    let parts = [];
    if (idsA.length > 0) parts.push(`"${guestNameA}" moved ${room_a_room_no}→${room_b_room_no} with ${idsA.length} advance(s)`);
    if (idsB.length > 0) parts.push(`"${guestNameB}" moved ${room_b_room_no}→${room_a_room_no} with ${idsB.length} advance(s)`);
    const message = parts.length > 0
      ? parts.join('; ')
      : 'Rooms swapped; no advances found to move.';

    res.json({
      success: true,
      message,
      data: { swapped_a: idsA.length, swapped_b: idsB.length },
      swapped_a: idsA.length,
      swapped_b: idsB.length,
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

// ==================== ROOM TRANSFER ====================
// When a guest transfers from one room to another (single guest, no swap),
// their advance transactions follow them to the new room_id / room_no.
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

    const [transactions] = await connection.query(
      `SELECT advance_id, receipt_no FROM advance_transactions
       WHERE checkin_id = ? AND room_id = ? AND status IN ('active', 'posted')`,
      [checkin_id, old_room_id]
    );

    if (!transactions || transactions.length === 0) {
      await connection.commit();
      return res.json({ success: true, message: 'No advance transactions to transfer', transferred: 0, data: { transferred: 0 } });
    }

    const receiptNos = transactions.map(t => t.receipt_no).filter(Boolean);

    // Update advance_transactions: keep checkin_id, update room reference only
    const [result] = await connection.query(
      `UPDATE advance_transactions 
       SET room_id = ?, room_no = ?, updated_at = NOW() 
       WHERE checkin_id = ? AND room_id = ? AND status IN ('active', 'posted')`,
      [new_room_id, new_room_no, checkin_id, old_room_id]
    );

    // Update folio audit description (checkin_id stays the same)
    if (receiptNos.length > 0) {
      const ph = receiptNos.map(() => '?').join(',');
      await connection.query(
        `UPDATE checkin_guest_folio_master
         SET description  = CONCAT('[Transferred to Room ${new_room_no}] ', description),
             updated_date = NOW()
         WHERE reference_number IN (${ph})
           AND checkin_id = ?`,
        [...receiptNos, checkin_id]
      );
      console.log(`Updated ${receiptNos.length} folio entries for transferred advances`);
    }

    await connection.commit();

    res.json({
      success: true,
      message: `${result.affectedRows} advance transaction(s) transferred from room_id ${old_room_id} to room_id ${new_room_id} (${new_room_no})`,
      transferred: result.affectedRows,
      data: { transferred: result.affectedRows }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error transferring advance to room:', error);
    res.status(500).json({ success: false, message: 'Failed to transfer advance transactions', error: error.message });
  } finally {
    connection.release();
  }
};