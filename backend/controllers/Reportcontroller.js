const db = require('../config/db');
const { formatMySQLDate } = require('../utils/dateUtils');

const getReportData = async (req, res) => {
  try {
    console.log('========================================');
    console.log('REPORT API START');
    console.log('========================================');

    const todayStr = formatMySQLDate(new Date()).split(' ')[0];
    const startDate = req.query.start || todayStr;
    const endDate = req.query.end || todayStr;
    const caseType = req.query.caseType || 'billSummary';

    // ======================================================
    // GET DISTINCT PAYMENT TYPES (for dynamic columns)
    // ======================================================
    const [paymentTypes] = await db.query(`
      SELECT DISTINCT PaymentType
      FROM TrnSettlement
      WHERE isSettled = 1
        AND PaymentType IS NOT NULL
        AND PaymentType != ''
    `);

    // Build dynamic payment columns SQL (same as before)
    const paymentColumns = paymentTypes
      .map(p => `
        COALESCE(
          MAX(CASE WHEN s.PaymentType = '${p.PaymentType}' THEN s.Amount ELSE 0 END),
          0
        ) AS \`${p.PaymentType}\`
      `)
      .join(',');

    // ======================================================
    // BASE QUERY (unchanged structure, but keep it readable)
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
        (t.GrossAmt + COALESCE((SELECT SUM(ts.tipAmount) FROM TrnSettlement ts WHERE ts.OrderNo = t.TxnNo AND ts.isSettled = 1), 0)) AS SettleAmt,
        COALESCE((SELECT SUM(ts.tipAmount) FROM TrnSettlement ts WHERE ts.OrderNo = t.TxnNo AND ts.isSettled = 1), 0) AS tipAmount,
        t.GrossAmt AS billAmount,
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
        COALESCE(w.Water, 0) AS Water,
        ${paymentColumns},
        GROUP_CONCAT(DISTINCT CASE WHEN td.Qty > 0 THEN td.KOTNo END) AS KOTNo,
        COALESCE(GROUP_CONCAT(DISTINCT td.RevKOTNo), '') AS RevKOTNo,
        GROUP_CONCAT(DISTINCT CASE WHEN td.isNCKOT = 1 THEN td.KOTNo END) AS NCKOT,
        t.NCPurpose,
        t.NCName,
        (SELECT GROUP_CONCAT(CONCAT(ts.PaymentType, ':', ts.Amount)) FROM TrnSettlement ts WHERE ts.OrderNo = t.TxnNo AND ts.isSettled = 1) AS Settlements,
        GROUP_CONCAT(DISTINCT s.PaymentType) AS PaymentType,
        t.isSetteled,
        t.isBilled,
        t.isreversebill,
        t.isCancelled,
        COALESCE(SUM(td.Qty), 0) AS TotalItems
      FROM TAxnTrnbill t
      LEFT JOIN TAxnTrnbilldetails td ON t.TxnID = td.TxnID
      LEFT JOIN mst_users u ON t.UserId = u.userid
      LEFT JOIN msttablemanagement mt ON t.TableID = mt.tableid
      LEFT JOIN mst_outlets mo ON mt.outletid = mo.outletid
      LEFT JOIN msttable_department d ON mt.departmentid = d.departmentid
      LEFT JOIN (
        SELECT OrderNo, PaymentType, SUM(Amount) AS Amount, SUM(COALESCE(TipAmount,0)) AS TipAmount
        FROM TrnSettlement
        WHERE isSettled = 1
        GROUP BY OrderNo, PaymentType
      ) s ON CAST(s.OrderNo AS CHAR) = CAST(t.TxnNo AS CHAR) OR CAST(s.OrderNo AS CHAR) = CAST(t.orderNo AS CHAR)
      LEFT JOIN (
        SELECT d.TxnID,
          SUM(CASE WHEN LOWER(i.item_name) LIKE '%water%' THEN d.RuntimeRate * d.Qty ELSE 0 END) AS Water
        FROM TAxnTrnbilldetails d
        JOIN mstrestmenu i ON d.ItemID = i.restitemid
        GROUP BY d.TxnID
      ) w ON w.TxnID = t.TxnID
      WHERE t.isCancelled = 0 AND t.isBilled = 1
    `;

    // ======================================================
    // CASE‑WISE FILTERING (unchanged)
    // ======================================================
    let whereConditions = [];
    let havingConditions = [];

    switch (caseType) {
      case 'reverseKOTs':
        whereConditions.push('t.isreversebill = 1');
        break;
      case 'ncKOT':
        havingConditions.push(`NCKOT IS NOT NULL AND NCKOT != ""`);
        break;
      case 'creditSummary':
        whereConditions.push(`EXISTS (SELECT 1 FROM TrnSettlement s WHERE s.OrderNo = t.TxnNo AND s.PaymentType LIKE '%credit%' AND s.isSettled = 1)`);
        break;
      case 'discountSummary':
        whereConditions.push('t.Discount > 0');
        break;
      case 'billSummary':
      default:
        whereConditions.push('t.isBilled = 1');
        break;
    }

    if (whereConditions.length) baseQuery += ` AND ${whereConditions.join(' AND ')}`;
    baseQuery += ` AND DATE(t.TxnDatetime) BETWEEN ? AND ?`;
    baseQuery += ` GROUP BY t.TxnID`;
    if (havingConditions.length) baseQuery += ` HAVING ${havingConditions.join(' AND ')}`;
    baseQuery += ` ORDER BY t.TxnDatetime DESC`;

    const params = [startDate, endDate];
    const [rows] = await db.execute(baseQuery, params);
    console.log('TOTAL ROWS =>', rows.length);

    // ======================================================
    // FORMAT RESPONSE – ATTACH DYNAMIC PAYMENTS AS TOP‑LEVEL KEYS
    // ======================================================
    const orders = rows.map(row => {
      // Base order object (matching frontend expectations)
      const order = {
        // Identifiers
        orderNo: row.TxnNo,
        billNo: row.TxnNo,               // frontend expects billNo
        kotNo: row.KOTNo || '',
        revKotNo: row.RevKOTNo || '',
        revKot: row.isreversebill == 1,  // boolean for frontend

        // Dates
        billDate: row.TxnDatetime ? new Date(row.TxnDatetime).toISOString().split('T')[0] : '',
        date: row.TxnDatetime,

        // Customer & table info
        customerName: row.CustomerName || 'N/A',
        tableName: row.table_name || '',
        outletName: row.outlet_name || '',
        departmentName: row.department_name || '',
        captain: row.Captain || 'N/A',
        waiter: row.Captain || 'Unknown',
        user: row.UserName || 'N/A',
        pax: Number(row.PAX || 0),
        mobile: row.MobileNo || 'N/A',
        address: row.Address || 'N/A',
        landmark: row.Landmark || '',

        // Order type derivation
        orderType: row.isHomeDelivery ? 'Home Delivery' : (row.isPickup ? 'Pickup' : 'Dine-in'),

        // Amounts (all as numbers)
        settleAmount: Number(row.SettleAmt || 0),
        tipAmount: Number(row.tipAmount || 0),
        billAmount: Number(row.billAmount || 0),
        netAmount: Number(row.TotalAmount || 0),       // net = total after discount
        taxbleAmount: Number(row.CGST || 0) + Number(row.SGST || 0) + Number(row.IGST || 0),
        discount: Number(row.Discount || 0),
        cgst: Number(row.CGST || 0),
        sgst: Number(row.SGST || 0),
        igst: Number(row.IGST || 0),
        roundOff: Number(row.RoundOFF || 0),
        grossAmount: Number(row.GrossAmount || 0),
        revAmt: Number(row.RevAmt || 0),
        serviceCharge: Number(row.ServiceCharge_Amount || 0),
        serviceCharge_Amount: Number(row.ServiceCharge_Amount || 0),
        water: Number(row.Water || 0),

        // Discount metadata
        discountType: row.DiscountType,
        discPer: row.DiscPer,

        // Items
        itemsCount: Number(row.TotalItems || 0),

        // Payment
        paymentMode: row.PaymentType || 'Cash',

        // Flags
        isHomeDelivery: row.isHomeDelivery,
        isPickup: row.isPickup,
        isCancelled: row.isCancelled,
        reverseBill: row.isreversebill,
        isBilled: row.isBilled,
        isSettled: row.isSetteled,

        // KOT extra
        ncKot: row.NCKOT || '',
        ncPurpose: row.NCPurpose || '',
        ncName: row.NCName || '',

        // Employee IDs
        handOverEmpID: row.HandOverEmpID,
        dayEndEmpID: row.DayEndEmpID,
      };

      // === ATTACH DYNAMIC PAYMENT COLUMNS AS TOP‑LEVEL PROPERTIES ===
      // This is the key fix: frontend `renderBillSummarySection` will see keys like `Cash`, `Card`, `GPay`
      paymentTypes.forEach(pt => {
        const colName = pt.PaymentType;
        order[colName] = Number(row[colName] || 0);
      });

      // Also keep a `payments` object for any other part of the app that expects it
      order.payments = {};
      paymentTypes.forEach(pt => {
        order.payments[pt.PaymentType] = order[pt.PaymentType];
      });

      return order;
    });

    // Summary (unchanged)
    const summary = {
      totalOrders: orders.length,
      totalSales: orders.reduce((sum, o) => sum + (o.amount || 0), 0),
      totalSettlement: orders.reduce((sum, o) => sum + (o.settleAmount || 0), 0),
      totalDiscount: orders.reduce((sum, o) => sum + (o.discount || 0), 0),
      totalTip: orders.reduce((sum, o) => sum + (o.tipAmount || 0), 0),
    };

    return res.json({
      success: true,
      data: {
        orders,
        summary,
        caseType,
      },
    });
  } catch (error) {
    console.error('REPORT API ERROR =>', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch report data',
      error: error.message,
    });
  }
};

const getDuplicateBill = async (req, res) => {
  try {
    const { billNo, outletId } = req.query;
    console.log('=== DUPLICATE BILL DEBUG START ===');
    console.log('billNo:', billNo, 'outletId:', outletId);

    if (!billNo || !outletId) {
      return res.status(400).json({ success: false, message: 'billNo and outletId required' });
    }

    let whereClause = `t.outletid = ? AND t.isCancelled = 0 AND t.isBilled = 1 AND (t.TxnNo = ? OR t.orderNo = ?)`;
    const params = [outletId, billNo, billNo];
    if (req.query.billDate) {
      whereClause += ` AND DATE(t.TxnDatetime) = ?`;
      params.push(req.query.billDate);
    }

    // ✅ BILL HEADER QUERY
    const billQuery = `
      SELECT 
        t.TxnID, t.TxnNo, t.orderNo, t.TableID,
        t.CustomerName, t.MobileNo AS mobileNumber,
        t.Discount, t.DiscPer,
        t.RoundOFF AS roundOffValue,
        t.isSetteled,
        t.CGST, t.SGST, t.IGST,
        t.GrossAmt, t.Amount,
        t.TxnDatetime, t.BilledDate,
        t.Steward AS selectedWaiter,
        t.TaxableValue,
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
      ORDER BY t.TxnID DESC LIMIT 1
    `;

    console.log('Executing bill query');
    const [billRows] = await db.execute(billQuery, params);
    const bill = billRows?.[0];

    if (!bill) {
      console.log('❌ Bill not found');
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    console.log('✅ Bill found:', {
      TxnID: bill.TxnID,
      TxnNo: bill.TxnNo,
      Amount: bill.Amount,
      TaxableValue: bill.TaxableValue,
      CGST: bill.CGST,
      SGST: bill.SGST,
      GrossAmt: bill.GrossAmt,
      Discount: bill.Discount
    });

    // ✅ Convert to numbers
    const taxableValueFromDB = parseFloat(bill.TaxableValue);
    const cgstAmt = parseFloat(bill.CGST);
    const sgstAmt = parseFloat(bill.SGST);
    const igstAmt = parseFloat(bill.IGST);
    const grandTotal = parseFloat(bill.Amount);
    const discount = parseFloat(bill.Discount);
    const grossAmt = parseFloat(bill.GrossAmt);
    const subtotal = grossAmt - discount;

    console.log('Parsed numbers:', {
      taxableValueFromDB,
      cgstAmt,
      sgstAmt,
      igstAmt,
      grandTotal,
      discount,
      grossAmt,
      subtotal
    });

    // ✅ Use stored taxable value directly
    const taxableValue = taxableValueFromDB > 0 ? taxableValueFromDB : subtotal;

    console.log('Final taxableValue used:', taxableValue);

    // ✅ Compute tax rates
    let cgstRate = 0, sgstRate = 0, igstRate = 0;
    if (taxableValue > 0) {
      cgstRate = (cgstAmt / taxableValue) * 100;
      sgstRate = (sgstAmt / taxableValue) * 100;
      igstRate = (igstAmt / taxableValue) * 100;
      console.log(`Computed rates: CGST=${cgstRate}%, SGST=${sgstRate}%, IGST=${igstRate}%`);
    }

    // ✅ ITEMS QUERY (FULL)
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

    h.hotel_name,
    h.address,
    h.trn_gstno,
    h.fssai_no,
    h.phone,

    o.outlet_name

FROM TAxnTrnbilldetails d

LEFT JOIN mstrestmenu m
    ON d.ItemID = m.restitemid

LEFT JOIN TAxnTrnbill t
    ON d.TxnID = t.TxnID

LEFT JOIN msthotelmasters h
    ON t.hotelid = h.hotelid

LEFT JOIN mst_outlets o
    ON t.outletid = o.outletid

WHERE d.TxnID = ?
AND d.Qty > 0

ORDER BY d.TXnDetailID;
    `;

    console.log('Executing items query for TxnID:', bill.TxnID);
    const [items] = await db.execute(itemsQuery, [bill.TxnID]);
    console.log(`Fetched ${items.length} items`);

    // ✅ PAYMENT QUERY (FULL)
    const paymentQuery = `
      SELECT PaymentType
      FROM TrnSettlement
      WHERE (OrderNo = ? OR TxnNo = ?) AND isSettled = 1
    `;

    console.log('Executing payment query for TxnNo:', bill.TxnNo);
    const [payments] = await db.execute(paymentQuery, [bill.TxnNo, bill.TxnNo]);
    console.log('Payment modes:', payments.map(p => p.PaymentType));

    const roundOffValue = parseFloat(bill.roundOffValue) || 0;
    const roundOffEnabled = Math.abs(roundOffValue) > 0.01;

    // ✅ RESPONSE
    const responseData = {
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
        roundOffEnabled,
        roundOffValue: Number(roundOffValue.toFixed(2)),
        selectedPaymentModes: payments.map(p => p.PaymentType),
        restaurantName: bill.restaurantName || bill.outlet_name,
        outletName: bill.outlet_name,
        billDate: bill.TxnDatetime
      }
    };

    console.log('📤 Sending response taxCalc:', responseData.data.taxCalc);
    console.log('📤 Sending response taxRates:', responseData.data.taxRates);
    console.log('=== DUPLICATE BILL DEBUG END ===');

    res.json(responseData);
  } catch (error) {
    console.error('🔥 ERROR in getDuplicateBill:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bill data', error: error.message });
  }
};
module.exports = { getReportData, getDuplicateBill };