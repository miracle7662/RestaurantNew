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
//       isSettled: 1,
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
      checkout_date = null
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

    const insertData = {
      userid,
      PaymentTypeID,
      PaymentType,
      Amount,
      TipAmount,
      Batch,
      Name: Name || guest_name,
      HotelID,
      InsertDate: nowMySQL(),
      isSettled: 1,
      RefferedBy,
      customerid,
      CustomerName: CustomerName || guest_name,
      MobileNo,
      Address,
      Refund,
      Receive,
      Name2,
      Name3,
      table_name,
      outletid,
      outletname,
      guest_id,
      guest_name,
      discount,
      total_advance,
      total_amount,
      bill_no,
      registration_no,
      room_name,
      checkinid,
      checkout_id,
      created_by_id: created_by_id || userid,
      updated_by_id: updated_by_id || userid,
      checkout_date
    };

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      // 1. INSERT SETTLEMENT (single record for this payment split)
      const [result] = await conn.query(
        'INSERT INTO ldgsettlement SET ?',
        [insertData]
      );

      // 2. UPDATE checkin_master (once per checkin)
      await conn.query(
        `UPDATE checkin_master SET is_settle = 1 WHERE checkin_id = ?`,
        [checkinid]
      );

      // 3. UPDATE checkout_master (once per checkout)
      await conn.query(
        `UPDATE checkout_master SET is_settle = 1 WHERE checkout_id = ?`,
        [checkout_id]
      );

      // 4. UPDATE checkin_detail_master AND room_master FOR EACH ROOM
      for (const rid of roomsToSettle) {
        await conn.query(
          `UPDATE checkin_detail_master SET is_settle = 1 WHERE checkin_id = ? AND room_id = ?`,
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
      fromDate, toDate, paymentType, isSettled = '1'
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
    if (isSettled !== undefined) { where.push('isSettled = ?'); params.push(Number(isSettled)); }

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
      PaymentTypeID, PaymentType, Amount, TipAmount, Refund, Receive,
      updated_by_id, reason = ''
    } = req.body;

    // Fetch current record
    const [oldRows] = await db.query('SELECT * FROM ldgsettlement WHERE SettlementID = ? AND isSettled = 1', [id]);
    if (oldRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Settlement not found or already reversed' });
    }
    const old = oldRows[0];

    // Log changes (requires ldgsettlement_log table)
    const logSql = `
      INSERT INTO ldgsettlement_log (
        SettlementID, OldPaymentTypeID, OldPaymentType, OldAmount, OldTipAmount, OldRefund, OldReceive,
        NewPaymentTypeID, NewPaymentType, NewAmount, NewTipAmount, NewRefund, NewReceive,
        UpdatedBy, Reason, ChangeDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.query(logSql, [
      id,
      old.PaymentTypeID, old.PaymentType, old.Amount, old.TipAmount, old.Refund, old.Receive,
      PaymentTypeID || old.PaymentTypeID,
      PaymentType || old.PaymentType,
      Amount !== undefined ? Amount : old.Amount,
      TipAmount !== undefined ? TipAmount : old.TipAmount,
      Refund !== undefined ? Refund : old.Refund,
      Receive !== undefined ? Receive : old.Receive,
      updated_by_id,
      reason,
      nowMySQL()
    ]);

    // Build dynamic update
    const updates = [];
    const values = [];
    if (PaymentTypeID !== undefined) { updates.push('PaymentTypeID = ?'); values.push(PaymentTypeID); }
    if (PaymentType !== undefined) { updates.push('PaymentType = ?'); values.push(PaymentType); }
    if (Amount !== undefined) { updates.push('Amount = ?'); values.push(Amount); }
    if (TipAmount !== undefined) { updates.push('TipAmount = ?'); values.push(TipAmount); }
    if (Refund !== undefined) { updates.push('Refund = ?'); values.push(Refund); }
    if (Receive !== undefined) { updates.push('Receive = ?'); values.push(Receive); }
    if (updated_by_id !== undefined) { updates.push('updated_by_id = ?'); values.push(updated_by_id); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }
    values.push(id);
    await db.query(`UPDATE ldgsettlement SET ${updates.join(', ')} WHERE SettlementID = ?`, values);

    res.json({ success: true, message: 'Settlement updated' });
  } catch (error) {
    console.error('updateSettlement error:', error);
    res.status(500).json({ success: false, message: 'Failed to update' });
  }
};

// ==================== SOFT DELETE (isSettled = 0) ====================
exports.deleteSettlement = async (req, res) => {
  try {
    const { id } = req.params;
    const { updated_by_id, reason = '' } = req.body;

    const [oldRows] = await db.query('SELECT * FROM ldgsettlement WHERE SettlementID = ? AND isSettled = 1', [id]);
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
    await db.query('UPDATE ldgsettlement SET isSettled = 0, updated_by_id = ? WHERE SettlementID = ?', [updated_by_id, id]);

    res.json({ success: true, message: 'Settlement reversed' });
  } catch (error) {
    console.error('deleteSettlement error:', error);
    res.status(500).json({ success: false, message: 'Failed to reverse' });
  }
};

// ==================== REPLACE (batch by OrderNo or TxnNo) ====================
exports.replaceSettlement = async (req, res) => {
  try {
    const { OrderNo, TxnNo, newSettlements, HotelID, updated_by_id, checkout_date } = req.body;

    if ((!OrderNo && !TxnNo) || !Array.isArray(newSettlements) || !HotelID) {
      return res.status(400).json({ success: false, message: 'Missing OrderNo/TxnNo, newSettlements array, or HotelID' });
    }

    let whereField = OrderNo ? 'OrderNo' : 'TxnNo';
    let whereValue = OrderNo || TxnNo;

    // Fetch existing active settlements
    const [existing] = await db.query(
      `SELECT * FROM ldgsettlement WHERE ${whereField} = ? AND isSettled = 1`,
      [whereValue]
    );

    // Log old records before deletion
    for (const old of existing) {
      await db.query(`
        INSERT INTO ldgsettlement_log (
          SettlementID, OldPaymentTypeID, OldPaymentType, OldAmount, OldTipAmount, OldRefund, OldReceive,
          UpdatedBy, Reason, ChangeDate, Action
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Batch replaced', ?, 'REPLACE_BATCH')
      `, [old.SettlementID, old.PaymentTypeID, old.PaymentType, old.Amount, old.TipAmount, old.Refund, old.Receive, updated_by_id, nowMySQL()]);
    }

    // Soft delete all existing
    await db.query(
      `UPDATE ldgsettlement SET isSettled = 0, updated_by_id = ? WHERE ${whereField} = ?`,
      [updated_by_id, whereValue]
    );

    // Insert each new settlement
    for (const s of newSettlements) {
      const {
        PaymentTypeID, PaymentType, Amount, TipAmount = 0, Refund = 0, Receive = 0,
        customerid, CustomerName, MobileNo, Address, Name, table_name = 'room',
        outletid, outletname, guest_id, guest_name, discount = 0, total_advance = 0,
        total_amount, bill_no, registration_no, room_name, checkinid, userid
      } = s;

      const insertData = {
       
        userid: userid || updated_by_id,
        PaymentTypeID,
        PaymentType,
        Amount,
        TipAmount,
        Batch: '',
        Name: Name || CustomerName,
        HotelID,
        InsertDate: nowMySQL(),
        isSettled: 1,
        RefferedBy: '',
        customerid: customerid || null,
        CustomerName: CustomerName || '',
        MobileNo: MobileNo || '',
        Address: Address || '',
        Refund,
        Receive,
        Name2: '',
        Name3: '',
        table_name,
        outletid,
        outletname: outletname || '',
        guest_id: guest_id || null,
        guest_name: guest_name || '',
        discount,
        total_advance,
        total_amount,
        bill_no: bill_no || null,
        registration_no: registration_no || null,
        room_name: room_name || '',
        checkinid,
        created_by_id: updated_by_id,
        updated_by_id: updated_by_id,
        checkout_date: checkout_date || null
      };
      await db.query('INSERT INTO ldgsettlement SET ?', [insertData]);
    }

    res.json({ success: true, message: 'Settlements replaced successfully' });
  } catch (error) {
    console.error('replaceSettlement error:', error);
    res.status(500).json({ success: false, message: 'Failed to replace settlements' });
  }
};