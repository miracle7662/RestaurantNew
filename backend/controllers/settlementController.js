const db = require('../config/db');

// Utility: standard success response
function ok(message, data) {
  return { success: true, message, data };
}

// Get settlements with filters
exports.getSettlements = async (req, res) => {
  try {
    const { orderNo, hotelId, from, to, paymentType } = req.query;

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
      SELECT s.*
      FROM TrnSettlement s
      ${whereSql}
      ORDER BY s.InsertDate DESC
    `;

    const settlements = db.prepare(sql).all(...params);

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
    const { PaymentType, Amount, EditedBy } = req.body;

    const settlement = db
      .prepare('SELECT * FROM TrnSettlement WHERE SettlementID = ? AND isSettled = 1')
      .get(Number(id));

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }

    // ✅ LOG OLD → NEW
    db.prepare(`
      INSERT INTO TrnSettlementLog (
        SettlementID,
        OldPaymentType,
        OldAmount,
        NewPaymentType,
        NewAmount,
        EditedBy
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      settlement.SettlementID,
      settlement.PaymentType,
      settlement.Amount,
      PaymentType,
      Amount,
      typeof EditedBy === 'object' ? JSON.stringify(EditedBy) : EditedBy
    );

    // ✅ UPDATE (NO BILL AMOUNT VALIDATION HERE)
    db.prepare(`
      UPDATE TrnSettlement
      SET PaymentType = ?, Amount = ?
      WHERE SettlementID = ?
    `).run(
      PaymentType,
      Number(Amount),
      Number(id)
    );

    res.json({
      success: true,
      message: 'Settlement updated successfully'
    });
  } catch (error) {
    console.error('updateSettlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settlement'
    });
  }
};

exports.createSettlement = async (req, res) => {
  try {
    const {
      OrderNo,
      PaymentType,   // "Cash", "UPI"
      Amount,
      HotelID,
      EditedBy,
      InsertDate
    } = req.body;

    if (!OrderNo || !PaymentType || !Amount || !HotelID) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // 🔹 Resolve PaymentTypeID correctly
    const paymentMode = db.prepare(`
      SELECT paymenttypeid
      FROM payment_types
      WHERE mode_name = ?
    `).get(PaymentType);

    if (!paymentMode) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment type: ${PaymentType}`
      });
    }

    // ✅ FIXED LINE
    const paymentTypeID = paymentMode.paymenttypeid;

    

    db.prepare(`
      INSERT INTO TrnSettlement (
        OrderNo,
        PaymentTypeID,
        PaymentType,
        Amount,
        HotelID,
        isSettled,
        InsertDate
      )
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(
      OrderNo,
      paymentTypeID,
      PaymentType,
      Number(Amount),
      HotelID,
      insertDate
    );

    res.json({
      success: true,
      message: 'Settlement created successfully'
    });
  } catch (error) {
    console.error('createSettlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create settlement'
    });
  }
};

// Replace settlements for an OrderNo
exports.replaceSettlement = async (req, res) => {
  try {
    const { OrderNo, newSettlements, HotelID, EditedBy, InsertDate } = req.body;

    if (!OrderNo || !Array.isArray(newSettlements) || !HotelID) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: OrderNo, newSettlements, HotelID'
      });
    }

    // ✅ FORCE EditedBy to a valid SQLite type
    const editedBySafe =
      typeof EditedBy === 'object'
        ? JSON.stringify(EditedBy)
        : EditedBy ?? null;

    // Use InsertDate from request body if provided, otherwise use current datetime
    const insertDate = InsertDate ? InsertDate : new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1️⃣ Fetch all existing settlements for the OrderNo
    const existingSettlements = db.prepare(
      `SELECT * FROM TrnSettlement WHERE OrderNo = ?`
    ).all(OrderNo);

    // 2️⃣ Log each existing settlement as deleted
    for (const settlement of existingSettlements) {
      db.prepare(`
        INSERT INTO TrnSettlementLog (
          SettlementID,
          OldPaymentType,
          OldAmount,
          NewPaymentType,
          NewAmount,
          EditedBy
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `).run([
        Number(settlement.SettlementID),
        settlement.PaymentType ? String(settlement.PaymentType) : null,
        settlement.Amount != null ? Number(settlement.Amount) : null,
        null,
        null,
        editedBySafe
      ]);
    }

    // 3️⃣ Hard delete all existing settlements for the OrderNo
    db.prepare(`DELETE FROM TrnSettlement WHERE OrderNo = ?`).run(OrderNo);

    // 4️⃣ Get the original settlement data to preserve TxnNo, UserId, Name, CustomerName, MobileNo
    // Use the first existing settlement as reference (or fetch from TAxnTrnbill if no settlement exists)
    let originalSettlement = existingSettlements.length > 0 ? existingSettlements[0] : null;
    
    let txnNo = originalSettlement?.TxnNo || null;
    let userId = originalSettlement?.UserId || null;
    let name = originalSettlement?.Name || null;
    let customerName = originalSettlement?.CustomerName || null;
    let mobileNo = originalSettlement?.MobileNo || null;
    
    // If no settlement exists, try to get data from TAxnTrnbill
    if (!txnNo || !userId) {
      const bill = db.prepare(`SELECT TxnNo, UserId, CustomerName, MobileNo FROM TAxnTrnbill WHERE orderNo = ? OR TxnNo = ?`).get(OrderNo, OrderNo);
      if (bill) {
        txnNo = txnNo || bill.TxnNo || null;
        userId = userId || bill.UserId || null;
        customerName = customerName || bill.CustomerName || null;
        mobileNo = mobileNo || bill.MobileNo || null;
      }
    }

    // 5️⃣ Insert new settlements with preserved fields
    for (const s of newSettlements) {
      if (!s.PaymentType || s.Amount == null) continue;

      // Resolve PaymentTypeID
      const paymentMode = db.prepare(`
        SELECT paymenttypeid
        FROM payment_types
        WHERE mode_name = ?
      `).get(s.PaymentType);

      if (!paymentMode) {
        return res.status(400).json({
          success: false,
          message: `Invalid payment type: ${s.PaymentType}`
        });
      }

      const paymentTypeID = paymentMode.paymenttypeid;

      db.prepare(`
        INSERT INTO TrnSettlement (
          OrderNo,
          PaymentTypeID,
          PaymentType,
          Amount,
          HotelID,
          TxnNo,
          UserId,
          Name,
          CustomerName,
          MobileNo,
          Receive,
          Refund,
          isSettled,
          InsertDate
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `).run(
        OrderNo,
        paymentTypeID,
        s.PaymentType,
        Number(s.Amount),
        HotelID,
        txnNo,
        userId,
        name,
        customerName,
        mobileNo,
        Number(s.Amount) || 0, // Receive = Amount
        0, // Refund = 0
        insertDate
      );
    }

    res.json({
      success: true,
      message: 'Settlements replaced successfully'
    });
  } catch (error) {
    console.error('Error in replaceSettlement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to replace settlements',
      error: error.message
    });
  }
};

// Delete/Reverse settlement
exports.deleteSettlement = async (req, res) => {
  try {
    const { id } = req.params;
    const { EditedBy } = req.body;

    // ✅ FORCE EditedBy to a valid SQLite type
    const editedBySafe =
      typeof EditedBy === 'object'
        ? JSON.stringify(EditedBy)     // OR EditedBy.id / EditedBy.username
        : EditedBy ?? null;

    // 1️⃣ Fetch settlement
    const settlement = db.prepare(
      `SELECT * FROM TrnSettlement WHERE SettlementID = ?`
    ).get([Number(id)]);

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }

    // 2️⃣ Insert log (SAFE BINDING)
    db.prepare(`
      INSERT INTO TrnSettlementLog (
        SettlementID,
        OldPaymentType,
        OldAmount,
        NewPaymentType,
        NewAmount,
        EditedBy
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run([
      Number(settlement.SettlementID),
      settlement.PaymentType ? String(settlement.PaymentType) : null,
      settlement.Amount != null ? Number(settlement.Amount) : null,
      null,
      null,
      editedBySafe
    ]);

    // 3️⃣ Soft delete
    db.prepare(`
      UPDATE TrnSettlement
      SET isSettled = 0
      WHERE SettlementID = ?
    `).run([Number(id)]);

    res.json({
      success: true,
      message: 'Settlement reversed successfully'
    });

  } catch (error) {
    console.error('Error in deleteSettlement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reverse settlement',
      error: error.message
    });
  }
};


