// reportController.js
const db = require('../config/db');

const getReportData = (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const startDate = req.query.start || today;
    const endDate = req.query.end || today;
    const caseType = req.query.caseType || 'billSummary';

    let baseQuery = `
      SELECT
          t.TxnID,
          t.TxnNo,
          mt.tableid as TableID,
          mt.table_name,
          mo.outletid,
          mo.outlet_name,
          d.department_name,
          t.CustomerName,
          t.isHomeDelivery,
          t.isPickup,
          t.Amount as TotalAmount,
          t.Discount,
          t.GrossAmt as GrossAmount,
          t.CGST,
          t.SGST,
          t.RoundOFF,
          t.RevKOT as RevAmt,
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
          t.Steward as Captain,
          t.UserId,
          u.username as UserName,
          (SELECT SUM(CASE WHEN i.item_name LIKE '%water%' THEN d.RuntimeRate * d.Qty ELSE 0 END)
            FROM TAxnTrnbilldetails d
            JOIN mstrestmenu i ON d.ItemID = i.restitemid
            WHERE d.TxnID = t.TxnID) as Water,
          GROUP_CONCAT(DISTINCT CASE WHEN td.Qty > 0 THEN td.KOTNo END) as KOTNo,
          COALESCE(GROUP_CONCAT(DISTINCT td.RevKOTNo), '') as RevKOTNo,
          GROUP_CONCAT(DISTINCT CASE WHEN td.isNCKOT = 1 THEN td.KOTNo END) as NCKOT,
          t.NCPurpose,
          t.NCName,
          (
            SELECT GROUP_CONCAT(DISTINCT s.PaymentType || ':' || s.Amount)
            FROM TrnSettlement s
            WHERE s.OrderNo = t.TxnNo AND s.isSettled = 1
          ) as Settlements,
          t.isSetteled,
          t.isBilled,
          t.isreversebill,
          t.isCancelled,
          SUM(td.Qty) as TotalItems
      FROM TAxnTrnbill t
      LEFT JOIN TAxnTrnbilldetails td ON t.TxnID = td.TxnID
      LEFT JOIN mst_users u ON t.UserId = u.userid
      LEFT JOIN msttablemanagement mt ON t.TableID = mt.tableid
      LEFT JOIN mst_outlets mo ON mt.outletid = mo.outletid
      LEFT JOIN msttable_department d ON mt.departmentid = d.departmentid
      WHERE t.isCancelled = 0`;

    let whereConditions = [];
    let groupByClause = ' GROUP BY t.TxnID, t.TxnNo';
    let orderByClause = ' ORDER BY t.TxnDatetime DESC';
    let params = [startDate, endDate];

    // Casewise filtering
    switch(caseType) {
      case 'reverseKOTs':
        whereConditions.push('t.isreversebill = 1');
        break;
      case 'ncKOT':
        whereConditions.push('NCKOT IS NOT NULL AND NCKOT != ""');
        break;
      case 'creditSummary':
        whereConditions.push("(SELECT COUNT(*) FROM TrnSettlement s WHERE s.OrderNo = t.TxnNo AND s.PaymentType LIKE '%credit%' AND s.isSettled = 1) > 0");
        break;
      case 'discountSummary':
        whereConditions.push('t.Discount > 0');
        break;
      case 'kitchenWise':
        groupByClause = ' GROUP BY t.Steward';
        orderByClause = ' ORDER BY SUM(t.Amount) DESC';
        break;
      // Add more cases...
      default:
        // billSummary - only billed bills
        whereConditions.push('t.isBilled = 1');
    }

    if (whereConditions.length > 0) {
      baseQuery += ' AND ' + whereConditions.join(' AND ');
    }
    baseQuery += ' AND DATE(t.TxnDatetime) BETWEEN ? AND ?' + groupByClause + orderByClause;

    const rows = db.prepare(baseQuery).all(...params);
    const transactions = {};

    rows.forEach(row => {
      // Include all rows - remove the restrictive filter
      // if (!row.Settlements && !row.isSetteled && !row.isreversebill) return;

      const settlements = (row.Settlements || '').split(',');
      const paymentBreakdown = { cash: 0, card: 0, gpay: 0, phonepe: 0, qrcode: 0, credit: 0 };
      let paymentModes = [];

      settlements.forEach(s => {
        const [type, amountStr] = s.split(':');
        const amount = parseFloat(amountStr) || 0;
        if (type) paymentModes.push(type);
        const tLower = type.toLowerCase();
        if (tLower.includes('cash')) paymentBreakdown.cash += amount;
        else if (tLower.includes('card')) paymentBreakdown.card += amount;
        else if (tLower.includes('gpay') || tLower.includes('google')) paymentBreakdown.gpay += amount;
        else if (tLower.includes('phonepe')) paymentBreakdown.phonepe += amount;
        else if (tLower.includes('qr')) paymentBreakdown.qrcode += amount;
        else if (tLower.includes('credit') && !tLower.includes('card')) paymentBreakdown.credit += amount;
      });

      if (!transactions[row.TxnID]) {
        transactions[row.TxnID] = {
          orderNo: row.TxnNo,
          table: row.TableID,
          waiter: row.Steward || 'Unknown',
          amount: parseFloat(row.TotalAmount || 0),
          type: row.isreversebill 
            ? 'Reversed' 
            : (paymentModes.length > 1 ? 'Split' : (paymentModes[0] || (row.isSetteled ? 'Cash' : 'Unpaid'))),
          status: row.isSetteled ? 'Settled' : (row.isBilled ? 'Billed' : 'Pending'),
          time: row.TxnDatetime,
          items: parseInt(row.TotalItems || 0),
          kotNo: row.KOTNo || '',
          revKotNo: row.RevKOTNo || '',
          discount: parseFloat(row.Discount || 0),
          ncKot: row.NCKOT || '',
          ncPurpose: row.NCPurpose || '',
          customerName: row.CustomerName,
          ncName: row.NCName || '',
          isHomeDelivery: row.isHomeDelivery,
          isPickup: row.isPickup,
          isCancelled: row.isCancelled,
          billedDate: row.BilledDate,
          handOverEmpID: row.HandOverEmpID,
          dayEndEmpID: row.DayEndEmpID,
          mobile: row.MobileNo,
          address: row.Address,
          landmark: row.Landmark,
          pax: row.PAX,
          igst: parseFloat(row.IGST || 0),
          serviceCharge_Amount: parseFloat(row.ServiceCharge_Amount || 0),
          discountType: row.DiscountType,
          discPer: row.DiscPer,
          cgst: parseFloat(row.CGST || 0),
          sgst: parseFloat(row.SGST || 0),
          outlet_name: row.outlet_name,
          outletid: row.outletid, // Add outletid to the response object
          table_name: row.table_name,
          department_name: row.department_name,
          grossAmount: parseFloat(row.GrossAmount || 0),
          roundOff: parseFloat(row.RoundOFF || 0),
          revAmt: parseFloat(row.RevAmt || 0),
          reverseBill: row.isreversebill,
          water: parseFloat(row.Water || 0),
          captain: row.Captain || 'N/A',
          user: row.UserName || 'N/A',
          date: row.TxnDatetime,
          paymentMode: paymentModes.join(', '),
          cash: paymentBreakdown.cash,
          card: paymentBreakdown.card,
          gpay: paymentBreakdown.gpay,
          phonepe: paymentBreakdown.phonepe,
          qrcode: paymentBreakdown.qrcode,
          credit: paymentBreakdown.credit,
        };
      }
    });

    const orders = Object.values(transactions);

    // Case-specific summary
    const caseSummary = {
      caseType,
      totalOrders: orders.length,
      totalSales: orders.reduce((sum, o) => sum + (o.amount || 0), 0),
      totalDiscount: orders.reduce((sum, o) => sum + (o.discount || 0), 0),
      averageOrderValue: orders.length ? orders.reduce((sum, o) => sum + (o.amount || 0), 0) / orders.length : 0,
    };

    const summary = {
      totalOrders: orders.length,
      totalKOTs: orders.length,
      caseSummary
    };

    res.json({
      success: true,
      data: { orders, summary, caseSummary, caseType },
    });
  } catch (error) {
    console.error('Error fetching handover data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch handover data' });
  }
};

const getDuplicateBill = (req, res) => {
  try {
    const { billNo, billDate, outletId } = req.query;

    if (!billNo || !outletId) {
      return res.status(400).json({ success: false, message: 'billNo and outletId required' });
    }

    console.log('🔍 Searching duplicate bill - billNo:', billNo, 'outletId:', outletId, 'billDate:', billDate || 'any');

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

    const bill = db.prepare(billQuery).get(...params);

    console.log('🔍 DEBUG DuplicateBill - Raw bill data:', {
      TxnID: bill.TxnID,
      TxnNo: bill.TxnNo,
      orderNo: bill.orderNo,
      Amount: bill.Amount, 
      GrossAmt: bill.GrossAmt,
      Discount: bill.Discount,
      CGST: bill.CGST
    });

    if (!bill) {
      console.log('❌ No bill found with billNo/outletId:', billNo, outletId);
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
        NULL AS hsn  -- hsn_code not present in your table
      FROM TAxnTrnbilldetails d
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      LEFT JOIN TAxnTrnbill t ON d.TxnID = t.TxnID
      WHERE d.TxnID = ? AND d.Qty > 0
      ORDER BY d.TXnDetailID
    `;

    const items = db.prepare(itemsQuery).all(bill.TxnID);

    // Tax calculations
    const subtotal = parseFloat(bill.GrossAmt || 0) - parseFloat(bill.Discount || 0);
    const taxableValue = subtotal;  // Add taxableValue for frontend
    const cgstAmt = parseFloat(bill.CGST || 0);
    const sgstAmt = parseFloat(bill.SGST || 0);
    const igstAmt = parseFloat(bill.IGST || 0);
    const grandTotal = parseFloat(bill.Amount || 0);  // FIXED: use Amount field
   const roundOffValue = parseFloat(bill.roundOffValue || 0);
    const roundOffEnabled = Math.abs(roundOffValue) > 0.01;

    const cgstRate = cgstAmt > 0 ? (cgstAmt / subtotal) * 100 : 0;
    const sgstRate = sgstAmt > 0 ? (sgstAmt / subtotal) * 100 : 0;
    const igstRate = igstAmt > 0 ? (igstAmt / subtotal) * 100 : 0;

    // Payment modes - use TxnNo or orderNo
    const orderNoForPayments = bill.TxnNo || bill.orderNo;
    const paymentsQuery = `
      SELECT PaymentType
      FROM TrnSettlement
      WHERE (OrderNo = ? OR TxnNo = ?) AND isSettled = 1
    `;
    const payments = db.prepare(paymentsQuery).all(orderNoForPayments, orderNoForPayments);

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
          taxableValue: parseFloat(taxableValue.toFixed(2)),  // NEW: explicit taxable value
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
    console.error('Error fetching duplicate bill:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bill data' });
  }
};

module.exports = { getReportData, getDuplicateBill };

