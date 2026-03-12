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



// Replace settlements
exports.replaceSettlement = async (req, res) => {
  try {

    const { OrderNo, newSettlements, HotelID, EditedBy, InsertDate, TipAmount } = req.body;

    if (!OrderNo || !Array.isArray(newSettlements) || !HotelID) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const editedBySafe =
      typeof EditedBy === 'object'
        ? JSON.stringify(EditedBy)
        : EditedBy ?? null;

    const insertDate =
      InsertDate ||
      new Date().toISOString().replace('T', ' ').substring(0, 19);

    const tipAmount = TipAmount != null ? Number(TipAmount) : 0;

    const existingSettlements = db.prepare(`
      SELECT *
      FROM TrnSettlement
      WHERE OrderNo = ? OR TxnNo = ?
    `).all(OrderNo, OrderNo);

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

    db.prepare(`DELETE FROM TrnSettlement WHERE OrderNo = ?`).run(OrderNo);

    const settlementInsertStmt = db.prepare(`
      INSERT INTO TrnSettlement (
        OrderNo,
        PaymentTypeID,
        PaymentType,
        Amount,
        TipAmount,
        HotelID,
        isSettled,
        InsertDate
      )
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);

    for (let i = 0; i < newSettlements.length; i++) {

      const s = newSettlements[i];
      const old = existingSettlements[i] || {};

      const paymentMode = db.prepare(`
        SELECT paymenttypeid
        FROM payment_types
        WHERE mode_name = ?
      `).get(s.PaymentType);

      const paymentTypeID = paymentMode.paymenttypeid;

      settlementInsertStmt.run(
        OrderNo,
        paymentTypeID,
        s.PaymentType,
        Number(s.Amount),
        tipAmount,
        HotelID,
        insertDate
      );

      const newSettlementID = db
        .prepare('SELECT last_insert_rowid() as id')
        .get().id;

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
      typeof EditedBy === 'object'
        ? JSON.stringify(EditedBy)
        : EditedBy ?? null;

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
    console.error('Error in deleteSettlement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reverse settlement'
    });
  }
};