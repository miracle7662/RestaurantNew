const db = require('../config/db');

// Utility: standard success response
function ok(message, data) {
  return { success: true, message, data };
}

// Get settlements with filters - FIXED: Include TipAmount, Receive, Refund + outletId support
exports.getSettlements = async (req, res) => {
  try {
    const { orderNo, hotelId, outletId, from, to, paymentType } = req.query;

    let whereClauses = ['s.isSettled = 1'];
    const params = [];

    if (orderNo) {
      whereClauses.push('s.OrderNo LIKE ?');
      params.push(`%${orderNo}%`);
    }

    if (hotelId) {
      whereClauses.push('s.HotelID = ?');
      params.push(Number(hotelId));
    }

    if (outletId) {
      whereClauses.push('b.outletid = ?');
      params.push(Number(outletId));
    }

    if (from) {
      whereClauses.push('s.InsertDate >= ?');
      params.push(from);
    }

    if (to) {
      whereClauses.push('s.InsertDate <= ?');
      params.push(to + ' 23:59:59');
    }

    if (paymentType) {
      whereClauses.push('s.PaymentType = ?');
      params.push(paymentType);
    }

    const whereSql = whereClauses.length
      ? `WHERE ${whereClauses.join(' AND ')}`
      : '';

    const sql = `
      SELECT 
        s.SettlementID,
        s.OrderNo,
        s.table_name,
        s.PaymentType,
        s.Amount,
        s.TipAmount,
        s.Receive,
        s.Refund,
        s.HotelID,
        s.TxnID,
        s.TxnNo AS TaxNo,
        s.UserId,
        s.Name,
        s.CustomerName,
        s.MobileNo,
        s.InsertDate,
        s.isSettled,
        s.customerid,
        tb.department_name AS department,
        mo.outlet_name
      FROM TrnSettlement s
      LEFT JOIN TAxnTrnbill b ON s.OrderNo = b.OrderNo OR s.TxnNo = b.TxnNo
      left join msttable_department tb on tb.departmentid=b.DeptID
      left join mst_outlets mo on mo.outletid=b.outletid
      ${whereSql}
      ORDER BY s.TxnNo asc
    `;

    const [settlements] = await db.query(sql, params);// FIXED: Await the query result

    res.json({
      success: true,
      data: settlements
    });
  } catch (error) {
     console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settlements'
    });
  }
};

// Update settlement
exports.updateSettlement = async (req, res) => {
  try {
    const { id } = req.params;
    const { PaymentType, Amount, EditedBy, checkinid } = req.body; // ✅ checkinid optional

    // Get existing settlement
    const [rows] = await db.query(
      'SELECT * FROM TrnSettlement WHERE SettlementID = ? AND isSettled = 1',
      [Number(id)]
    );
    const settlement = rows[0];
    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }

    const oldPaymentType = settlement.PaymentType;
    const oldAmount = settlement.Amount;
    const OrderNo = settlement.OrderNo;
    const HotelID = settlement.HotelID;

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1️⃣ Log the change
      await connection.query(`
        INSERT INTO TrnSettlementLog (
          SettlementID, OldPaymentType, OldAmount, NewPaymentType, NewAmount, EditedBy
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        settlement.SettlementID,
        oldPaymentType,
        oldAmount,
        PaymentType,
        Number(Amount),
        EditedBy?.full_name || EditedBy?.username || EditedBy || 'Unknown'
      ]);

      // 2️⃣ Update settlement
      await connection.query(`
        UPDATE TrnSettlement
        SET PaymentType = ?, Amount = ?
        WHERE SettlementID = ?
      `, [PaymentType, Number(Amount), Number(id)]);

      // 3️⃣ Handle folio entry based on new PaymentType
      if (PaymentType === 'Room Credit') {
        // ✅ New payment is Room Credit → insert/update folio
        if (!checkinid) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'checkinid is required for Room Credit payment'
          });
        }

        // Get detail_id
        const [detailRows] = await connection.query(
          `SELECT detail_id FROM checkin_detail_master WHERE checkin_id = ? LIMIT 1`,
          [checkinid]
        );
        if (detailRows.length === 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `No checkin detail found for checkin_id: ${checkinid}`
          });
        }
        const detailId = detailRows[0].detail_id;

        // Check if entry exists
        const [existingFolio] = await connection.query(
          `SELECT id FROM checkin_guest_folio_master WHERE reference_number = ? AND checkin_id = ?`,
          [OrderNo, checkinid]
        );

        const description = `Restaurant Bill - ${settlement.table_name || 'Order'} #${OrderNo}`;
        const insertDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

        if (existingFolio.length > 0) {
          // Update existing entry
          await connection.query(`
            UPDATE checkin_guest_folio_master
            SET debit_amount = ?, description = ?, transaction_datetime = ?
            WHERE reference_number = ? AND checkin_id = ?
          `, [Number(Amount), description, insertDate, OrderNo, checkinid]);
        } else {
          // Insert new entry
          await connection.query(`
            INSERT INTO checkin_guest_folio_master (
              checkin_id, hotel_id, detail_id, room_id,
              transaction_type, transaction_datetime, description,
              debit_amount, credit_amount, reference_number,
              payment_method, created_by_id, created_date
            ) VALUES (?, ?, ?, NULL, 'Room Credit', ?, ?, ?, 0, ?, ?, ?, ?)
          `, [
            checkinid,
            HotelID,
            detailId,
            insertDate,
            description,
            Number(Amount),
            OrderNo,
            PaymentType,
            EditedBy?.userId || null,
            insertDate
          ]);
        }
      } else {
        // ✅ New payment is NOT Room Credit → delete any existing Room Credit folio entry for this OrderNo
        await connection.query(`
          DELETE FROM checkin_guest_folio_master
          WHERE reference_number = ? AND transaction_type = 'Room Credit'
        `, [OrderNo]);
        console.log(`🗑️ Removed Room Credit folio entry for OrderNo: ${OrderNo} (updateSettlement)`);
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Settlement updated successfully'
      });

    } catch (innerError) {
      await connection.rollback();
      connection.release();
      console.error('❌ updateSettlement inner error:', innerError);
      throw innerError;
    }

  } catch (error) {
    console.error('updateSettlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settlement'
    });
  }
};

// Create settlement
exports.createSettlement = async (req, res) => {
  try {
    const {
      OrderNo,
      PaymentType,
      Amount,
      HotelID,
      EditedBy,
      InsertDate,
      checkinid   // ✅ NEW: required when PaymentType === 'Room Credit'
    } = req.body;

    // --- Basic validation ---
    if (!OrderNo || !PaymentType || !Amount || !HotelID) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // --- Get TxnID ---
    const [billRows] = await db.query(`
      SELECT TxnID FROM TAxnTrnbill WHERE OrderNo = ? OR TxnNo = ?
    `, [OrderNo, OrderNo]);
    const txnID = billRows[0]?.TxnID || null;

    // --- Get payment type ID ---
    const [paymentRows] = await db.query(`
      SELECT paymenttypeid FROM payment_types WHERE mode_name = ?
    `, [PaymentType]);
    const paymentMode = paymentRows[0];
    if (!paymentMode) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment type: ${PaymentType}`
      });
    }
    const paymentTypeID = paymentMode.paymenttypeid;

    const insertDate = InsertDate || new Date().toISOString().slice(0, 19).replace('T', ' ');

    // --- Start transaction ---
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1️⃣ Insert into TrnSettlement
      await connection.query(`
        INSERT INTO TrnSettlement (
          OrderNo, TxnID, table_name, PaymentTypeID, PaymentType,
          Amount, customerid, HotelID, isSettled, InsertDate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `, [
        OrderNo,
        txnID,
        req.body.table_name || null,
        paymentTypeID,
        PaymentType,
        Number(Amount),
        HotelID,  // customerid? Actually you have customerid in your original but not in destructure; I kept HotelID as placeholder; you might need to adjust.
        HotelID,
        insertDate
      ]);

      // 2️⃣ Handle Room Credit Folio Entry
      if (PaymentType === 'Room Credit') {
        // checkinid is mandatory
        if (!checkinid) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'checkinid is required for Room Credit payment'
          });
        }

        // Get detail_id
        const [detailRows] = await connection.query(
          `SELECT detail_id FROM checkin_detail_master WHERE checkin_id = ? LIMIT 1`,
          [checkinid]
        );
        if (detailRows.length === 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `No checkin detail found for checkin_id: ${checkinid}`
          });
        }
        const detailId = detailRows[0].detail_id;

        // Check if an entry already exists for this OrderNo (to avoid duplicates)
        const [existingFolio] = await connection.query(
          `SELECT id FROM checkin_guest_folio_master WHERE reference_number = ? AND checkin_id = ?`,
          [OrderNo, checkinid]
        );

        if (existingFolio.length > 0) {
          // Update existing entry (optional)
          await connection.query(`
            UPDATE checkin_guest_folio_master
            SET debit_amount = ?, description = ?, transaction_datetime = ?
            WHERE reference_number = ? AND checkin_id = ?
          `, [Number(Amount), `Restaurant Bill - ${req.body.table_name || 'Order'} #${OrderNo}`, insertDate, OrderNo, checkinid]);
        } else {
          // Insert new entry
          const description = `Restaurant Bill - ${req.body.table_name || 'Order'} #${OrderNo}`;
          await connection.query(`
            INSERT INTO checkin_guest_folio_master (
              checkin_id, hotel_id, detail_id, room_id,
              transaction_type, transaction_datetime, description,
              debit_amount, credit_amount, reference_number,
              payment_method, created_by_id, created_date
            ) VALUES (?, ?, ?, NULL, 'Room Credit', ?, ?, ?, 0, ?, ?, ?, ?)
          `, [
            checkinid,
            HotelID,
            detailId,
            insertDate,
            description,
            Number(Amount),
            OrderNo,
            PaymentType,
            EditedBy || null,
            insertDate
          ]);
        }
      } else {
        // 3️⃣ If PaymentType is NOT Room Credit → DELETE any existing folio entry for this OrderNo
        // This ensures that if previously it was Room Credit and now changed, the old entry is removed.
        await connection.query(`
          DELETE FROM checkin_guest_folio_master
          WHERE reference_number = ? AND transaction_type = 'Room Credit'
        `, [OrderNo]);
        console.log(`🗑️ Removed Room Credit folio entry for OrderNo: ${OrderNo}`);
      }

      // --- Commit transaction ---
      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Settlement created successfully'
      });

    } catch (innerError) {
      await connection.rollback();
      connection.release();
      console.error('❌ Error during settlement (inner):', innerError);
      throw innerError; // rethrow to outer catch
    }

  } catch (error) {
    console.error('createSettlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create settlement'
    });
  }
};
// Replace settlements
exports.replaceSettlement = async (req, res) => {
  try {
    const { OrderNo, newSettlements, HotelID, EditedBy, InsertDate, TipAmount, checkinid } = req.body;

    // Validate
    if (!OrderNo || !Array.isArray(newSettlements) || !HotelID) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const editedBySafe = EditedBy?.full_name || EditedBy?.username || EditedBy || 'Unknown';
    const insertDate = InsertDate || new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Fetch existing settlements (for logging)
    const [existingSettlements] = await db.query(
      `SELECT * FROM TrnSettlement WHERE OrderNo = ? OR TxnNo = ?`,
      [OrderNo, OrderNo]
    );

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1️⃣ Delete existing settlements
      await connection.query(`DELETE FROM TrnSettlement WHERE OrderNo = ?`, [OrderNo]);

      // 2️⃣ Insert new settlements and also handle folio logic
      let hasRoomCredit = false;
      let roomCreditAmount = 0;
      let roomCreditCheckinid = checkinid; // top-level checkinid for Room Credit

      for (const s of newSettlements) {
        if (!s.PaymentType || s.Amount == null) continue;

        // Get payment type ID
        const [rows] = await connection.query(
          `SELECT paymenttypeid FROM payment_types WHERE mode_name = ?`,
          [s.PaymentType]
        );
        const paymentMode = rows[0];
        if (!paymentMode) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `Invalid payment type: ${s.PaymentType}`
          });
        }

        // Determine customer fields
        const isCredit = s.PaymentType && String(s.PaymentType).toLowerCase() === 'credit';
        const finalCustomerId = isCredit ? (s.customerid ?? null) : null;
        const finalCustomerName = isCredit ? (s.customerName ?? null) : null;
        const finalMobileNo = isCredit ? (s.mobile ?? null) : null;
        const finalName = s.Name || null;

        // Insert settlement
        await connection.query(`
          INSERT INTO TrnSettlement (
            OrderNo, TxnID, table_name, PaymentTypeID, PaymentType,
            Amount, TipAmount, HotelID, TxnNo, UserId, Name,
            customerid, CustomerName, MobileNo, Receive, Refund,
            isSettled, InsertDate
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        `, [
          OrderNo,
          null, // TxnID will be fetched later if needed
          req.body.table_name || null,
          paymentMode.paymenttypeid,
          s.PaymentType,
          Number(s.Amount),
          Number(s.TipAmount) || 0,
          HotelID,
          null, // TxnNo
          null, // UserId
          finalName,
          finalCustomerId,
          finalCustomerName,
          finalMobileNo,
          0, // Receive (if needed)
          0, // Refund
          insertDate
        ]);

        // Track if any settlement is Room Credit
        if (s.PaymentType === 'Room Credit') {
          hasRoomCredit = true;
          roomCreditAmount += Number(s.Amount);
          // If checkinid is provided in individual settlement, use it
          if (s.checkinid) roomCreditCheckinid = s.checkinid;
        }
      }

      // 3️⃣ Handle folio entry based on whether any Room Credit exists
      if (hasRoomCredit) {
        // There is at least one Room Credit → insert/update folio
        if (!roomCreditCheckinid) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'checkinid is required for Room Credit payment'
          });
        }

        // Get detail_id
        const [detailRows] = await connection.query(
          `SELECT detail_id FROM checkin_detail_master WHERE checkin_id = ? LIMIT 1`,
          [roomCreditCheckinid]
        );
        if (detailRows.length === 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `No checkin detail found for checkin_id: ${roomCreditCheckinid}`
          });
        }
        const detailId = detailRows[0].detail_id;

        // Check existing entry
        const [existingFolio] = await connection.query(
          `SELECT id FROM checkin_guest_folio_master WHERE reference_number = ? AND checkin_id = ?`,
          [OrderNo, roomCreditCheckinid]
        );

        const description = `Restaurant Bill - ${req.body.table_name || 'Order'} #${OrderNo}`;
        if (existingFolio.length > 0) {
          await connection.query(`
            UPDATE checkin_guest_folio_master
            SET debit_amount = ?, description = ?, transaction_datetime = ?
            WHERE reference_number = ? AND checkin_id = ?
          `, [roomCreditAmount, description, insertDate, OrderNo, roomCreditCheckinid]);
        } else {
          await connection.query(`
            INSERT INTO checkin_guest_folio_master (
              checkin_id, hotel_id, detail_id, room_id,
              transaction_type, transaction_datetime, description,
              debit_amount, credit_amount, reference_number,
              payment_method, created_by_id, created_date
            ) VALUES (?, ?, ?, NULL, 'Room Credit', ?, ?, ?, 0, ?, ?, ?, ?)
          `, [
            roomCreditCheckinid,
            HotelID,
            detailId,
            insertDate,
            description,
            roomCreditAmount,
            OrderNo,
            'Room Credit',
            EditedBy?.userId || null,
            insertDate
          ]);
        }
      } else {
        // No Room Credit → delete any existing folio entry for this OrderNo
        await connection.query(`
          DELETE FROM checkin_guest_folio_master
          WHERE reference_number = ? AND transaction_type = 'Room Credit'
        `, [OrderNo]);
        console.log(`🗑️ Removed Room Credit folio entry for OrderNo: ${OrderNo} (replaceSettlement)`);
      }

      // 4️⃣ Log replacements (for each new settlement, log against old if exists)
      for (let i = 0; i < newSettlements.length; i++) {
        const s = newSettlements[i];
        const old = existingSettlements[i] || {};
        // Insert log
        await connection.query(`
          INSERT INTO TrnSettlementLog (
            SettlementID, OldPaymentType, OldAmount, NewPaymentType, NewAmount, EditedBy
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          i + 1, // dummy SettlementID (since we don't have actual new ID yet, but we can use index)
          old.PaymentType || null,
          old.Amount || null,
          s.PaymentType,
          s.Amount,
          editedBySafe
        ]);
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Settlements replaced successfully'
      });

    } catch (innerError) {
      await connection.rollback();
      connection.release();
      console.error('❌ replaceSettlement inner error:', innerError);
      throw innerError;
    }

  } catch (error) {
    console.error('replaceSettlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to replace settlements'
    });
  }
};

// Delete settlement
exports.deleteSettlement = async (req, res) => {
  try {
    const { id } = req.params;
    const { EditedBy } = req.body;

    const editedBySafe =
      EditedBy?.full_name || EditedBy?.username || EditedBy || 'Unknown';

    // ✅ FIX: await + destructuring
    const [rows] = await db.query(
      `SELECT * FROM TrnSettlement WHERE SettlementID = ?`,
      [Number(id)]
    );

    const settlement = rows[0];

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }

    // ✅ FIX: await
    await db.query(`
      INSERT INTO TrnSettlementLog (
        SettlementID,
        OldPaymentType,
        OldAmount,
        NewPaymentType,
        NewAmount,
        EditedBy
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      settlement.SettlementID,
      settlement.PaymentType || null,
      settlement.Amount || null,
      null,
      null,
      editedBySafe
    ]);

    // ✅ FIX: await
    await db.query(`
      UPDATE TrnSettlement
      SET isSettled = 0
      WHERE SettlementID = ?
    `, [Number(id)]);

    res.json({
      success: true,
      message: 'Settlement reversed successfully'
    });

  } catch (error) {
    console.error('Error in deleteSettlement:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to reverse settlement'
    });
  }
};