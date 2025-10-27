// reportController.js
const db = require('../config/db');

const getReportData = (req, res) => {
  try {
    const query = `
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
            SELECT GROUP_CONCAT(s.PaymentType || ':' || s.Amount)
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
      WHERE (t.isCancelled = 0 AND (t.isBilled = 1 OR t.isSetteled = 1)) OR t.isreversebill = 1
      GROUP BY t.TxnID, t.TxnNo
      ORDER BY t.TxnDatetime DESC;
    `;

    const rows = db.prepare(query).all();
    const transactions = {};

    rows.forEach(row => {
      if (!row.Settlements && !row.isSetteled && !row.isreversebill) return;

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

    const totalSales = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const summary = {
      totalOrders: orders.length,
      totalKOTs: orders.length,
      totalSales,
      cash: orders.reduce((sum, o) => sum + (o.cash || 0), 0),
      card: orders.reduce((sum, o) => sum + (o.card || 0), 0),
      gpay: orders.reduce((sum, o) => sum + (o.gpay || 0), 0),
      phonepe: orders.reduce((sum, o) => sum + (o.phonepe || 0), 0),
      qrcode: orders.reduce((sum, o) => sum + (o.qrcode || 0), 0),
      pending: orders.filter(o => o.status === 'Pending').length,
      completed: orders.filter(o => o.status === 'Settled').length,
      cancelled: 0,
      averageOrderValue: orders.length ? Math.round(totalSales / orders.length) : 0,
    };

    const totalDiscount = orders.reduce((sum, o) => sum + o.discount, 0);
    const totalCGST = orders.reduce((sum, o) => sum + o.cgst, 0);
    const totalSGST = orders.reduce((sum, o) => sum + o.sgst, 0);

    const paymentMethods = [
      { type: "Cash", amount: summary.cash, percentage: totalSales ? ((summary.cash / totalSales) * 100).toFixed(1) : "0" },
      { type: "Card", amount: summary.card, percentage: totalSales ? ((summary.card / totalSales) * 100).toFixed(1) : "0" },
      { type: "GPay", amount: summary.gpay, percentage: totalSales ? ((summary.gpay / totalSales) * 100).toFixed(1) : "0" },
      { type: "PhonePe", amount: summary.phonepe, percentage: totalSales ? ((summary.phonepe / totalSales) * 100).toFixed(1) : "0" },
      { type: "QR Code", amount: summary.qrcode, percentage: totalSales ? ((summary.qrcode / totalSales) * 100).toFixed(1) : "0" },
    ];

    res.json({
      success: true,
      data: { orders, summary, paymentMethods, totalDiscount, totalCGST, totalSGST },
    });
  } catch (error) {
    console.error('Error fetching handover data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch handover data' });
  }
};

module.exports = { getReportData };
