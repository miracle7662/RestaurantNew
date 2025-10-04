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
        t.CGST,
        t.SGST,
        t.IGST,
        t.CESS,
        t.TxnDatetime,
        t.Steward as WaiterID,
      NULL as KOTNo,
        t.NCName,
        t.NCPurpose,
        t.isSetteled,
        td.ItemID,
        td.Qty,
        td.RuntimeRate,
        td.isNCKOT,
        s.PaymentType,
        s.Amount as PaymentAmount
      FROM TAxnTrnbill t
      LEFT JOIN TAxnTrnbilldetails td ON t.TxnID = td.TxnID
      LEFT JOIN TrnSettlement s ON t.TxnNo = s.OrderNo
      WHERE (t.isSetteled = 1 OR t.isBilled = 1)
      AND date(t.TxnDatetime) = date('now')
      ORDER BY t.TxnDatetime DESC
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
          amount: parseFloat(row.TotalAmount),
          type: row.PaymentType || (row.isSetteled ? 'Cash' : 'Pending'),
          status: row.isSetteled ? 'Settled' : 'Pending',
          time: new Date(row.TxnDatetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          items: 0,
          kotNo: row.KOTNo,
          discount: parseFloat(row.Discount || 0),
          ncKot: row.NCName || 'N/A',
          cgst: parseFloat(row.CGST || 0),
          sgst: parseFloat(row.SGST || 0),
        };
      }
      if (row.ItemID) {
        transactions[row.TxnID].items += parseInt(row.Qty);
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
