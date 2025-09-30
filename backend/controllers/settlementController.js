const db = require('../config/db');

// Utility: standard success response
function ok(message, data) {
  return { success: true, message, data };
}

// Get settlements with filters
exports.getSettlements = async (req, res) => {
  try {
    const { orderNo, billNo, hotelId, from, to, paymentType, page = 1, limit = 10, isSettled } = req.query;

    let whereClauses = [];
    const params = [];

    if (orderNo) {
      whereClauses.push('OrderNo LIKE ?');
      params.push(`%${orderNo}%`);
    }

    if (hotelId) {
      whereClauses.push('HotelID = ?');
      params.push(Number(hotelId));
    }

    if (from) {
      whereClauses.push('InsertDate >= ?');
      params.push(from);
    }

    if (to) {
      whereClauses.push('InsertDate <= ?');
      params.push(to + ' 23:59:59');
    }

    if (paymentType) {
      whereClauses.push('PaymentType = ?');
      params.push(paymentType);
    }

    if (isSettled !== undefined && isSettled !== "") {
      whereClauses.push('isSettled = ?');
      params.push(Number(isSettled));
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM TrnSettlement ${whereSql}`;
    const countResult = db.prepare(countSql).get(...params);
    const total = countResult ? countResult.total : 0;

    const offset = (Number(page) - 1) * Number(limit);
    const sql = `
      SELECT s.*, b.TxnNo as BillNo, b.Amount as BillTotal
      FROM TrnSettlement s
      LEFT JOIN TAxnTrnbill b ON s.OrderNo = b.orderNo AND s.HotelID = b.HotelID
      ${whereSql}
      ORDER BY s.InsertDate DESC
      LIMIT ? OFFSET ?
    `;
    params.push(Number(limit), Number(offset));

    const settlements = db.prepare(sql).all(...params);

    res.json(ok('Settlements fetched', { settlements, total, page: Number(page), limit: Number(limit) }));
  } catch (error) {
    console.error("Error in getSettlements:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch settlements', error: error.message, stack: error.stack });
  }
};

// Update settlement
exports.updateSettlement = async (req, res) => {
  try {
    const { id } = req.params;
    const { PaymentType, Amount, EditedBy } = req.body;

    const settlement = db.prepare('SELECT * FROM TrnSettlement WHERE SettlementID = ?').get(Number(id));
    if (!settlement) return res.status(404).json({ success: false, message: 'Settlement not found' });

    // Get bill total
    const bill = db.prepare('SELECT Amount FROM TAxnTrnbill WHERE orderNo = ? AND HotelID = ?').get(settlement.OrderNo, settlement.HotelID);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    // Check if updated amount matches bill total (simple check, assuming single settlement per bill)
    // In reality, might need to sum all settlements for the bill
    if (Number(Amount) !== Number(bill.Amount)) {
      return res.status(400).json({ success: false, message: 'Updated amount must match bill grand total' });
    }

    // Log old values
    db.prepare(`
      INSERT INTO TrnSettlementLog (SettlementID, OldPaymentType, OldAmount, NewPaymentType, NewAmount, EditedBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(settlement.SettlementID, settlement.PaymentType, settlement.Amount, PaymentType, Amount, EditedBy);

    // Update
    db.prepare('UPDATE TrnSettlement SET PaymentType = ?, Amount = ? WHERE SettlementID = ?').run(PaymentType, Amount, Number(id));

    res.json(ok('Settlement updated'));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update settlement', error: error.message });
  }
};

// Delete/Reverse settlement
exports.deleteSettlement = async (req, res) => {
  try {
    const { id } = req.params;
    const { EditedBy } = req.body;

    const settlement = db.prepare('SELECT * FROM TrnSettlement WHERE SettlementID = ?').get(Number(id));
    if (!settlement) return res.status(404).json({ success: false, message: 'Settlement not found' });

    // Log as delete
    db.prepare(`
      INSERT INTO TrnSettlementLog (SettlementID, OldPaymentType, OldAmount, NewPaymentType, NewAmount, EditedBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(settlement.SettlementID, settlement.PaymentType, settlement.Amount, null, null, EditedBy);

    // Soft delete: set isSettled = 0
    db.prepare('UPDATE TrnSettlement SET isSettled = 0 WHERE SettlementID = ?').run(Number(id));

    res.json(ok('Settlement reversed'));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reverse settlement', error: error.message });
  }
};
