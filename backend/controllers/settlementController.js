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
        s.customerid
      FROM TrnSettlement s
      LEFT JOIN TAxnTrnbill b ON s.OrderNo = b.OrderNo OR s.TxnNo = b.TxnNo
      ${whereSql}
      ORDER BY s.InsertDate DESC
    `;

    const settlements = db.prepare(sql).all(...params);

    res.json({
      success: true,
      data: settlements
    });
  } catch (error) {
    // console.error(error);
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
      EditedBy?.full_name || EditedBy?.username || EditedBy || 'Unknown'
    );

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
    // console.error('updateSettlement error:', error);
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
      InsertDate
    } = req.body;

    // Fetch TxnID from bill
    const bill = db.prepare(`
      SELECT TxnID FROM TAxnTrnbill WHERE OrderNo = ? OR TxnNo = ?
    `).get(OrderNo, OrderNo);
    const txnID = bill ? bill.TxnID : null;

    if (!OrderNo || !PaymentType || !Amount || !HotelID) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

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

    const paymentTypeID = paymentMode.paymenttypeid;

    const insertDate =
      InsertDate ||
      new Date().toISOString().replace('T', ' ').substring(0, 19);

    db.prepare(`
      INSERT INTO TrnSettlement (
        OrderNo,
        TxnID,
        table_name,
        PaymentTypeID,
        PaymentType,
        Amount,
        customerid,
        HotelID,
        isSettled,
        InsertDate

      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      OrderNo,
      txnID || null,
      req.body.table_name || null,
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
    // console.error('createSettlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create settlement'
    });
  }
};



// Replace settlements
// Replace settlements
exports.replaceSettlement = async (req, res) => {
  try {

    const { OrderNo, newSettlements, HotelID, EditedBy, InsertDate, TipAmount } = req.body;

    // Fetch TxnID from bill for replaceSettlement
    const bill = db.prepare(`
      SELECT TxnID FROM TAxnTrnbill WHERE OrderNo = ? OR TxnNo = ?
    `).get(OrderNo, OrderNo);
    const txnID = bill ? bill.TxnID : null;

    if (!OrderNo || !Array.isArray(newSettlements) || !HotelID) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const editedBySafe = EditedBy?.full_name || EditedBy?.username || EditedBy || 'Unknown';

    const insertDate =
      InsertDate ||
      new Date().toISOString().replace('T', ' ').substring(0, 19);

    // tipAmount set from payload above

    // 1️⃣ Fetch existing settlements
    const existingSettlements = db.prepare(`
      SELECT *
      FROM TrnSettlement
      WHERE OrderNo = ? OR TxnNo = ?
    `).all(OrderNo, OrderNo);

    // Preserve original values
let originalSettlement = existingSettlements.length > 0 ? existingSettlements[0] : {};

// Extract updated values from first new settlement (has received_amount etc.)
let receive = 0;
let refund = 0;
let tipAmountFromPayload = Number(TipAmount) || 0;

if (newSettlements.length > 0) {
  receive = Number(newSettlements[0].received_amount) || originalSettlement.Receive || 0;
  refund = Number(newSettlements[0].refund_amount) || originalSettlement.Refund || 0;
}

// Preserve others from original
let txnNo = originalSettlement?.TxnNo || null;
let userId = originalSettlement?.UserId || null;
let name = originalSettlement?.Name || null;
let customerid = originalSettlement?.customerid || null;
let customerName = originalSettlement?.CustomerName || null;
let mobileNo = originalSettlement?.MobileNo || null;

// ✅ Fallback: get UserId from bill table if missing
if (!userId) {
  const bill = db.prepare(`
    SELECT UserId
    FROM TAxnTrnbill
    WHERE OrderNo = ? OR TxnNo = ?
  `).get(OrderNo, OrderNo);

  if (bill) {
    userId = bill.UserId;
  }
}
    // 3️⃣ Log statement
    const logStmt = db.prepare(`
      INSERT INTO TrnSettlementLog (
        SettlementID,
        OldPaymentType,
        OldAmount,
        NewPaymentType,
        NewAmount,
        EditedBy
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // 4️⃣ Delete old settlements
    db.prepare(`DELETE FROM TrnSettlement WHERE OrderNo = ?`).run(OrderNo);

    // 5️⃣ Insert new settlements
     const settlementInsertStmt = db.prepare(`
  INSERT INTO TrnSettlement (
    OrderNo,
    TxnID,
    table_name,
    PaymentTypeID,
    PaymentType,
    Amount,
    TipAmount,
    HotelID,
    TxnNo,
    UserId,
    Name,
    customerid,
    CustomerName,
    MobileNo,
    Receive,
    Refund,
    isSettled,
    InsertDate
  )
  VALUES (?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
`);
    

    for (let i = 0; i < newSettlements.length; i++) {

      const s = newSettlements[i];
      const old = existingSettlements[i] || {};

      if (!s.PaymentType || s.Amount == null) continue;

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

      settlementInsertStmt.run(
        OrderNo,
        txnID,
        req.body.table_name || originalSettlement.table_name || null,
        paymentTypeID,
        s.PaymentType,
        Number(s.Amount),
        tipAmountFromPayload,
        HotelID,
        txnNo,
        userId,
        name,
        customerid,
        customerName,
        mobileNo,
        receive,
        refund,
        insertDate
      );

      const newSettlementID = db
        .prepare('SELECT last_insert_rowid() as id')
        .get().id;

      // 6️⃣ Log edit
      logStmt.run(
        newSettlementID,
        old.PaymentType || null,
        old.Amount || null,
        s.PaymentType,
        s.Amount,
        editedBySafe
      );
    }

    res.json({
      success: true,
      message: 'Settlements replaced successfully'
    });

  } catch (error) {
    // console.error('replaceSettlement error:', error);
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

    const editedBySafe = EditedBy?.full_name || EditedBy?.username || EditedBy || 'Unknown';

    const settlement = db.prepare(
      `SELECT * FROM TrnSettlement WHERE SettlementID = ?`
    ).get(Number(id));

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }

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
      settlement.PaymentType || null,
      settlement.Amount || null,
      null,
      null,
      editedBySafe
    );

    db.prepare(`
      UPDATE TrnSettlement
      SET isSettled = 0
      WHERE SettlementID = ?
    `).run(Number(id));

    res.json({
      success: true,
      message: 'Settlement reversed successfully'
    });

  } catch (error) {
    // console.error('Error in deleteSettlement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reverse settlement'
    });
  }
};