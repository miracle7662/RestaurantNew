const db = require("../config/db");

exports.getDepartments = async (req, res) => {
  try {

    const { outletid } = req.query;

    const [rows] = await db.query(
      `
      SELECT
        departmentid,
        department_name
      FROM msttable_department
      WHERE outletid = ?
      ORDER BY department_name
      `,
      [outletid]
    );

    res.json(rows);

  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err.message
    });
  }
};
exports.getBills = async (req, res) => {
  try {

    const { date, departmentid, outletid } = req.query;

    const sql = `
      SELECT
        TxnID,
        TxnNo,
        Amount,
        TxnDatetime
      FROM TAxnTrnBill
      WHERE DATE(TxnDatetime) = ?
      AND DeptID = ?
      AND outletid = ?
      AND isBilled = 1
      AND isCancelled = 0
      ORDER BY TxnID DESC
    `;

    const [rows] = await db.query(sql, [
      date,
      departmentid,
      outletid
    ]);

    res.json(rows);

  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message
    });
  }
};
exports.getBillDetails = async (req, res) => {
  try {

    const { txnid } = req.params;

    const sql = `
      SELECT
        TXnDetailID,
        KOTNo,
        item_no,
        item_name,
        RuntimeRate,
        Qty
      FROM TAxnTrnBillDetails
      WHERE TxnID = ?
      ORDER BY TXnDetailID
    `;

    const [rows] = await db.query(sql, [txnid]);

    res.json(rows);

  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message
    });
  }
};

exports.updateBillQty = async (req, res) => {
  const updates = req.body.updates;

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    let txnIds = new Set();

    for (const u of updates) {
      await conn.query(
        `UPDATE TAxnTrnBillDetails
         SET Qty = ?
         WHERE TXnDetailID = ?`,
        [u.newQty, u.txnDetailId]
      );

      const [rows] = await conn.query(
        `SELECT TxnID FROM TAxnTrnBillDetails WHERE TXnDetailID = ?`,
        [u.txnDetailId]
      );

      if (rows.length) txnIds.add(rows[0].TxnID);
    }

    for (const txnId of txnIds) {
      await conn.query(`CALL sp_RecalculateCashBill(?)`, [txnId]);
    }

    await conn.commit();

    res.json({
      success: true,
      message: "Updated & Recalculated"
    });

  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  } finally {
    conn.release();
  }
};