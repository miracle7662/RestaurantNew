const db = require('../config/db');

const getHandoverData = (req, res) => {
  try {
    // Get all billed or settled bills with their details
    const query = `
      SELECT
          t.TxnID,
          t.TxnNo,
          t.TableID,
          t.Amount as TotalAmount,
          t.Discount,
          t.GrossAmt as GrossAmount,
          t.CGST,
          t.SGST,
          t.RoundOFF,
          t.RevKOT as RevAmt,
          t.TxnDatetime,
          t.Steward as Captain,
          t.UserId,
          u.username as UserName,
          (SELECT SUM(CASE WHEN i.item_name LIKE '%water%' THEN d.RuntimeRate * d.Qty ELSE 0 END) FROM TAxnTrnbilldetails d JOIN mstrestmenu i ON d.ItemID = i.restitemid WHERE d.TxnID = t.TxnID) as Water,
          GROUP_CONCAT(DISTINCT CASE WHEN td.Qty > 0 THEN td.KOTNo END) as KOTNo,
          COALESCE(GROUP_CONCAT(DISTINCT td.RevKOTNo), '') as RevKOTNo,
          GROUP_CONCAT(DISTINCT CASE WHEN td.isNCKOT = 1 THEN td.KOTNo END) as NCKOT,
          t.NCName,
          t.isSetteled,
          t.isBilled,
          t.isCancelled,
          SUM(td.Qty) as TotalItems,
          s.PaymentType
      FROM TAxnTrnbill t
      LEFT JOIN TAxnTrnbilldetails td ON t.TxnID = td.TxnID
      LEFT JOIN TrnSettlement s ON t.TxnNo = s.OrderNo
      LEFT JOIN mst_users u ON t.UserId = u.userid
      WHERE t.isCancelled = 0
      AND date(t.TxnDatetime) = date('now')
      GROUP BY t.TxnID, t.TxnNo
      ORDER BY t.TxnDatetime DESC;
    `;

    const rows = db.prepare(query).all();

    // Group by transaction
    const transactions = {};
    rows.forEach(row => {
      if (!transactions[row.TxnID]) {
        transactions[row.TxnID] = {
          orderNo: row.TxnNo,
          table: row.TableID,
          waiter: row.Steward || 'Unknown',
          amount: parseFloat(row.TotalAmount || 0),
          type: row.PaymentType || (row.isSetteled ? 'Cash' : 'Unpaid'),
          status: row.isSetteled ? 'Settled' : (row.isBilled ? 'Billed' : 'Pending'),
          time: row.TxnDatetime,
          items: parseInt(row.TotalItems || 0),
          kotNo: row.KOTNo || '',
          revKotNo: row.RevKOTNo || '',
          discount: parseFloat(row.Discount || 0),
          ncKot: row.NCKOT || '',
          ncName: row.NCName || '',
          cgst: parseFloat(row.CGST || 0),
          sgst: parseFloat(row.SGST || 0),
          grossAmount: parseFloat(row.GrossAmount || 0),
          roundOff: parseFloat(row.RoundOFF || 0),
          revAmt: parseFloat(row.RevAmt || 0),
          reverseBill: '', // Placeholder, logic to be determined
          water: parseFloat(row.Water || 0),
          captain: row.Captain || 'N/A',
          user: row.UserName || 'N/A',
          date: row.TxnDatetime,
        };
      }
    });

    const orders = Object.values(transactions);

    // Calculate summaries
    const totalOrders = orders.length;
    const totalKOTs = orders.length;
    const totalSales = orders.reduce((sum, order) => sum + order.amount, 0);
    const cash = orders.filter(order => order.type === "Cash").reduce((sum, order) => sum + order.amount, 0);
    const card = orders.filter(order => order.type === "Card").reduce((sum, order) => sum + order.amount, 0);
    const upi = orders.filter(order => order.type === "UPI").reduce((sum, order) => sum + order.amount, 0);
    const pending = orders.filter(order => order.status === "Pending").length;
    const completed = orders.filter(order => order.status === "Settled").length;
    const cancelled = 0;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
    const totalDiscount = orders.reduce((sum, order) => sum + order.discount, 0);
    const totalCGST = orders.reduce((sum, order) => sum + order.cgst, 0);
    const totalSGST = orders.reduce((sum, order) => sum + order.sgst, 0);

    const summary = {
      totalOrders,
      totalKOTs,
      totalSales,
      cash,
      card,
      upi,
      pending,
      completed,
      cancelled,
      averageOrderValue,
    };

    const paymentMethods = [
      { type: "Cash", amount: summary.cash, percentage: totalSales > 0 ? ((summary.cash / totalSales) * 100).toFixed(1) : "0" },
      { type: "Card", amount: summary.card, percentage: totalSales > 0 ? ((summary.card / totalSales) * 100).toFixed(1) : "0" },
      { type: "UPI", amount: summary.upi, percentage: totalSales > 0 ? ((summary.upi / totalSales) * 100).toFixed(1) : "0" },
    ];

    res.json({
      success: true,
      data: {
        orders,
        summary,
        paymentMethods,
        totalDiscount,
        totalCGST,
        totalSGST,
      }
    });
  } catch (error) {
    console.error('Error fetching handover data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch handover data' });
  }
};

module.exports = {
  getHandoverData
};
