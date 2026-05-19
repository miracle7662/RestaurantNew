const db = require('../config/db');
const { formatMySQLDate } = require('../utils/dateUtils');

const getReportData = async (req, res) => {

  try {

    console.log('========================================');
    console.log('REPORT API START');
    console.log('========================================');

    const todayStr = formatMySQLDate(new Date())
      .split(' ')[0];

    const startDate =
      req.query.start || todayStr;

    const endDate =
      req.query.end || todayStr;

    const caseType =
      req.query.caseType || 'billSummary';

    // ======================================================
    // GET PAYMENT TYPES
    // ======================================================

    const [paymentTypes] = await db.query(`
      SELECT DISTINCT PaymentType
      FROM TrnSettlement
      WHERE isSettled = 1
        AND PaymentType IS NOT NULL
        AND PaymentType != ''
    `);

    // ======================================================
    // DYNAMIC PAYMENT COLUMNS
    // ======================================================

    const paymentColumns = paymentTypes
      .map(
        (p) => `
          COALESCE(
            MAX(
              CASE
                WHEN s.PaymentType = '${p.PaymentType}'
                THEN s.Amount
                ELSE 0
              END
            ),
            0
          ) AS \`${p.PaymentType}\`
        `
      )
      .join(',');

    // ======================================================
    // BASE QUERY
    // ======================================================

   let baseQuery = `

    SELECT

        t.TxnID,
        t.TxnNo,

        mt.tableid AS TableID,
        mt.table_name,

        mo.outletid,
        mo.outlet_name,

        d.department_name,

        t.CustomerName,
        t.isHomeDelivery,
        t.isPickup,

        -- ==========================================
        -- SETTLEMENT AMOUNT
        -- ==========================================

        (
          t.GrossAmt +
          COALESCE(
            (
              SELECT SUM(ts.tipAmount)
              FROM TrnSettlement ts
              WHERE ts.OrderNo = t.TxnNo
                AND ts.isSettled = 1
            ),
            0
          )
        ) AS SettleAmt,

        -- ==========================================
        -- TIP AMOUNT
        -- ==========================================

        COALESCE(
          (
            SELECT SUM(ts.tipAmount)
            FROM TrnSettlement ts
            WHERE ts.OrderNo = t.TxnNo
              AND ts.isSettled = 1
          ),
          0
        ) AS tipAmount,

        t.GrossAmt AS billAmount,

        -- ==========================================
        -- BILL AMOUNTS
        -- ==========================================

        t.Amount AS TotalAmount,
        t.Discount,
        t.GrossAmt AS GrossAmount,

        t.CGST,
        t.SGST,
        t.RoundOFF,
        t.RevKOT AS RevAmt,

        t.PAX,
        t.IGST,
        t.ServiceCharge_Amount,

        t.DiscountType,
        t.DiscPer,

        t.TxnDatetime,
        t.BilledDate,

        t.HandOverEmpID,
        t.DayEndEmpID,

        t.MobileNo,
        t.Address,
        t.Landmark,

        t.Steward AS Captain,

        t.UserId,
        u.username AS UserName,

        -- ==========================================
        -- WATER AMOUNT
        -- ==========================================

        COALESCE(w.Water, 0) AS Water,

        -- ==========================================
        -- DYNAMIC PAYMENT COLUMNS
        -- ==========================================

        ${paymentColumns},

        -- ==========================================
        -- KOT DETAILS
        -- ==========================================

        GROUP_CONCAT(
          DISTINCT CASE
            WHEN td.Qty > 0
            THEN td.KOTNo
          END
        ) AS KOTNo,

        COALESCE(
          GROUP_CONCAT(DISTINCT td.RevKOTNo),
          ''
        ) AS RevKOTNo,

        GROUP_CONCAT(
          DISTINCT CASE
            WHEN td.isNCKOT = 1
            THEN td.KOTNo
          END
        ) AS NCKOT,

        t.NCPurpose,
        t.NCName,

        -- ==========================================
        -- SETTLEMENT DETAILS
        -- ==========================================

        (
          SELECT GROUP_CONCAT(
            CONCAT(
              ts.PaymentType,
              ':',
              ts.Amount
            )
          )
          FROM TrnSettlement ts
          WHERE ts.OrderNo = t.TxnNo
            AND ts.isSettled = 1
        ) AS Settlements,

        GROUP_CONCAT(
          DISTINCT s.PaymentType
        ) AS PaymentType,

        -- ==========================================
        -- STATUS
        -- ==========================================

        t.isSetteled,
        t.isBilled,
        t.isreversebill,
        t.isCancelled,

        -- ==========================================
        -- TOTAL ITEMS
        -- ==========================================

        COALESCE(
          SUM(td.Qty),
          0
        ) AS TotalItems

    FROM TAxnTrnbill t

    -- ==========================================
    -- BILL DETAILS
    -- ==========================================

    LEFT JOIN TAxnTrnbilldetails td
      ON t.TxnID = td.TxnID

    -- ==========================================
    -- USERS
    -- ==========================================

    LEFT JOIN mst_users u
      ON t.UserId = u.userid

    -- ==========================================
    -- TABLE DETAILS
    -- ==========================================

    LEFT JOIN msttablemanagement mt
      ON t.TableID = mt.tableid

    LEFT JOIN mst_outlets mo
      ON mt.outletid = mo.outletid

    LEFT JOIN msttable_department d
      ON mt.departmentid = d.departmentid

    -- ==========================================
    -- PAYMENT SUMMARY
    -- ==========================================

    LEFT JOIN (

        SELECT

            OrderNo,
            PaymentType,

            SUM(Amount) AS Amount,

            SUM(
              COALESCE(TipAmount, 0)
            ) AS TipAmount

        FROM TrnSettlement

        WHERE isSettled = 1

        GROUP BY
            OrderNo,
            PaymentType

    ) s

    ON (
        CAST(s.OrderNo AS CHAR)
        = CAST(t.TxnNo AS CHAR)

        OR

        CAST(s.OrderNo AS CHAR)
        = CAST(t.orderNo AS CHAR)
    )

    -- ==========================================
    -- WATER AMOUNT SUBQUERY
    -- ==========================================

    LEFT JOIN (

        SELECT

            d.TxnID,

            SUM(
              CASE
                WHEN LOWER(i.item_name)
                  LIKE '%water%'
                THEN d.RuntimeRate * d.Qty
                ELSE 0
              END
            ) AS Water

        FROM TAxnTrnbilldetails d

        JOIN mstrestmenu i
          ON d.ItemID = i.restitemid

        GROUP BY d.TxnID

    ) w

    ON w.TxnID = t.TxnID

    -- ==========================================
    -- FILTERS
    -- ==========================================

    WHERE t.isCancelled = 0
      AND t.isBilled = 1

`;

    let whereConditions = [];
    let havingConditions = [];

    let groupByClause = `
      GROUP BY t.TxnID
    `;

    let orderByClause = `
      ORDER BY t.TxnDatetime DESC
    `;

    let params = [
      startDate,
      endDate
    ];

    // ======================================================
    // CASE WISE FILTERING
    // ======================================================

    switch (caseType) {

      case 'reverseKOTs':

        whereConditions.push(
          't.isreversebill = 1'
        );

        break;

      case 'ncKOT':

        havingConditions.push(`
          NCKOT IS NOT NULL
          AND NCKOT != ""
        `);

        break;

      case 'creditSummary':

        whereConditions.push(`
          EXISTS (
            SELECT 1
            FROM TrnSettlement s
            WHERE s.OrderNo = t.TxnNo
              AND s.PaymentType LIKE '%credit%'
              AND s.isSettled = 1
          )
        `);

        break;

      case 'discountSummary':

        whereConditions.push(
          't.Discount > 0'
        );

        break;

      case 'billSummary':

        whereConditions.push(
          't.isBilled = 1'
        );

        break;

      default:

        whereConditions.push(
          't.isBilled = 1'
        );
    }

    // ======================================================
    // WHERE CONDITIONS
    // ======================================================

    if (whereConditions.length > 0) {

      baseQuery += `
        AND ${whereConditions.join(' AND ')}
      `;
    }

    // ======================================================
    // DATE FILTER
    // ======================================================

    baseQuery += `
      AND DATE(t.TxnDatetime)
      BETWEEN ? AND ?
    `;

    // ======================================================
    // GROUP BY
    // ======================================================

    baseQuery += groupByClause;

    // ======================================================
    // HAVING
    // ======================================================

    if (havingConditions.length > 0) {

      baseQuery += `
        HAVING ${havingConditions.join(' AND ')}
      `;
    }

    // ======================================================
    // ORDER BY
    // ======================================================

    baseQuery += orderByClause;

    console.log('========================================');
    console.log('FINAL QUERY');
    console.log(baseQuery);
    console.log('========================================');

    const [rows] = await db.execute(
      baseQuery,
      params
    );

    console.log(
      'TOTAL ROWS =>',
      rows.length
    );

    // ======================================================
    // FORMAT RESPONSE
    // ======================================================

    const orders = rows.map((row) => {

      // ==============================================
      // PAYMENT OBJECT
      // ==============================================

      const payments = {};

      paymentTypes.forEach((p) => {

        payments[p.PaymentType] = Number(
          row[p.PaymentType] || 0
        );

      });

      return {

        // ==========================================
        // BASIC
        // ==========================================

        txnId: row.TxnID,

        orderNo: row.TxnNo,

        table: row.TableID,

        tableName: row.table_name || '',

        outletid: row.outletid,

        outletName: row.outlet_name || '',

        departmentName:
          row.department_name || '',

        customerName:
          row.CustomerName || '',

        captain:
          row.Captain || 'N/A',

        waiter:
          row.Captain || 'Unknown',

        user:
          row.UserName || 'N/A',

        date:
          row.TxnDatetime,

        time:
          row.TxnDatetime,

        // ==========================================
        // BILL FLAGS
        // ==========================================

        isHomeDelivery:
          row.isHomeDelivery,

        isPickup:
          row.isPickup,

        reverseBill:
          row.isreversebill,

        isCancelled:
          row.isCancelled,

        isBilled:
          row.isBilled,

        isSettled:
          row.isSetteled,

        // ==========================================
        // AMOUNTS
        // ==========================================

        amount: Number(
          row.TotalAmount || 0
        ),

        grossAmount: Number(
          row.GrossAmount || 0
        ),

        billAmount: Number(
          row.billAmount || 0
        ),

        settleAmount: Number(
          row.SettleAmt || 0
        ),

        tipAmount: Number(
          row.tipAmount || 0
        ),

        discount: Number(
          row.Discount || 0
        ),

        cgst: Number(
          row.CGST || 0
        ),

        sgst: Number(
          row.SGST || 0
        ),

        roundOff: Number(
          row.RoundOFF || 0
        ),

        revAmt: Number(
          row.RevAmt || 0
        ),

        water: Number(
          row.Water || 0
        ),

        // ==========================================
        // ITEMS
        // ==========================================

        items: Number(
          row.TotalItems || 0
        ),

        pax: Number(
          row.PAX || 0
        ),

        // ==========================================
        // KOT
        // ==========================================

        kotNo:
          row.KOTNo || '',

        revKotNo:
          row.RevKOTNo || '',

        ncKot:
          row.NCKOT || '',

        ncPurpose:
          row.NCPurpose || '',

        ncName:
          row.NCName || '',

        // ==========================================
        // PAYMENT
        // ==========================================

        paymentType:
          row.PaymentType || '',

        settlements:
          row.Settlements || '',

        payments,

        // ==========================================
        // STATUS
        // ==========================================

        type: row.isreversebill
          ? 'Reversed'
          : (
              row.PaymentType
              || (
                row.isSetteled
                  ? 'Cash'
                  : 'Unpaid'
              )
            ),

        status: row.isSetteled
          ? 'Settled'
          : (
              row.isBilled
                ? 'Billed'
                : 'Pending'
            ),
      };
    });

    // ======================================================
    // SUMMARY
    // ======================================================

    const summary = {

      totalOrders:
        orders.length,

      totalSales:
        orders.reduce(
          (sum, o) =>
            sum + (
              o.amount || 0
            ),
          0
        ),

      totalSettlement:
        orders.reduce(
          (sum, o) =>
            sum + (
              o.settleAmount || 0
            ),
          0
        ),

      totalDiscount:
        orders.reduce(
          (sum, o) =>
            sum + (
              o.discount || 0
            ),
          0
        ),

      totalTip:
        orders.reduce(
          (sum, o) =>
            sum + (
              o.tipAmount || 0
            ),
          0
        ),
    };

    // ======================================================
    // RESPONSE
    // ======================================================

    return res.json({

      success: true,

      data: {

        orders,

        summary,

        caseType,
      }
    });

  } catch (error) {

    console.error(
      'REPORT API ERROR =>',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Failed to fetch report data',

      error:
        error.message
    });
  }
};

const getDuplicateBill = async (req, res) => {
  try {
    console.log('=== DUPLICATE BILL FETCH START ===');
    console.log('Query params:', { billNo: req.query.billNo, billDate: req.query.billDate, outletId: req.query.outletId });
    
    const { billNo, billDate, outletId } = req.query;

    if (!billNo || !outletId) {
      return res.status(400).json({ success: false, message: 'billNo and outletId required' });
    }

    // Build WHERE clause - search both TxnNo and orderNo for takeaway bills
    let whereClause = 't.outletid = ? AND t.isCancelled = 0 AND t.isBilled = 1 AND (t.TxnNo = ? OR t.orderNo = ?)';
    const params = [outletId, billNo, billNo];

    if (billDate) {
      whereClause += ' AND DATE(t.TxnDatetime) = ?';
      params.push(billDate);
    }

    // Fetch bill header
    const billQuery = `
      SELECT 
        t.TxnID,
        t.TxnNo,
        t.TxnNo AS orderNo,
        t.TableID,
        t.CustomerName,
        t.MobileNo AS mobileNumber,
        t.Discount,
        t.DiscPer,
        t.RoundOFF AS roundOffValue,
        t.isSetteled,
        t.CGST,
        t.SGST,
        t.IGST,
        t.GrossAmt,
        t.Amount,
        t.TxnDatetime,
        t.BilledDate,
        t.Steward AS selectedWaiter,
        mt.table_name AS selectedTable,
        h.hotel_name AS restaurantName,
        mo.outlet_name,
        u.username
      FROM TAxnTrnbill t
      LEFT JOIN msttablemanagement mt ON t.TableID = mt.tableid
      LEFT JOIN mst_outlets mo ON t.outletid = mo.outletid
      LEFT JOIN msthotelmasters h ON mo.hotelid = h.hotelid
      LEFT JOIN mst_users u ON t.UserId = u.userid
      WHERE ${whereClause}
      ORDER BY t.TxnID DESC
      LIMIT 1
    `;

    console.log('Executing bill query:', billQuery.substring(0, 200) + '...');
    console.log('Bill query params:', params);
    
    const billResult = await db.execute(billQuery, params);
    const billRows = billResult[0] || [];
    const bill = billRows[0] || null;
    
    console.log('Bill found:', !!bill);

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    // Fetch bill items from TAxnTrnbilldetails
    const itemsQuery = `
      SELECT
        d.ItemID AS id,
        m.item_name AS name,
        d.Qty AS qty,
        d.RuntimeRate AS price,
        d.KOTNo AS kotNo,
        d.isNCKOT,
        t.NCName,
        t.NCPurpose,
        d.SpecialInst AS note,
        d.VariantName AS modifier,
        NULL AS hsn
      FROM TAxnTrnbilldetails d
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      LEFT JOIN TAxnTrnbill t ON d.TxnID = t.TxnID
      WHERE d.TxnID = ? AND d.Qty > 0
      ORDER BY d.TXnDetailID
    `;

    const itemsResult = await db.execute(itemsQuery, [bill.TxnID]);
    const items = itemsResult[0] || [];

    // Tax calculations
    const subtotal = parseFloat(bill.GrossAmt || 0) - parseFloat(bill.Discount || 0);
    const taxableValue = subtotal;
    const cgstAmt = parseFloat(bill.CGST || 0);
    const sgstAmt = parseFloat(bill.SGST || 0);
    const igstAmt = parseFloat(bill.IGST || 0);
    const grandTotal = parseFloat(bill.Amount || 0);
    const roundOffValue = parseFloat(bill.roundOffValue || 0);
    const roundOffEnabled = Math.abs(roundOffValue) > 0.01;

    const cgstRate = cgstAmt > 0 && subtotal > 0 ? (cgstAmt / subtotal) * 100 : 0;
    const sgstRate = sgstAmt > 0 && subtotal > 0 ? (sgstAmt / subtotal) * 100 : 0;
    const igstRate = igstAmt > 0 && subtotal > 0 ? (igstAmt / subtotal) * 100 : 0;

    // Payment modes - use TxnNo or orderNo
    const orderNoForPayments = bill.TxnNo || bill.orderNo;
    const paymentsQuery = `
      SELECT PaymentType
      FROM TrnSettlement
      WHERE (OrderNo = ? OR TxnNo = ?) AND isSettled = 1
    `;
    const paymentsResult = await db.execute(paymentsQuery, [orderNoForPayments, orderNoForPayments]);
    const payments = paymentsResult[0] || [];

    res.json({
      success: true,
      data: {
        items,
        orderNo: bill.orderNo,
        selectedTable: bill.selectedTable,
        selectedWaiter: bill.selectedWaiter,
        customerName: bill.CustomerName,
        mobileNumber: bill.mobileNumber,
        currentTxnId: bill.TxnID.toString(),
        taxCalc: {
          taxableValue: parseFloat(taxableValue.toFixed(2)),
          subtotal: parseFloat(subtotal.toFixed(2)),
          cgstAmt: parseFloat(cgstAmt.toFixed(2)),
          sgstAmt: parseFloat(sgstAmt.toFixed(2)),
          igstAmt: parseFloat(igstAmt.toFixed(2)),
          grandTotal: parseFloat(grandTotal.toFixed(2))
        },
        taxRates: {
          cgst: parseFloat(cgstRate.toFixed(2)),
          sgst: parseFloat(sgstRate.toFixed(2)),
          igst: parseFloat(igstRate.toFixed(2))
        },
        discount: parseFloat(bill.Discount || 0),
        reason: bill.DiscPer ? `${bill.DiscPer}%` : 'Fixed',
        roundOffEnabled,
        roundOffValue,
        selectedPaymentModes: payments.map(p => p.PaymentType),
        restaurantName: bill.restaurantName || bill.outlet_name || 'Restaurant',
        outletName: bill.outlet_name,
        billDate: bill.TxnDatetime
      }
    });
  } catch (error) {
    console.error('=== DUPLICATE BILL ERROR ===');
    console.error('Full error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to fetch bill data', error: error.message });
  }
};

module.exports = { getReportData, getDuplicateBill };