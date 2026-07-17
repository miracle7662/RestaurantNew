const db = require('../config/db');
const { formatMySQLDate } = require('../utils/dateUtils');

// const getReportData = async (req, res) => {
//   try {
//     console.log('========================================');
//     console.log('🚀 REPORT API START');
//     console.log('========================================');

//     // 1️⃣ Log incoming query
//     console.log('📥 Incoming query params:', req.query);

//     const todayStr = formatMySQLDate(new Date()).split(' ')[0];
//     const startDate = req.query.start || todayStr;
//     const endDate = req.query.end || todayStr;
//     const caseType = req.query.caseType || 'billSummary';

//     console.log(`📅 startDate: ${startDate}, endDate: ${endDate}, caseType: ${caseType}`);

//     // ============================================================
//     // NEW: DAILY SUMMARY (aggregated by date)
//     // ============================================================
//     if (caseType === 'dailySummary') {
//   console.log('📊 Generating daily summary (grouped by date) with tip logic...');

//   // 1. Get distinct payment types (like in getBackDayendData)
//   const [paymentTypes] = await db.query(`
//     SELECT DISTINCT PaymentType
//     FROM TrnSettlement
//     WHERE isSettled = 1
//       AND PaymentType IS NOT NULL
//       AND PaymentType != ''
//   `);

//   // 2. Build dynamic payment columns (safe escaping for column names)
//   const paymentColumns = paymentTypes
//     .map((p) => `
//       COALESCE(
//         SUM(
//           CASE
//             WHEN s.PaymentType = '${p.PaymentType.replace(/'/g, "\\'")}'
//             THEN s.Amount
//             ELSE 0
//           END
//         ),
//         0
//       ) AS \`${p.PaymentType.replace(/`/g, '')}\`
//     `)
//     .join(',');

//   // 3. Main summary query with payment type sums + tip logic
//  const summaryQuery = `
//     WITH order_tips AS (
//       SELECT
//         OrderNo,
//         SUM(COALESCE(TipAmount, 0)) AS TipAmount
//       FROM TrnSettlement
//       WHERE isSettled = 1
//       GROUP BY OrderNo
//     ),
//     sett_ranked AS (
//       SELECT
//         OrderNo,
//         PaymentType,
//         SUM(Amount) AS Amount,
//         ROW_NUMBER() OVER (
//           PARTITION BY OrderNo
//           ORDER BY MIN(SettlementID) ASC
//         ) AS rn
//       FROM TrnSettlement
//       WHERE isSettled = 1
//       GROUP BY OrderNo, PaymentType
//     ),
//     sett_adjusted AS (
//       SELECT
//         sr.OrderNo,
//         sr.PaymentType,
//         sr.Amount +
//           CASE
//             WHEN sr.rn = 1
//               AND LOWER(sr.PaymentType) != 'cash'
//             THEN COALESCE(ot.TipAmount, 0)
//             ELSE 0
//           END AS Amount
//       FROM sett_ranked sr
//       LEFT JOIN order_tips ot ON ot.OrderNo = sr.OrderNo
//     ),
   
//     order_payments AS (
//       SELECT
//         OrderNo,
//         ${paymentTypes
//           .map(
//             (p) => `
//           COALESCE(
//             MAX(
//               CASE
//                 WHEN PaymentType = '${p.PaymentType.replace(/'/g, "\\'")}'
//                 THEN Amount
//                 ELSE 0
//               END
//             ),
//             0
//           ) AS \`${p.PaymentType.replace(/`/g, '')}\`
//         `
//           )
//           .join(',')}
//       FROM sett_adjusted
//       GROUP BY OrderNo
//     )
//     SELECT
//       DATE(t.TxnDatetime) AS BillDate,
//       CONCAT(MIN(t.TxnNo), ' - ', MAX(t.TxnNo)) AS BillNoRange,
//       COUNT(DISTINCT t.TxnID) AS TotalBills,
//       SUM(t.Amount) AS TotalAmount,
//       SUM(t.GrossAmt) AS GrossAmount,
//       SUM(t.Discount) AS Discount,
//       SUM(t.TaxableValue) AS TaxableValue,
//       SUM(t.CGST) AS CGST,
//       SUM(t.SGST) AS SGST,
//       SUM(t.RoundOFF) AS RoundOFF,
//       SUM(t.RevKOT) AS RevAmt,
//       SUM(
//         (
//           SELECT COALESCE(
//             SUM(
//               CASE
//                 WHEN LOWER(i.item_name) LIKE '%water%'
//                 THEN d.RuntimeRate * d.Qty
//                 ELSE 0
//               END
//             ), 0
//           )
//           FROM TAxnTrnbilldetails d
//           INNER JOIN mstrestmenu i ON d.ItemID = i.restitemid
//           WHERE d.TxnID = t.TxnID
//         )
//       ) AS Water,
//       SUM(
//         (
//           SELECT COALESCE(SUM(td.Qty), 0)
//           FROM TAxnTrnbilldetails td
//           WHERE td.TxnID = t.TxnID
//         )
//       ) AS TotalItems,
//       SUM(
//         (
//           SELECT COALESCE(SUM(ts.TipAmount), 0)
//           FROM TrnSettlement ts
//           WHERE ts.OrderNo = t.TxnNo
//             AND ts.isSettled = 1
//         )
//       ) AS TipAmount,
//       SUM(
//         t.Amount +
//         (
//           SELECT COALESCE(SUM(ts.TipAmount), 0)
//           FROM TrnSettlement ts
//           WHERE ts.OrderNo = t.TxnNo
//             AND ts.isSettled = 1
//         )
//       ) AS SettlementAmount,
//       -- 👇 now safe: op is one row per order, no fan-out, so SUM here is correct
//       ${paymentTypes
//         .map(
//           (p) => `
//         COALESCE(SUM(op.\`${p.PaymentType.replace(/`/g, '')}\`), 0) AS \`${p.PaymentType.replace(/`/g, '')}\`
//       `
//         )
//         .join(',')}
//     FROM TAxnTrnbill t
//     LEFT JOIN order_payments op
//       ON CAST(op.OrderNo AS CHAR) = CAST(t.TxnNo AS CHAR)
//     WHERE t.isCancelled = 0
//       AND t.isBilled = 1
//       AND DATE(t.TxnDatetime) BETWEEN ? AND ?
//     GROUP BY DATE(t.TxnDatetime)
//     ORDER BY BillDate ASC
//   `;

//   const [summaryRows] = await db.execute(summaryQuery, [startDate, endDate]);

//   console.log(`📊 Daily summary returned ${summaryRows.length} rows`);

//   // 4. Compute grand totals including payment types
//   const grandTotals = summaryRows.reduce(
//     (acc, row) => {
//       acc.TotalBills += row.TotalBills;
//       acc.TotalAmount += row.TotalAmount;
//       acc.GrossAmount += row.GrossAmount;
//       acc.Discount += row.Discount;
//       acc.TaxableValue += row.TaxableValue;
//       acc.CGST += row.CGST;
//       acc.SGST += row.SGST;
//       acc.RoundOFF += row.RoundOFF;
//       acc.RevAmt += row.RevAmt;
//       acc.Water += row.Water;
//       acc.TotalItems += row.TotalItems;
//       acc.TipAmount += row.TipAmount;
//       acc.SettlementAmount += row.SettlementAmount;

//       paymentTypes.forEach((p) => {
//         const key = p.PaymentType;
//         if (row[key] !== undefined) {
//           acc[key] = (acc[key] || 0) + row[key];
//         }
//       });

//       return acc;
//     },
//     {
//       TotalBills: 0,
//       TotalAmount: 0,
//       GrossAmount: 0,
//       Discount: 0,
//       TaxableValue: 0,
//       CGST: 0,
//       SGST: 0,
//       RoundOFF: 0,
//       RevAmt: 0,
//       Water: 0,
//       TotalItems: 0,
//       TipAmount: 0,
//       SettlementAmount: 0,
//     }
//   );

//   console.log('📦 Grand totals:', grandTotals);

//   return res.json({
//     success: true,
//     data: {
//       summaryType: 'dailySummary',
//       rows: summaryRows,
//       grandTotals,
//       paymentTypes: paymentTypes.map((p) => p.PaymentType),
//     },
//   });
// }

//     // ============================================================
//     // ORIGINAL LOGIC FOR DETAILED ORDERS (all other caseTypes)
//     // ============================================================

//     // GET DISTINCT PAYMENT TYPES (for dynamic columns)
//     console.log('🔍 Fetching distinct payment types from TrnSettlement...');
//     const [paymentTypes] = await db.query(`
//       SELECT DISTINCT PaymentType
//       FROM TrnSettlement
//       WHERE isSettled = 1
//         AND PaymentType IS NOT NULL
//         AND PaymentType != ''
//     `);
//     console.log('💳 Payment types fetched:', paymentTypes.map(p => p.PaymentType).join(', ') || '(none)');

//     // Build dynamic payment columns SQL
//     const paymentColumns = paymentTypes
//       .map(p => `
//         COALESCE(
//           MAX(CASE WHEN s.PaymentType = '${p.PaymentType}' THEN s.Amount ELSE 0 END),
//           0
//         ) AS \`${p.PaymentType}\`
//       `)
//       .join(',');

//     // BASE QUERY (unchanged)
//     let baseQuery = `
//       SELECT
//         t.TxnID,
//         t.TxnNo,
//         mt.tableid AS TableID,
//         mt.table_name,
//         mo.outletid,
//         mo.outlet_name,
//         d.department_name,
//         t.CustomerName,
//         t.isHomeDelivery,
//         t.isPickup,
//         (t.GrossAmt + COALESCE((SELECT SUM(ts.tipAmount) FROM TrnSettlement ts WHERE ts.OrderNo = t.TxnNo AND ts.isSettled = 1), 0)) AS SettleAmt,
//         COALESCE((SELECT SUM(ts.tipAmount) FROM TrnSettlement ts WHERE ts.OrderNo = t.TxnNo AND ts.isSettled = 1), 0) AS tipAmount,
//         t.GrossAmt AS billAmount,
//         t.Amount AS TotalAmount,
//         t.Discount,
//         t.GrossAmt AS GrossAmount,
//         t.CGST,
//         t.SGST,
//         t.RoundOFF,
//         t.RevKOT AS RevAmt,
//         t.PAX,
//         t.IGST,
//         t.ServiceCharge_Amount,
//         t.DiscountType,
//         t.DiscPer,
//         t.TxnDatetime,
//         t.BilledDate,
//         t.HandOverEmpID,
//         t.DayEndEmpID,
//         t.MobileNo,
//         t.Address,
//         t.Landmark,
//         t.Steward AS Captain,
//         t.UserId,
//         u.username AS UserName,
//         COALESCE(w.Water, 0) AS Water,
//         ${paymentColumns},
//         GROUP_CONCAT(DISTINCT CASE WHEN td.Qty > 0 THEN td.KOTNo END) AS KOTNo,
//         COALESCE(GROUP_CONCAT(DISTINCT td.RevKOTNo), '') AS RevKOTNo,
//         GROUP_CONCAT(DISTINCT CASE WHEN td.isNCKOT = 1 THEN td.KOTNo END) AS NCKOT,
//         t.NCPurpose,
//         t.NCName,
//         (SELECT GROUP_CONCAT(CONCAT(ts.PaymentType, ':', ts.Amount)) FROM TrnSettlement ts WHERE ts.OrderNo = t.TxnNo AND ts.isSettled = 1) AS Settlements,
//         GROUP_CONCAT(DISTINCT s.PaymentType) AS PaymentType,
//         t.isSetteled,
//         t.isBilled,
//         t.isreversebill,
//         t.isCancelled,
//         COALESCE(SUM(td.Qty), 0) AS TotalItems
//       FROM TAxnTrnbill t
//       LEFT JOIN TAxnTrnbilldetails td ON t.TxnID = td.TxnID
//       LEFT JOIN mst_users u ON t.UserId = u.userid
//       LEFT JOIN msttablemanagement mt ON t.TableID = mt.tableid
//       LEFT JOIN mst_outlets mo ON mt.outletid = mo.outletid
//       LEFT JOIN msttable_department d ON mt.departmentid = d.departmentid
//       LEFT JOIN (
//         SELECT OrderNo, PaymentType, SUM(Amount) AS Amount, SUM(COALESCE(TipAmount,0)) AS TipAmount
//         FROM TrnSettlement
//         WHERE isSettled = 1
//         GROUP BY OrderNo, PaymentType
//       ) s ON CAST(s.OrderNo AS CHAR) = CAST(t.TxnNo AS CHAR) OR CAST(s.OrderNo AS CHAR) = CAST(t.orderNo AS CHAR)
//       LEFT JOIN (
//         SELECT d.TxnID,
//           SUM(CASE WHEN LOWER(i.item_name) LIKE '%water%' THEN d.RuntimeRate * d.Qty ELSE 0 END) AS Water
//         FROM TAxnTrnbilldetails d
//         JOIN mstrestmenu i ON d.ItemID = i.restitemid
//         GROUP BY d.TxnID
//       ) w ON w.TxnID = t.TxnID
//       WHERE t.isCancelled = 0 AND t.isBilled = 1
//     `;

//     // CASE‑WISE FILTERING
//     let whereConditions = [];
//     let havingConditions = [];

//     switch (caseType) {
//       case 'reverseKOTs':
//         whereConditions.push('t.isreversebill = 1');
//         break;
//       case 'ncKOT':
//         havingConditions.push(`NCKOT IS NOT NULL AND NCKOT != ""`);
//         break;
//       case 'creditSummary':
//         whereConditions.push(`EXISTS (SELECT 1 FROM TrnSettlement s WHERE s.OrderNo = t.TxnNo AND s.PaymentType LIKE '%credit%' AND s.isSettled = 1)`);
//         break;
//       case 'discountSummary':
//         whereConditions.push('t.Discount > 0');
//         break;
//       case 'billSummary':
//       default:
//         whereConditions.push('t.isBilled = 1');
//         break;
//     }

//     if (whereConditions.length) baseQuery += ` AND ${whereConditions.join(' AND ')}`;
//     baseQuery += ` AND DATE(t.TxnDatetime) BETWEEN ? AND ?`;
//     baseQuery += ` GROUP BY t.TxnID`;
//     if (havingConditions.length) baseQuery += ` HAVING ${havingConditions.join(' AND ')}`;
//     baseQuery += ` ORDER BY t.TxnDatetime DESC`;

//     const params = [startDate, endDate];

//     console.log('📄 Final SQL Query:\n', baseQuery);
//     console.log('📥 Query parameters:', params);

//     console.log('⏳ Executing main query...');
//     const [rows] = await db.execute(baseQuery, params);
//     console.log('📊 Main query returned', rows.length, 'rows');

//     if (rows.length > 0) {
//       console.log('🔎 Sample row (first):', JSON.stringify(rows[0], null, 2));
//     } else {
//       console.log('⚠️ No rows found – check date range and caseType conditions.');
//     }

//     // FORMAT RESPONSE – attach dynamic payment columns
//     console.log('🗺️ Mapping rows to orders...');
//     const orders = rows.map(row => {
//       const order = {
//         orderNo: row.TxnNo,
//         billNo: row.TxnNo,
//         kotNo: row.KOTNo || '',
//         revKotNo: row.RevKOTNo || '',
//         revKot: row.isreversebill == 1,
//         billDate: row.TxnDatetime ? new Date(row.TxnDatetime).toISOString().split('T')[0] : '',
//         date: row.TxnDatetime,
//         customerName: row.CustomerName || 'N/A',
//         tableName: row.table_name || '',
//         outletName: row.outlet_name || '',
//         departmentName: row.department_name || '',
//         captain: row.Captain || 'N/A',
//         waiter: row.Captain || 'Unknown',
//         user: row.UserName || 'N/A',
//         pax: Number(row.PAX || 0),
//         mobile: row.MobileNo || 'N/A',
//         address: row.Address || 'N/A',
//         landmark: row.Landmark || '',
//         orderType: row.isHomeDelivery ? 'Home Delivery' : (row.isPickup ? 'Pickup' : 'Dine-in'),
//         settleAmount: Number(row.SettleAmt || 0),
//         tipAmount: Number(row.tipAmount || 0),
//         billAmount: Number(row.billAmount || 0),
//         netAmount: Number(row.TotalAmount || 0),
//         taxbleAmount: Number(row.CGST || 0) + Number(row.SGST || 0) + Number(row.IGST || 0),
//         discount: Number(row.Discount || 0),
//         cgst: Number(row.CGST || 0),
//         sgst: Number(row.SGST || 0),
//         igst: Number(row.IGST || 0),
//         roundOff: Number(row.RoundOFF || 0),
//         grossAmount: Number(row.GrossAmount || 0),
//         revAmt: Number(row.RevAmt || 0),
//         serviceCharge: Number(row.ServiceCharge_Amount || 0),
//         serviceCharge_Amount: Number(row.ServiceCharge_Amount || 0),
//         water: Number(row.Water || 0),
//         discountType: row.DiscountType,
//         discPer: row.DiscPer,
//         itemsCount: Number(row.TotalItems || 0),
//         paymentMode: row.PaymentType || 'Cash',
//         isHomeDelivery: row.isHomeDelivery,
//         isPickup: row.isPickup,
//         isCancelled: row.isCancelled,
//         reverseBill: row.isreversebill,
//         isBilled: row.isBilled,
//         isSettled: row.isSetteled,
//         ncKot: row.NCKOT || '',
//         ncPurpose: row.NCPurpose || '',
//         ncName: row.NCName || '',
//         handOverEmpID: row.HandOverEmpID,
//         dayEndEmpID: row.DayEndEmpID,
//       };

//       // Attach dynamic payment columns
//       paymentTypes.forEach(pt => {
//         const colName = pt.PaymentType;
//         order[colName] = Number(row[colName] || 0);
//       });

//       // payments object (compatibility)
//       order.payments = {};
//       paymentTypes.forEach(pt => {
//         order.payments[pt.PaymentType] = order[pt.PaymentType];
//       });

//       return order;
//     });

//     console.log('✅ Mapped orders count:', orders.length);
//     if (orders.length > 0) {
//       console.log('🧾 Sample mapped order:', JSON.stringify(orders[0], null, 2));
//     }

//     // Summary (using netAmount)
//     const summary = {
//       totalOrders: orders.length,
//       totalSales: orders.reduce((sum, o) => sum + (o.netAmount || 0), 0),
//       totalSettlement: orders.reduce((sum, o) => sum + (o.settleAmount || 0), 0),
//       totalDiscount: orders.reduce((sum, o) => sum + (o.discount || 0), 0),
//       totalTip: orders.reduce((sum, o) => sum + (o.tipAmount || 0), 0),
//     };
//     console.log('📦 Summary:', summary);

//     console.log('✅ Sending success response');
//     return res.json({
//       success: true,
//       data: {
//         orders,
//         summary,
//         caseType,
//       },
//     });
//   } catch (error) {
//     console.error('❌ REPORT API ERROR:', error);
//     console.error('Stack trace:', error.stack);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch report data',
//       error: error.message,
//     });
//   }
// };
const getDuplicateBill = async (req, res) => {
  try {
    const { billNo, outletId } = req.query;

    console.log('=== DUPLICATE BILL DEBUG START ===');
    console.log('billNo:', billNo, 'outletId:', outletId);

    if (!billNo || !outletId) {
      return res.status(400).json({
        success: false,
        message: 'billNo and outletId required'
      });
    }

    let whereClause = `
      t.outletid = ?
      AND t.isCancelled = 0
      AND t.isBilled = 1
      AND (t.TxnNo = ? OR t.orderNo = ?)
    `;

    const params = [outletId, billNo, billNo];

    if (req.query.billDate) {
      whereClause += ` AND DATE(t.TxnDatetime) = ?`;
      params.push(req.query.billDate);
    }

    // ✅ BILL HEADER QUERY
   const billQuery = `
  SELECT
    t.TxnID,
    t.TxnNo,
    t.orderNo,
    t.TableID,
    t.Order_Type,  -- ✅ ADD THIS
    t.DeptID,      -- ✅ ADD THIS
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
    t.TaxableValue,
    t.TxnDatetime,
    t.BilledDate,
    t.Steward AS selectedWaiter,
    mt.table_name AS selectedTable,
    h.hotel_name AS restaurantName,
    h.address,
    h.trn_gstno,
    h.fssai_no,
    h.phone,
    mo.outlet_name,
    u.username,
    d.department_name  -- ✅ ADD THIS - join with department table
  FROM TAxnTrnbill t
  LEFT JOIN msttablemanagement mt ON t.TableID = mt.tableid
  LEFT JOIN mst_outlets mo ON t.outletid = mo.outletid
  LEFT JOIN msthotelmasters h ON mo.hotelid = h.hotelid
  LEFT JOIN mst_users u ON t.UserId = u.userid
  LEFT JOIN msttable_department d ON t.DeptID = d.departmentid  -- ✅ ADD THIS JOIN
  WHERE ${whereClause}
  ORDER BY t.TxnID DESC
  LIMIT 1
`;

    console.log('Executing bill query');

    const [billRows] = await db.execute(billQuery, params);

    const bill = billRows?.[0];

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // ✅ Convert numeric values
    const taxableValueFromDB = parseFloat(bill.TaxableValue) || 0;
    const cgstAmt = parseFloat(bill.CGST) || 0;
    const sgstAmt = parseFloat(bill.SGST) || 0;
    const igstAmt = parseFloat(bill.IGST) || 0;
    const grandTotal = parseFloat(bill.Amount) || 0;
    const discount = parseFloat(bill.Discount) || 0;
    const grossAmt = parseFloat(bill.GrossAmt) || 0;

    const subtotal = grossAmt - discount;

    const taxableValue =
      taxableValueFromDB > 0
        ? taxableValueFromDB
        : subtotal;

    // ✅ Compute tax rates
    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;

    if (taxableValue > 0) {
      cgstRate = (cgstAmt / taxableValue) * 100;
      sgstRate = (sgstAmt / taxableValue) * 100;
      igstRate = (igstAmt / taxableValue) * 100;
    }

    // ✅ ITEMS QUERY
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
        d.VariantName AS modifier

      FROM TAxnTrnbilldetails d

      LEFT JOIN mstrestmenu m
        ON d.ItemID = m.restitemid

      LEFT JOIN TAxnTrnbill t
        ON d.TxnID = t.TxnID

      WHERE d.TxnID = ?
      AND d.Qty > 0

      ORDER BY d.TXnDetailID
    `;

    console.log('Executing items query for TxnID:', bill.TxnID);

    const [items] = await db.execute(itemsQuery, [bill.TxnID]);

    // ✅ PAYMENT QUERY
    const paymentQuery = `
      SELECT PaymentType
      FROM TrnSettlement
      WHERE (OrderNo = ? OR TxnNo = ?)
      AND isSettled = 1
    `;

    const [payments] = await db.execute(paymentQuery, [
      bill.TxnNo,
      bill.TxnNo
    ]);

    const roundOffValue = parseFloat(bill.roundOffValue) || 0;

    const roundOffEnabled =
      Math.abs(roundOffValue) > 0.01;

    // ✅ FINAL RESPONSE
   const responseData = {
  success: true,
  data: {
    items,
    orderNo: bill.orderNo,
    txnNo: bill.TxnNo,  // ✅ ADD THIS - Bill number
    selectedTable: bill.selectedTable,
    selectedWaiter: bill.selectedWaiter,
    customerName: bill.CustomerName,
    mobileNumber: bill.mobileNumber,
    currentTxnId: bill.TxnID.toString(),
    
    // ✅ ADD THESE FIELDS
    orderType: bill.Order_Type || 'Dine-in',  // 'Dine-in', 'Pickup', 'Delivery'
    departmentName: bill.department_name || '',  // Department name for dine-in
    activeTab: bill.Order_Type || 'Dine-in',  // For compatibility
    
    taxCalc: {
      taxableValue: Number(taxableValue.toFixed(2)),
      subtotal: Number(subtotal.toFixed(2)),
      cgstAmt: Number(cgstAmt.toFixed(2)),
      sgstAmt: Number(sgstAmt.toFixed(2)),
      igstAmt: Number(igstAmt.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2))
    },
    
    taxRates: {
      cgst: Number(cgstRate.toFixed(2)),
      sgst: Number(sgstRate.toFixed(2)),
      igst: Number(igstRate.toFixed(2))
    },
    
    discount: Number(discount.toFixed(2)),
    reason: bill.DiscPer ? `${bill.DiscPer}%` : 'Fixed',
    roundOffEnabled: roundOffEnabled,
    roundOffValue: Number(roundOffValue.toFixed(2)),
    selectedPaymentModes: payments.map(p => p.PaymentType),
    
    // Hotel Details
    restaurantName: bill.restaurantName || '',
    outletName: bill.outlet_name || '',
    address: bill.address || '',
    gstNo: bill.trn_gstno || '',
    fssaiNo: bill.fssai_no || '',
    phone: bill.phone || '',
    billDate: bill.TxnDatetime,
    BilledDate: bill.BilledDate,
  }
};

    console.log(
      '📤 Sending response:',
      responseData
    );

    console.log(
      '=== DUPLICATE BILL DEBUG END ==='
    );

    res.json(responseData);

  } catch (error) {

    console.error(
      '🔥 ERROR in getDuplicateBill:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill data',
      error: error.message
    });
  }
};

const getDailySummary = async (req, res) => {
  try {
    console.log('📊 DAILY SUMMARY ENDPOINT');
    const todayStr = formatMySQLDate(new Date()).split(' ')[0];
    const startDate = req.query.start || todayStr;
    const endDate = req.query.end || todayStr;
    
    // 🔹 Get outletid from query or user context
    const outletid = req.query.outletid || req.user?.outletid;

    console.log(`📅 startDate: ${startDate}, endDate: ${endDate}, outletid: ${outletid}`);

    // 1️⃣ Call stored procedure (unchanged)
    const [results] = await db.execute(
      'CALL sp_get_daily_summary(?, ?)',
      [startDate, endDate]
    );

    const summaryRows = results[0] || [];
    const paymentTypesResult = results[1] || [];
    let paymentTypes = paymentTypesResult.map(p => p.PaymentType);

    // 2️⃣ ✅ Sort paymentTypes by sequence (if outletid available)
    if (outletid) {
      try {
        // Fetch ordered mode names from payment_modes
        const [modes] = await db.query(
          `SELECT pt.mode_name
           FROM payment_modes pm
           JOIN payment_types pt ON pm.paymenttypeid = pt.paymenttypeid
           WHERE pm.outletid = ? AND pm.is_active = 1
           ORDER BY pm.sequence ASC`,
          [outletid]
        );
        const orderedNames = modes.map(m => m.mode_name);

        // Sort paymentTypes according to orderedNames
        paymentTypes.sort((a, b) => {
          const idxA = orderedNames.indexOf(a);
          const idxB = orderedNames.indexOf(b);
          if (idxA === -1 && idxB === -1) return a.localeCompare(b);
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });

        console.log('🔹 Sorted payment types by sequence:', paymentTypes);
      } catch (err) {
        console.warn('⚠️ Failed to fetch ordered payment modes, using default order:', err.message);
      }
    } else {
      console.warn('⚠️ outletid not provided – payment types will not be sorted by sequence');
    }

    // 3️⃣ Compute grand totals (same as before – uses sorted paymentTypes)
    const grandTotals = summaryRows.reduce(
      (acc, row) => {
        acc.TotalBills += row.TotalBills || 0;
        acc.TotalAmount += row.TotalAmount || 0;
        acc.GrossAmount += row.GrossAmount || 0;
        acc.Discount += row.Discount || 0;
        acc.TaxableValue += row.TaxableValue || 0;
        acc.CGST += row.CGST || 0;
        acc.SGST += row.SGST || 0;
        acc.RoundOFF += row.RoundOFF || 0;
        acc.RevAmt += row.RevAmt || 0;
        acc.Water += row.Water || 0;
        acc.TotalItems += row.TotalItems || 0;
        acc.TipAmount += row.TipAmount || 0;
        acc.SettlementAmount += row.SettlementAmount || 0;

        paymentTypes.forEach((type) => {
          if (row[type] !== undefined) {
            acc[type] = (acc[type] || 0) + row[type];
          }
        });

        return acc;
      },
      {
        TotalBills: 0,
        TotalAmount: 0,
        GrossAmount: 0,
        Discount: 0,
        TaxableValue: 0,
        CGST: 0,
        SGST: 0,
        RoundOFF: 0,
        RevAmt: 0,
        Water: 0,
        TotalItems: 0,
        TipAmount: 0,
        SettlementAmount: 0,
      }
    );

    console.log('📦 Grand totals:', grandTotals);

    return res.json({
      success: true,
      data: {
        summaryType: 'dailySummary',
        rows: summaryRows,
        grandTotals,
        paymentTypes,   // ✅ sorted by sequence
      },
    });
  } catch (error) {
    console.error('❌ DAILY SUMMARY ERROR:', error);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch daily summary',
      error: error.message,
    });
  }
};

module.exports = {  getDuplicateBill, getDailySummary };