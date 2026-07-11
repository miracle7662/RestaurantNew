const db = require('../../../config/db');

// Helper: MySQL datetime now
const nowMySQL = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

// ==================== CREATE ====================
// exports.createSettlement = async (req, res) => {
//   try {
//     const {
//      userid, PaymentTypeID, PaymentType, Amount,
//       TipAmount = 0, Batch = '', Name, HotelID, RefferedBy = '',
//       customerid = null, CustomerName = '', MobileNo = '', Address = '',
//       Refund = 0, Receive = 0, Name2 = '', Name3 = '', table_name = 'room',
//       outletid, outletname = '', guest_id = null, guest_name = '',
//       discount = 0, total_advance = 0, total_amount, bill_no = null,
//       registration_no = null, room_name = '', checkinid,
//       created_by_id, updated_by_id, checkout_date = null
//     } = req.body;

//     // Required fields check
//     if (!userid || !PaymentTypeID || !PaymentType || !Amount || !HotelID || !outletid || !total_amount || !checkinid) {
//       return res.status(400).json({ success: false, message: 'Missing required fields' });
//     }

//     const insertData = {
      
//       userid,
//       PaymentTypeID,
//       PaymentType,
//       Amount,
//       TipAmount,
//       Batch,
//       Name: Name || guest_name,
//       HotelID,
//       InsertDate: nowMySQL(),
//       is_settle: 1,
//       RefferedBy,
//       customerid,
//       CustomerName: CustomerName || guest_name,
//       MobileNo,
//       Address,
//       Refund,
//       Receive,
//       Name2,
//       Name3,
//       table_name,
//       outletid,
//       outletname,
//       guest_id,
//       guest_name,
//       discount,
//       total_advance,
//       total_amount,
//       bill_no,
//       registration_no,
//       room_name,
//       checkinid,
//       created_by_id: created_by_id || userid,
//       updated_by_id: updated_by_id || userid,
//       checkout_date
//     };

//     const [result] = await db.query('INSERT INTO ldgsettlement SET ?', [insertData]);
//     const [newRow] = await db.query('SELECT * FROM ldgsettlement WHERE SettlementID = ?', [result.insertId]);

//     res.status(201).json({ success: true, message: 'Settlement created', data: newRow[0] });
//   } catch (error) {
//     console.error('createSettlement error:', error);
//     res.status(500).json({ success: false, message: 'Failed to create settlement' });
//   }
// };
exports.createSettlement = async (req, res) => {
  try {
    console.log("Settlement req.body:", req.body);
    const {
      userid,
      PaymentTypeID,
      PaymentType,
      Amount,
      TipAmount = 0,
      Batch = '',
      Name,
      HotelID,
      RefferedBy = '',
      customerid = null,
      CustomerName = '',
      MobileNo = '',
      Address = '',
      Refund = 0,
      Receive = 0,
      Name2 = '',
      Name3 = '',
      table_name = 'room',
      outletid,
      outletname = '',
      guest_id = null,
      guest_name = '',
      discount = 0,
      total_advance = 0,
      total_amount,
      bill_no = null,
      registration_no = null,
      room_name = '',
      room_id,
      room_ids,                     // ✅ NEW: array of room ids
      checkinid,
      checkout_id,
      created_by_id,
      updated_by_id,
      checkout_date = null,
      checkin_datetime = null,
      checkout_datetime = null,
      total_nights = 1,
      reg_no = null,
      ldg_bill_no = null,
      mobile = '',
      is_settle = 1,
      room_no = ''
    } = req.body;

    // Determine which rooms to settle
    let roomsToSettle = [];

    if (Array.isArray(room_ids) && room_ids.length > 0) {
      roomsToSettle = room_ids.map(Number);
    } else if (typeof room_id === "string" && room_id.includes(",")) {
      roomsToSettle = room_id
        .split(",")
        .map(id => Number(id.trim()))
        .filter(id => !Number.isNaN(id));
    } else if (room_id != null) {
      roomsToSettle = [Number(room_id)];
    }

    // Required fields check (room_id no longer required, but room_ids or room_id must exist)
    if (
      !userid ||
      !PaymentTypeID ||
      !PaymentType ||
      !Amount ||
      !HotelID ||
      !outletid ||
      !total_amount ||
      !checkinid ||
      !checkout_id
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Use the first room_id if multiple rooms are selected
    const primaryRoomId = roomsToSettle.length > 0 ? roomsToSettle[0] : (room_id || null);

    // Only fields that exist in the CREATE TABLE statement
    const insertData = {
      // Checkin/Checkout fields
      checkout_id: checkout_id,
      checkinid: checkinid,
      
      // Bill/Registration
      ldg_bill_no: ldg_bill_no || bill_no || null,
      reg_no: reg_no || registration_no || null,
      registration_no: registration_no || null,
      bill_no: bill_no || null,
      
      // Guest info
      guest_id: guest_id || null,
      guest_name: guest_name || '',
      mobile: mobile || MobileNo || '',
      
      // Room info
      room_id: primaryRoomId,
      room_name: room_name || '',
      room_no: room_no || '',
      
      // Hotel & Outlet
      hotelid: HotelID,
      outletid: outletid,
      outletname: outletname || '',
      
      // Payment
      PaymentTypeID: PaymentTypeID,
      PaymentType: PaymentType,
      Amount: Amount,
      TipAmount: TipAmount || 0,
      Receive: Receive || 0,
      Refund: Refund || 0,
      
      // Amounts
      total_amount: total_amount || 0,
      discount_amount: discount || 0,
      advance_amt: total_advance || 0,
      
      // Status flags
      is_settle: is_settle || 1,
      
      // Dates
      checkin_datetime: checkin_datetime || null,
      checkout_datetime: checkout_datetime || null,
      checkout_date: checkout_date || null,
      total_nights: total_nights || 1,
      
      // User tracking
      userid: userid,
      created_by_id: created_by_id || userid,
      updated_by_id: updated_by_id || userid,
      
      // Timestamps
      InsertDate: nowMySQL(),
      UpdateDate: nowMySQL()
    };

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      // 1. INSERT SETTLEMENT (single record for this payment split)
      const [result] = await conn.query(
        'INSERT INTO ldgsettlement SET ?',
        [insertData]
      );

      // 4. UPDATE checkin_detail_master AND room_master FOR EACH ROOM
      for (const rid of roomsToSettle) {
        await conn.query(
          `UPDATE checkin_detail_master SET is_settle = 1 WHERE checkin_id = ? AND room_id = ?`,
          [checkinid, rid]
        );

        // 2. UPDATE checkout_detail 
        await conn.query(
          `UPDATE checkout_detail SET is_settle = 1 WHERE checkin_id = ? AND room_id = ?`,
          [checkinid, rid]
        );
      
        await conn.query(
          `UPDATE room_master SET room_status_id = 4 WHERE room_id = ?`,  // 4 = Clean/Vacant
          [rid]
        );
      }

      // 5. FETCH INSERTED ROW
      const [newRow] = await conn.query(
        'SELECT * FROM ldgsettlement WHERE SettlementID = ?',
        [result.insertId]
      );

      await conn.commit();

      return res.status(201).json({
        success: true,
        message: `Settlement recorded for ${roomsToSettle.length} room(s)`,
        data: newRow[0]
      });

    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

  } catch (error) {
    console.error('createSettlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create settlement'
    });
  }
};

// ==================== GET (with filters) ====================
exports.getSettlements = async (req, res) => {
  try {
    const {
      hotelId, outletId, checkinId, roomName, guestName,
      fromDate, toDate, paymentType, is_settle = '1'
    } = req.query;

    let where = [];
    let params = [];

    
    if (hotelId) { where.push('HotelID = ?'); params.push(Number(hotelId)); }
    if (outletId) { where.push('outletid = ?'); params.push(Number(outletId)); }
    if (checkinId) { where.push('checkinid = ?'); params.push(Number(checkinId)); }
    if (roomName) { where.push('room_name LIKE ?'); params.push(`%${roomName}%`); }
    if (guestName) { where.push('guest_name LIKE ?'); params.push(`%${guestName}%`); }
    if (fromDate) { where.push('InsertDate >= ?'); params.push(fromDate); }
    if (toDate) { where.push('InsertDate <= ?'); params.push(toDate + ' 23:59:59'); }
    if (paymentType) { where.push('PaymentType = ?'); params.push(paymentType); }
    if (is_settle !== undefined) { where.push('is_settle = ?'); params.push(Number(is_settle)); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `SELECT * FROM ldgsettlement ${whereSql} ORDER BY SettlementID DESC`;
    const [rows] = await db.query(sql, params);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch settlements' });
  }
};

// ==================== GET BY ID ====================
exports.getSettlementById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ldgsettlement WHERE SettlementID = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== UPDATE (with log) ====================
exports.updateSettlement = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      PaymentTypeID,
      PaymentType,
      Amount,
      TipAmount,
      Refund,
      Receive,
      updated_by_id,
      reason = '',
      // --- new fields to support ---
      guest_id,
      guest_name,
      room_id,
      reg_no,
      registration_no,
      bill_no,
      room_name,
      mobile,
      outletid,
      outletname,
      total_amount,
      discount_amount,
      advance_amt,
      checkout_date,
      checkin_datetime,
      checkout_datetime,
      total_nights
    } = req.body;

    // Fetch current record
    const [oldRows] = await db.query('SELECT * FROM ldgsettlement WHERE SettlementID = ? AND is_settle = 1', [id]);
    if (oldRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Settlement not found or already reversed' });
    }
    const old = oldRows[0];

    // Build dynamic update SET clause
    const updates = [];
    const values = [];

    // Helper to add a field if provided
    const addField = (field, value) => {
      if (value !== undefined) {
        updates.push(`${field} = ?`);
        values.push(value);
      }
    };

    addField('PaymentTypeID', PaymentTypeID);
    addField('PaymentType', PaymentType);
    addField('Amount', Amount);
    addField('TipAmount', TipAmount);
    addField('Refund', Refund);
    addField('Receive', Receive);
    addField('updated_by_id', updated_by_id);

    // --- newly added fields ---
    addField('guest_id', guest_id);
    addField('guest_name', guest_name);
    addField('room_id', room_id);
    addField('reg_no', reg_no);
    addField('registration_no', registration_no);
    addField('bill_no', bill_no);
    addField('room_name', room_name);
    addField('mobile', mobile);
    addField('outletid', outletid);
    addField('outletname', outletname);
    addField('total_amount', total_amount);
    addField('discount_amount', discount_amount);
    addField('advance_amt', advance_amt);
    addField('checkout_date', checkout_date);
    addField('checkin_datetime', checkin_datetime);
    addField('checkout_datetime', checkout_datetime);
    addField('total_nights', total_nights);

    // Always update UpdateDate
    updates.push('UpdateDate = ?');
    values.push(nowMySQL());

    if (updates.length === 1) { // only UpdateDate was added
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id); // for WHERE clause

    // Log the change (only payment fields are logged, but you can extend the log table if needed)
    // For now, we log only payment changes (as before)
    if (PaymentType !== undefined || Amount !== undefined) {
      await db.query(`
        INSERT INTO ldgsettlement_log (
          SettlementID,
          OldPaymentType,
          OldAmount,
          NewPaymentType,
          NewAmount,
          EditedBy
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        id,
        old.PaymentType,
        old.Amount,
        PaymentType || old.PaymentType,
        Amount !== undefined ? Amount : old.Amount,
        updated_by_id
      ]);
    }

    // Execute update
    await db.query(`UPDATE ldgsettlement SET ${updates.join(', ')} WHERE SettlementID = ?`, values);

    res.json({ success: true, message: 'Settlement updated' });
  } catch (error) {
    console.error('updateSettlement error:', error);
    res.status(500).json({ success: false, message: 'Failed to update' });
  }
};
// ==================== SOFT DELETE (is_settle = 0) ====================
exports.deleteSettlement = async (req, res) => {
  try {
    const { id } = req.params;
    const { updated_by_id, reason = '' } = req.body;

    const [oldRows] = await db.query('SELECT * FROM ldgsettlement WHERE SettlementID = ? AND is_settle = 1', [id]);
    if (oldRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Settlement not found or already reversed' });
    }
    const old = oldRows[0];

    // Log deletion
    await db.query(`
      INSERT INTO ldgsettlement_log (
        SettlementID, OldPaymentTypeID, OldPaymentType, OldAmount, OldTipAmount, OldRefund, OldReceive,
        UpdatedBy, Reason, ChangeDate, Action
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DELETE')
    `, [id, old.PaymentTypeID, old.PaymentType, old.Amount, old.TipAmount, old.Refund, old.Receive, updated_by_id, reason, nowMySQL()]);

    // Soft delete
    await db.query('UPDATE ldgsettlement SET is_settle = 0, updated_by_id = ? WHERE SettlementID = ?', [updated_by_id, id]);

    res.json({ success: true, message: 'Settlement reversed' });
  } catch (error) {
    console.error('deleteSettlement error:', error);
    res.status(500).json({ success: false, message: 'Failed to reverse' });
  }
};

// ==================== REPLACE (batch by OrderNo or TxnNo) ====================
// ==================== REPLACE (by checkout_id / checkinid / ldg_bill_no) ====================
// ==================== REPLACE (by checkout_id / checkinid / ldg_bill_no) ====================
// ==================== REPLACE (by checkout_id and optional identifiers) ====================
// ==================== REPLACE (by checkout_id, safe conditions) ====================
// Helper: format date to MySQL DATE (YYYY-MM-DD)
// Helper: format date to MySQL DATE (YYYY-MM-DD)
// Helper: format date to MySQL DATE (YYYY-MM-DD)
// Helper: format date to MySQL DATE (YYYY-MM-DD)
const formatDate = (date) => {
  if (!date) return null;

  // If it's already a plain date string "YYYY-MM-DD", return it unchanged
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  // If it's "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss...", extract the date part
  if (typeof date === 'string') {
    const match = date.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      return match[1]; // just the date part
    }
  }

  // Fallback: use Date object but extract local components (not UTC)
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
// ==================== REPLACE (hard delete + global Receive/Refund) ====================
exports.replaceSettlement = async (req, res) => {
  try {
    const {
      checkoutId,
      checkinId,
      ldg_bill_no,
      newSettlements,
      HotelID,
      outletId,
      updated_by_id,
      checkout_date,
      TipAmount: topTipAmount   // top-level tip (if sent)
    } = req.body;

    // Validation
    if (!checkoutId || !Array.isArray(newSettlements) || !HotelID) {
      return res.status(400).json({
        success: false,
        message: 'Missing checkoutId, newSettlements array, or HotelID'
      });
    }

    // Build WHERE clause (safe conditions only)
    const whereConditions = [];
    const whereParams = [];

    whereConditions.push('checkout_id = ?');
    whereParams.push(Number(checkoutId));

    whereConditions.push('hotelid = ?');
    whereParams.push(Number(HotelID));

    if (outletId !== undefined && outletId !== null && !isNaN(Number(outletId))) {
      whereConditions.push('outletid = ?');
      whereParams.push(Number(outletId));
    }

    if (ldg_bill_no) {
      whereConditions.push('ldg_bill_no = ?');
      whereParams.push(String(ldg_bill_no));
    }

    // Only active settlements
    whereConditions.push('is_settle = 1');

    const whereSql = whereConditions.join(' AND ');

    // 1️⃣ Fetch existing active settlements (for logging)
    const [existing] = await db.query(
      `SELECT * FROM ldgsettlement WHERE ${whereSql}`,
      whereParams
    );

    // 2️⃣ Log old records (before deletion)
    for (const old of existing) {
      await db.query(`
        INSERT INTO ldgsettlement_log (
          SettlementID,
          OldPaymentType,
          OldAmount,
          NewPaymentType,
          NewAmount,
          EditedBy
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        old.SettlementID,
        old.PaymentType || '',
        old.Amount || 0,
        null,
        null,
        updated_by_id
      ]);
    }

    // 3️⃣ HARD DELETE old settlements
    await db.query(
      `DELETE FROM ldgsettlement WHERE ${whereSql}`,
      whereParams
    );

    // 4️⃣ Compute global Receive & Refund from the first new settlement
    let receiveAmount = 0;
    let refundAmount = 0;
    if (newSettlements.length > 0) {
      const first = newSettlements[0];
      receiveAmount = Number(first.Receive) || Number(first.received_amount) || 0;
      refundAmount  = Number(first.Refund)  || Number(first.refund_amount)  || 0;
    }

    // 5️⃣ Insert each new settlement
    for (const s of newSettlements) {
      const {
        PaymentTypeID,
        PaymentType,
        Amount,
        TipAmount: sTipAmount = 0,
        customerid,
        CustomerName,
        MobileNo,
        Address,
        Name,
        table_name,  // ignored because column doesn't exist
        outletid: s_outletid,
        outletname,
        guest_id,
        guest_name,
        discount = 0,
        total_advance = 0,
        total_amount,
        bill_no,
        registration_no,
        room_name,
        checkinid: s_checkinid,
        userid,
        room_id,
        room_no,
        mobile,
        reg_no,
        ldg_bill_no: s_ldg_bill_no,
        checkout_id: s_checkout_id
      } = s;

      // Determine tip: use top-level if provided, else per‑settlement
      const tipAmount = topTipAmount !== undefined ? Number(topTipAmount) : (sTipAmount || 0);

      // Credit payment handling (like settlementController)
      const isCredit = PaymentType && PaymentType.toLowerCase() === 'credit';
      const finalGuestId = isCredit ? (guest_id || customerid) : (guest_id || customerid);
      const finalGuestName = isCredit ? (guest_name || CustomerName) : (guest_name || CustomerName);
      const finalMobile = isCredit ? (mobile || MobileNo) : (mobile || MobileNo);

      const finalCheckoutId = s_checkout_id || checkoutId;
      const finalLdgBillNo = s_ldg_bill_no || ldg_bill_no || bill_no || null;
      const finalCheckinId = s_checkinid || checkinId;

      const insertData = {
        checkout_id: finalCheckoutId,
        checkinid: finalCheckinId,
        ldg_bill_no: finalLdgBillNo,
        reg_no: reg_no || registration_no || null,
        registration_no: registration_no || null,
        bill_no: bill_no || null,
        guest_id: finalGuestId || null,
        guest_name: finalGuestName || '',
        mobile: finalMobile || '',
        room_id: room_id || null,
        room_name: room_name || '',
        room_no: room_no || '',
        hotelid: HotelID,
        outletid: s_outletid || outletId,
        outletname: outletname || '',
        PaymentTypeID,
        PaymentType,
        Amount,
        TipAmount: tipAmount,
        Receive: receiveAmount,
        Refund: refundAmount,
        total_amount: total_amount || 0,
        discount_amount: discount || 0,
        advance_amt: total_advance || 0,
        is_settle: 1,
        checkin_datetime: null,
        checkout_datetime: null,
        checkout_date: formatDate(checkout_date),
        total_nights: 1,
        userid: userid || updated_by_id,
        created_by_id: updated_by_id,
        updated_by_id: updated_by_id,
        InsertDate: nowMySQL(),
        UpdateDate: nowMySQL()
      };

      // table_name is NOT included because it doesn't exist in the table

      await db.query('INSERT INTO ldgsettlement SET ?', [insertData]);
    }

    res.json({ success: true, message: 'Settlements replaced successfully' });
  } catch (error) {
    console.error('replaceSettlement error:', error);
    res.status(500).json({ success: false, message: 'Failed to replace settlements' });
  }
};