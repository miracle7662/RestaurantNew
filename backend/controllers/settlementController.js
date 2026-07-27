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
    mo.outlet_name,
    f.checkin_id AS checkinid
  FROM TrnSettlement s
  LEFT JOIN TAxnTrnbill b ON s.OrderNo = b.OrderNo OR s.TxnNo = b.TxnNo
  LEFT JOIN msttable_department tb ON tb.departmentid = b.DeptID
  LEFT JOIN mst_outlets mo ON mo.outletid = b.outletid
  LEFT JOIN checkin_guest_folio_master f
    ON f.reference_number = s.OrderNo
    AND f.transaction_type = 'Room Credit'
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
    const { PaymentType, Amount, EditedBy, checkinid } = req.body;

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

      // 2️⃣ Update the settlement row
      await connection.query(`
        UPDATE TrnSettlement
        SET PaymentType = ?, Amount = ?
        WHERE SettlementID = ?
      `, [PaymentType, Number(Amount), Number(id)]);

      // ---------------------------------------------------------------
      // 3️⃣ Handle Room Credit folio (with fixes)
      // ---------------------------------------------------------------
      // First, check if there is an existing Room Credit folio for this OrderNo
      const [existingFolioRows] = await connection.query(
        `SELECT folio_id, checkin_id, detail_id, room_id, debit_amount
         FROM checkin_guest_folio_master
         WHERE reference_number = ? AND transaction_type = 'Room Credit'`,
        [OrderNo]
      );
      const existingFolio = existingFolioRows[0];

      if (PaymentType === 'Room Credit') {
        // ✅ New payment IS Room Credit
        if (existingFolio) {
          // ✅ CASE A: Existing folio found → UPDATE it (preserve original checkin_id)
          const folioId = existingFolio.folio_id;
          const roomCreditCheckinid = existingFolio.checkin_id; // SOURCE OF TRUTH
          const detailId = existingFolio.detail_id;
          const roomId = existingFolio.room_id;

          console.log(
            `Room Credit folio update (single settlement): folio_id=${folioId}, ` +
            `checkin_id=${roomCreditCheckinid}, ` +
            `OrderNo=${OrderNo}, ` +
            `oldAmount=${existingFolio.debit_amount}, ` +
            `newAmount=${Number(Amount)}`
          );

          const description = `FOOD - ${settlement.table_name || 'Order'} #${OrderNo}`;
          const insertDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

          // UPDATE using folio_id
          await connection.query(`
            UPDATE checkin_guest_folio_master
            SET
              checkin_id = ?,
              hotel_id = ?,
              detail_id = ?,
              room_id = ?,
              debit_amount = ?,
              credit_amount = 0,
              description = ?,
              transaction_datetime = ?,
              payment_method = ?,
              created_by_id = ?
            WHERE folio_id = ?
          `, [
            roomCreditCheckinid,        // preserve original checkin_id
            HotelID,
            detailId,
            roomId,
            Number(Amount),
            description,
            insertDate,
            'Room Credit',
            EditedBy?.userId || null,
            folioId
          ]);

          console.log(`✅ Room Credit folio updated: folio_id=${folioId}`);
        } else {
          // ✅ CASE B: No existing folio → INSERT new one (use provided checkinid)
          if (!checkinid) {
            await connection.rollback();
            return res.status(400).json({
              success: false,
              message: 'checkinid is required for new Room Credit payment'
            });
          }

          console.log(`Inserting new Room Credit folio for checkin_id=${checkinid}, OrderNo=${OrderNo}`);

          // Get detail_id and room_id from checkin_detail_master
          const [detailRows] = await connection.query(
            `SELECT detail_id, room_id FROM checkin_detail_master WHERE checkin_id = ? LIMIT 1`,
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
          const roomId = detailRows[0].room_id;

          const description = `FOOD - ${settlement.table_name || 'Order'} #${OrderNo}`;
          const insertDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

          await connection.query(`
            INSERT INTO checkin_guest_folio_master (
              checkin_id, hotel_id, detail_id, room_id, transaction_type,
              transaction_datetime, description, debit_amount, credit_amount,
              reference_number, payment_method, created_by_id, created_date
            ) VALUES (?, ?, ?, ?, 'Room Credit', ?, ?, ?, 0, ?, ?, ?, ?)
          `, [
            checkinid,
            HotelID,
            detailId,
            roomId,
            insertDate,
            description,
            Number(Amount),
            OrderNo,
            'Room Credit',
            EditedBy?.userId || null,
            insertDate
          ]);

          console.log(`✅ New Room Credit folio inserted for checkin_id=${checkinid}`);
        }
      } else {
        // ✅ New payment is NOT Room Credit → DELETE any existing Room Credit folio
        if (existingFolio) {
          await connection.query(`
            DELETE FROM checkin_guest_folio_master
            WHERE reference_number = ? AND transaction_type = 'Room Credit'
          `, [OrderNo]);
          console.log(`🗑️ Room Credit folio deleted for OrderNo=${OrderNo} (payment changed)`);
        }
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
      checkinid   // required when PaymentType === 'Room Credit'
    } = req.body;

    // --- Basic validation ---
    if (!OrderNo || !PaymentType || !Amount || !HotelID) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // --- Get bill header (TxnID, table_name, customerid) ---
    const [billRows] = await db.query(`
      SELECT TxnID, table_name, customerid
      FROM TAxnTrnbill
      WHERE OrderNo = ? OR TxnNo = ?
    `, [OrderNo, OrderNo]);
    const bill = billRows[0];
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found for OrderNo: ' + OrderNo
      });
    }
    const txnID = bill.TxnID;
    const tableName = bill.table_name;
    const customerId = bill.customerid;

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
      // 1️⃣ Insert into TrnSettlement (fix customerid)
      await connection.query(`
        INSERT INTO TrnSettlement (
          OrderNo, TxnID, table_name, PaymentTypeID, PaymentType,
          Amount, customerid, HotelID, isSettled, InsertDate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `, [
        OrderNo,
        txnID,
        tableName,
        paymentTypeID,
        PaymentType,
        Number(Amount),
        customerId,          // ✅ use actual customerid from bill
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

        // 🔍 First, check if a Room Credit folio already exists for this OrderNo
        const [existingFolioRows] = await connection.query(
          `SELECT folio_id, checkin_id, detail_id, room_id, debit_amount
           FROM checkin_guest_folio_master
           WHERE reference_number = ? AND transaction_type = 'Room Credit'`,
          [OrderNo]
        );
        const existingFolio = existingFolioRows[0];

        if (existingFolio) {
          // ✅ Existing folio found → UPDATE it (preserve original checkin_id)
          const folioId = existingFolio.folio_id;
          const roomCreditCheckinid = existingFolio.checkin_id; // SOURCE OF TRUTH
          const detailId = existingFolio.detail_id;
          const roomId = existingFolio.room_id;

          console.log(
            `Room Credit folio update (createSettlement): folio_id=${folioId}, ` +
            `checkin_id=${roomCreditCheckinid}, ` +
            `OrderNo=${OrderNo}, ` +
            `oldAmount=${existingFolio.debit_amount}, ` +
            `newAmount=${Number(Amount)}`
          );

          const description = `FOOD - ${tableName || 'Order'} #${OrderNo}`;

          // UPDATE using folio_id
          await connection.query(`
            UPDATE checkin_guest_folio_master
            SET
              checkin_id = ?,
              hotel_id = ?,
              detail_id = ?,
              room_id = ?,
              debit_amount = ?,
              credit_amount = 0,
              description = ?,
              transaction_datetime = ?,
              payment_method = ?,
              created_by_id = ?
            WHERE folio_id = ?
          `, [
            roomCreditCheckinid,        // preserve original checkin_id
            HotelID,
            detailId,
            roomId,
            Number(Amount),
            description,
            insertDate,
            'Room Credit',
            EditedBy?.userId || null,
            folioId
          ]);

          console.log(`✅ Room Credit folio updated: folio_id=${folioId}`);
        } else {
          // ✅ No existing folio → INSERT new one (use provided checkinid)
          console.log(`Inserting new Room Credit folio for checkin_id=${checkinid}, OrderNo=${OrderNo}`);

          // Get detail_id and room_id from checkin_detail_master
          const [detailRows] = await connection.query(
            `SELECT detail_id, room_id FROM checkin_detail_master WHERE checkin_id = ? LIMIT 1`,
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
          const roomId = detailRows[0].room_id;

          const description = `FOOD - ${tableName || 'Order'} #${OrderNo}`;

          await connection.query(`
            INSERT INTO checkin_guest_folio_master (
              checkin_id, hotel_id, detail_id, room_id, transaction_type,
              transaction_datetime, description, debit_amount, credit_amount,
              reference_number, payment_method, created_by_id, created_date
            ) VALUES (?, ?, ?, ?, 'Room Credit', ?, ?, ?, 0, ?, ?, ?, ?)
          `, [
            checkinid,
            HotelID,
            detailId,
            roomId,
            insertDate,
            description,
            Number(Amount),
            OrderNo,
            'Room Credit',
            EditedBy?.userId || null,
            insertDate
          ]);

          console.log(`✅ New Room Credit folio inserted for checkin_id=${checkinid}`);
        }
      } else {
        // 3️⃣ If PaymentType is NOT Room Credit → DELETE any existing folio for this OrderNo
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
      throw innerError;
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
      // 🔍 Step 1: Get bill header (TxnID, table_name, customer details)
      const [billRows] = await connection.query(
        `SELECT TxnID, table_name, CustomerName, MobileNo, customerid 
         FROM TAxnTrnbill WHERE orderNo = ? OR TxnNo = ?`,
        [OrderNo, OrderNo]
      );
      const bill = billRows[0];
      if (!bill) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Bill not found for OrderNo: ' + OrderNo
        });
      }

      // 🔍 Step 2: Check for existing Room Credit folio for this OrderNo
      const [existingFolioRows] = await connection.query(
        `SELECT folio_id, checkin_id, hotel_id, detail_id, room_id, debit_amount
         FROM checkin_guest_folio_master
         WHERE reference_number = ? AND transaction_type = 'Room Credit'`,
        [OrderNo]
      );
      const existingFolio = existingFolioRows[0];

      // 🔍 Step 3: Determine if any new settlement is Room Credit
      const roomCreditSettlement = newSettlements.find(
        s => s.PaymentType === 'Room Credit'
      );

      // ------------------------------------------------------------------
      //  FOLIO HANDLING (fix)
      // ------------------------------------------------------------------
      if (roomCreditSettlement) {
        // There is at least one Room Credit in the new settlements
        const roomCreditAmount = Number(roomCreditSettlement.Amount) || 0;

        if (existingFolio) {
          // ✅ CASE A: Existing folio found → UPDATE it (preserve original checkin_id)
          const folioId = existingFolio.folio_id;
          const roomCreditCheckinid = existingFolio.checkin_id; // SOURCE OF TRUTH
          const detailId = existingFolio.detail_id;
          const roomId = existingFolio.room_id;

          console.log(
            `Room Credit folio update: folio_id=${folioId}, ` +
            `checkin_id=${roomCreditCheckinid}, ` +
            `OrderNo=${OrderNo}, ` +
            `oldAmount=${existingFolio.debit_amount}, ` +
            `newAmount=${roomCreditAmount}`
          );

          // Description
          const description = `FOOD - ${bill.table_name || 'Order'} #${OrderNo}`;

          // UPDATE the existing folio using folio_id
          await connection.query(
            `UPDATE checkin_guest_folio_master
             SET
               checkin_id = ?,
               hotel_id = ?,
               detail_id = ?,
               room_id = ?,
               debit_amount = ?,
               credit_amount = 0,
               description = ?,
               transaction_datetime = ?,
               payment_method = ?,
               created_by_id = ?
             WHERE folio_id = ?`,
            [
              roomCreditCheckinid,   // preserve original checkin_id
              HotelID,
              detailId,
              roomId,
              roomCreditAmount,
              description,
              insertDate,
              'Room Credit',
              EditedBy?.userId || null,
              folioId
            ]
          );

          console.log(`✅ Room Credit folio updated: folio_id=${folioId}`);
        } else {
          // ✅ CASE B: No existing folio → INSERT new one (use provided checkinid)
          const newCheckinid = roomCreditSettlement.checkinid || checkinid;
          if (!newCheckinid) {
            await connection.rollback();
            return res.status(400).json({
              success: false,
              message: 'checkinid is required for new Room Credit payment'
            });
          }

          console.log(`Inserting new Room Credit folio for checkin_id=${newCheckinid}, OrderNo=${OrderNo}`);

          // Get detail_id and room_id from checkin_detail_master
          const [detailRows] = await connection.query(
            `SELECT detail_id, room_id FROM checkin_detail_master WHERE checkin_id = ? LIMIT 1`,
            [newCheckinid]
          );
          if (detailRows.length === 0) {
            await connection.rollback();
            return res.status(400).json({
              success: false,
              message: `No checkin detail found for checkin_id: ${newCheckinid}`
            });
          }
          const detailId = detailRows[0].detail_id;
          const roomId = detailRows[0].room_id;

          const description = `FOOD - ${bill.table_name || 'Order'} #${OrderNo}`;

          await connection.query(
            `INSERT INTO checkin_guest_folio_master (
               checkin_id, hotel_id, detail_id, room_id, transaction_type,
               transaction_datetime, description, debit_amount, credit_amount,
               reference_number, payment_method, created_by_id, created_date
             ) VALUES (?, ?, ?, ?, 'Room Credit', ?, ?, ?, 0, ?, ?, ?, ?)`,
            [
              newCheckinid,
              HotelID,
              detailId,
              roomId,
              insertDate,
              description,
              roomCreditAmount,
              OrderNo,
              'Room Credit',
              EditedBy?.userId || null,
              insertDate
            ]
          );

          console.log(`✅ New Room Credit folio inserted for checkin_id=${newCheckinid}`);
        }
      } else {
        // ✅ CASE C: No Room Credit in new settlements → DELETE existing folio if any
        if (existingFolio) {
          await connection.query(
            `DELETE FROM checkin_guest_folio_master
             WHERE reference_number = ? AND transaction_type = 'Room Credit'`,
            [OrderNo]
          );
          console.log(`🗑️ Room Credit folio deleted for OrderNo=${OrderNo} (payment changed)`);
        }
      }

      // ------------------------------------------------------------------
      //  1️⃣ Delete existing settlements (original logic)
      // ------------------------------------------------------------------
      await connection.query(`DELETE FROM TrnSettlement WHERE OrderNo = ?`, [OrderNo]);

      // ------------------------------------------------------------------
      //  2️⃣ Insert new settlements (original logic, but now using bill.TxnID)
      // ------------------------------------------------------------------
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
        const finalCustomerId = isCredit ? (s.customerid ?? null) : bill.customerid;
        const finalCustomerName = isCredit ? (s.customerName ?? null) : bill.CustomerName;
        const finalMobileNo = isCredit ? (s.mobile ?? null) : bill.MobileNo;
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
          bill.TxnID,                      // ✅ use actual TxnID from bill
          bill.table_name || null,
          paymentMode.paymenttypeid,
          s.PaymentType,
          Number(s.Amount),
          Number(s.TipAmount) || 0,
          HotelID,
          null, // TxnNo (if needed)
          EditedBy?.userId || null,
          finalName,
          finalCustomerId,
          finalCustomerName,
          finalMobileNo,
          Number(s.received_amount) || 0,
          Number(s.refund_amount) || 0,
          insertDate
        ]);
      }

      // ------------------------------------------------------------------
      //  3️⃣ Log replacements (original logic, unchanged)
      // ------------------------------------------------------------------
      for (let i = 0; i < newSettlements.length; i++) {
        const s = newSettlements[i];
        const old = existingSettlements[i] || {};
        await connection.query(`
          INSERT INTO TrnSettlementLog (
            SettlementID, OldPaymentType, OldAmount, NewPaymentType, NewAmount, EditedBy
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          i + 1,
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