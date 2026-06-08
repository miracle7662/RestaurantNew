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

    // 1. Bills list – sabhi billed & uncancelled bills (department & outlet ke hisaab se)
    const billsSql = `
    SELECT
    tb.TxnID,
    tb.TxnNo,
    tb.Amount,
    tb.TxnDatetime

FROM TAxnTrnBill tb

WHERE DATE(tb.TxnDatetime) = ?
    AND tb.DeptID = ?
    AND tb.outletid = ?
    AND tb.isBilled = 1
    AND tb.isCancelled = 0

    
    
    AND EXISTS (
        SELECT 1
        FROM trnsettlement ts1
        WHERE ts1.TxnID = tb.TxnID
        AND ts1.PaymentType = 'Cash'
    )

    
    -- Cash + ICICI / mixed payment exclude
    AND NOT EXISTS (
        SELECT 1
        FROM trnsettlement ts2
        WHERE ts2.TxnID = tb.TxnID
        AND ts2.PaymentType <> 'Cash'
    )

ORDER BY tb.TxnNo ASC;
    `;
    const [bills] = await db.query(billsSql, [date, departmentid, outletid]);

    // 2. Totals query – cashTotal, creditTotal, billingTotal (aapki di hui)
    const totalsSql = `
      SELECT 
        COALESCE(SUM(
          CASE 
            -- Pure Cash bills
            WHEN EXISTS (
              SELECT 1 FROM trnsettlement ts1
              WHERE ts1.TxnID = tb.TxnID AND ts1.PaymentType = 'Cash'
            )
            AND NOT EXISTS (
              SELECT 1 FROM trnsettlement ts2
              WHERE ts2.TxnID = tb.TxnID AND ts2.PaymentType <> 'Cash'
            )
            THEN tb.Amount ELSE 0
          END
        ), 0) AS cashTotal,

        COALESCE(SUM(
          CASE 
            -- Credit bills (non-Cash or no settlement)
            WHEN EXISTS (
              SELECT 1 FROM trnsettlement ts3
              WHERE ts3.TxnID = tb.TxnID AND ts3.PaymentType <> 'Cash'
            )
            OR NOT EXISTS (
              SELECT 1 FROM trnsettlement ts4
              WHERE ts4.TxnID = tb.TxnID
            )
            THEN tb.Amount ELSE 0
          END
        ), 0) AS creditTotal,

        COALESCE(SUM(tb.Amount), 0) AS billingTotal

      FROM TAxnTrnBill tb
      WHERE DATE(tb.TxnDatetime) = ?
        AND tb.outletid = ?
        AND tb.isBilled = 1
        AND tb.isDayEnd = 1
        AND (tb.isSetteled = 1 OR tb.isreversebill = 1)
    `;

    const [totalsRows] = await db.query(totalsSql, [date, outletid]);
    const cashTotal = Number(totalsRows[0]?.cashTotal ?? 0);
    const creditTotal = Number(totalsRows[0]?.creditTotal ?? 0);
    const billingTotal = Number(totalsRows[0]?.billingTotal ?? 0);

    // 3. Sab kuch ek saath bhejo
    res.json({
      bills: bills,
      cashTotal: cashTotal,
      creditTotal: creditTotal,
      billingTotal: billingTotal
    });

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