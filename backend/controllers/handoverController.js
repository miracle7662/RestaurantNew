const db = require('../config/db');

// Convert to India Standard Time (UTC+5:30)
function toIST(date) {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60000;
  return new Date(utc + istOffset);
}

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
          t.CustomerName,
          t.MobileNo,
          t.UserId,
          u.username as UserName,
          (SELECT SUM(CASE WHEN i.item_name LIKE '%water%' THEN d.RuntimeRate * d.Qty ELSE 0 END) FROM TAxnTrnbilldetails d JOIN mstrestmenu i ON d.ItemID = i.restitemid WHERE d.TxnID = t.TxnID) as Water,
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
      WHERE (t.isCancelled = 0 AND (t.isBilled = 1 OR t.isSetteled = 1)) OR t.isreversebill = 1
     
      GROUP BY t.TxnID, t.TxnNo
      ORDER BY t.TxnDatetime DESC;
    `;

    const rows = db.prepare(query).all();

    // Group by transaction
    const transactions = {};
    for (const row of rows) {
      // If there are no settlements and the bill is not settled, skip it
      if (!row.Settlements && !row.isSetteled) {
        continue;
      }

      const settlements = (row.Settlements || '').split(',');
      const paymentBreakdown = {
        cash: 0,
        card: 0,
        gpay: 0,
        phonepe: 0,
        qrcode: 0,
        credit: 0,
      };
      let paymentModes = [];

      settlements.forEach(s => {
        const [type, amountStr] = s.split(':');
        const amount = parseFloat(amountStr) || 0;
        if (type) paymentModes.push(type);
        if (type.toLowerCase().includes('cash')) paymentBreakdown.cash += amount;
        if (type.toLowerCase().includes('card')) paymentBreakdown.card += amount;
        if (type.toLowerCase().includes('gpay') || type.toLowerCase().includes('google')) paymentBreakdown.gpay += amount;
        if (type.toLowerCase().includes('phonepe')) paymentBreakdown.phonepe += amount;
        if (type.toLowerCase().includes('qr')) paymentBreakdown.qrcode += amount;
        if (type.toLowerCase().includes('credit') && !type.toLowerCase().includes('card')) paymentBreakdown.credit += amount;
      });

      if (!transactions[row.TxnID]) {
        transactions[row.TxnID] = {
          orderNo: row.TxnNo,
          table: row.TableID,
          waiter: row.Steward || 'Unknown',
          amount: parseFloat(row.TotalAmount || 0), // This is Net Amount.
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
          ncName: row.NCName || '',
          cgst: parseFloat(row.CGST || 0),
          sgst: parseFloat(row.SGST || 0),
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
    }

    const orders = Object.values(transactions);

    // Calculate summaries
    const totalOrders = orders.length;
    const totalKOTs = orders.length;
    const totalSales = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
    const cash = orders.reduce((sum, order) => sum + (order.cash || 0), 0);
    const card = orders.reduce((sum, order) => sum + (order.card || 0), 0);
    const gpay = orders.reduce((sum, order) => sum + (order.gpay || 0), 0);
    const phonepe = orders.reduce((sum, order) => sum + (order.phonepe || 0), 0);
    const qrcode = orders.reduce((sum, order) => sum + (order.qrcode || 0), 0);
    const upi = gpay + phonepe + qrcode; // Total UPI for backward compatibility if needed elsewhere

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
      gpay,
      phonepe,
      qrcode,
      pending,
      completed,
      cancelled,
      averageOrderValue,
    };

    const paymentMethods = [
      { type: "Cash", amount: summary.cash, percentage: totalSales > 0 ? ((summary.cash / totalSales) * 100).toFixed(1) : "0" },
      { type: "Card", amount: summary.card, percentage: totalSales > 0 ? ((summary.card / totalSales) * 100).toFixed(1) : "0" },
      { type: "GPay", amount: summary.gpay, percentage: totalSales > 0 ? ((summary.gpay / totalSales) * 100).toFixed(1) : "0" },
      { type: "PhonePe", amount: summary.phonepe, percentage: totalSales > 0 ? ((summary.phonepe / totalSales) * 100).toFixed(1) : "0" },
      { type: "QR Code", amount: summary.qrcode, percentage: totalSales > 0 ? ((summary.qrcode / totalSales) * 100).toFixed(1) : "0" },
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

const saveCashDenomination = (req, res) => {
  const { denominations, total, userId, reason } = req.body;

  if (!denominations || !userId) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO trn_cashdenomination (
        note_2000, note_500, note_200, note_100, note_50, note_20, note_10, note_5, note_2, note_1,
        total_2000, total_500, total_200, total_100, total_50, total_20, total_10, total_5, total_2, total_1,
        grand_total, user_id, handover_reason
      ) VALUES (
        @note_2000, @note_500, @note_200, @note_100, @note_50, @note_20, @note_10, @note_5, @note_2, @note_1,
        @total_2000, @total_500, @total_200, @total_100, @total_50, @total_20, @total_10, @total_5, @total_2, @total_1,
        @grand_total, @user_id, @reason
      )
    `);

    const info = stmt.run({
      note_2000: denominations['2000'] || 0, note_500: denominations['500'] || 0,
      note_200: denominations['200'] || 0, note_100: denominations['100'] || 0,
      note_50: denominations['50'] || 0, note_20: denominations['20'] || 0,
      note_10: denominations['10'] || 0, note_5: denominations['5'] || 0,
      note_2: denominations['2'] || 0, note_1: denominations['1'] || 0,
      total_2000: (denominations['2000'] || 0) * 2000, total_500: (denominations['500'] || 0) * 500,
      total_200: (denominations['200'] || 0) * 200, total_100: (denominations['100'] || 0) * 100,
      total_50: (denominations['50'] || 0) * 50, total_20: (denominations['20'] || 0) * 20,
      total_10: (denominations['10'] || 0) * 10, total_5: (denominations['5'] || 0) * 5,
      total_2: (denominations['2'] || 0) * 2, total_1: (denominations['1'] || 0) * 1,
      grand_total: total,
      user_id: userId,
      reason: reason || null
    });

    res.json({ success: true, message: 'Cash denomination saved successfully.', id: info.lastInsertRowid });
  } catch (error) {
    console.error('Error saving cash denomination:', error);
    res.status(500).json({ success: false, message: 'Failed to save cash denomination data.' });
  }
};

const saveDayEndCashDenomination = (req, res) => {
  const { denominations, total, userId, reason } = req.body;

  if (!denominations || !userId) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO trn_dayend_cashdenomination (
        note_2000, note_500, note_200, note_100, note_50, note_20, note_10, note_5, note_2, note_1,
        total_2000, total_500, total_200, total_100, total_50, total_20, total_10, total_5, total_2, total_1,
        grand_total, user_id
      ) VALUES (
        @note_2000, @note_500, @note_200, @note_100, @note_50, @note_20, @note_10, @note_5, @note_2, @note_1,
        @total_2000, @total_500, @total_200, @total_100, @total_50, @total_20, @total_10, @total_5, @total_2, @total_1,
        @grand_total, @user_id
      )
    `);

    const info = stmt.run({
      note_2000: denominations['2000'] || 0, note_500: denominations['500'] || 0,
      note_200: denominations['200'] || 0, note_100: denominations['100'] || 0,
      note_50: denominations['50'] || 0, note_20: denominations['20'] || 0,
      note_10: denominations['10'] || 0, note_5: denominations['5'] || 0,
      note_2: denominations['2'] || 0, note_1: denominations['1'] || 0,
      total_2000: (denominations['2000'] || 0) * 2000, total_500: (denominations['500'] || 0) * 500,
      total_200: (denominations['200'] || 0) * 200, total_100: (denominations['100'] || 0) * 100,
      total_50: (denominations['50'] || 0) * 50, total_20: (denominations['20'] || 0) * 20,
      total_10: (denominations['10'] || 0) * 10, total_5: (denominations['5'] || 0) * 5,
      total_2: (denominations['2'] || 0) * 2, total_1: (denominations['1'] || 0) * 1,
      grand_total: total,
      user_id: userId,
    });

    res.json({ success: true, message: 'Day-End cash denomination saved successfully.', id: info.lastInsertRowid });
  } catch (error) {
    console.error('Error saving day-end cash denomination:', error);
    res.status(500).json({ success: false, message: 'Failed to save day-end cash denomination data.' });
  }
};

const saveDayEnd = async (req, res) => {
  try {
    const { total_amount, outlet_id, hotel_id, user_id, system_datetime } = req.body;

    if (!total_amount || !outlet_id || !hotel_id || !user_id || !system_datetime) {
      return res.status(400).json({ success: false, message: 'Missing required fields: total_amount, outlet_id, hotel_id, user_id, system_datetime' });
    }

    // Parse system_datetime from request
    const sysDateTime = new Date(system_datetime);
    if (isNaN(sysDateTime.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid system_datetime format' });
    }

    

    // Calculate business date based on system_datetime in IST
    const istDateTime = toIST(sysDateTime);
    const currentHour = istDateTime.getHours();
    let dayend_date = new Date(istDateTime);
    if (currentHour < 6) {
      dayend_date.setDate(dayend_date.getDate() - 1);
    }

    // Format date as YYYY-MM-DD for dayend_date
    const pad = (n) => n.toString().padStart(2, '0');
    const dayend_dateStr = `${dayend_date.getFullYear()}-${pad(dayend_date.getMonth() + 1)}-${pad(dayend_date.getDate())}`;

    // Calculate lock_datetime as business_date + 23:59:00 in IST
    const lockDateTime = new Date(dayend_dateStr + 'T23:59:00');
    const lockDateTimeIST = toIST(lockDateTime);

    // Format lock_datetime as YYYY-MM-DDTHH:mm:ss (no Z)
    const lockDateTimeStr = `${lockDateTimeIST.getFullYear()}-${pad(lockDateTimeIST.getMonth() + 1)}-${pad(lockDateTimeIST.getDate())}T${pad(lockDateTimeIST.getHours())}:${pad(lockDateTimeIST.getMinutes())}:${pad(lockDateTimeIST.getSeconds())}`;

    // Format system_datetime as YYYY-MM-DDTHH:mm:ss (no Z)
    const systemDateTimeStr = `${istDateTime.getFullYear()}-${pad(istDateTime.getMonth() + 1)}-${pad(istDateTime.getDate())}T${pad(istDateTime.getHours())}:${pad(istDateTime.getMinutes())}:${pad(istDateTime.getSeconds())}`;

    // Insert into trn_dayend with system_datetime and lock_datetime in IST format
    const stmt = db.prepare(`
      INSERT INTO trn_dayend (dayend_date, lock_datetime, dayend_total_amt, outlet_id, hotel_id, created_by_id, system_datetime)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
     dayend_dateStr, // dayend_date as YYYY-MM-DD IST
      lockDateTimeStr, // lock_datetime as YYYY-MM-DDTHH:mm:ss IST
      total_amount,
      outlet_id,
      hotel_id,
      user_id,
      systemDateTimeStr // system_datetime as YYYY-MM-DDTHH:mm:ss IST
    );

    res.json({ success: true, message: 'Day end saved successfully', data: { lock_datetime: lockDateTimeStr, id: info.lastInsertRowid } });
  } catch (error) {
    console.error('Error saving day end:', error);
    res.status(500).json({ success: false, message: 'Failed to save day end', error: error.message });
  }
};

const getDailySalesData = (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    // If no date is passed, use today as default
    const startDate = fromDate ? `${fromDate} 00:00:00` : new Date().toISOString().split('T')[0] + ' 00:00:00';
    const endDate = toDate ? `${toDate} 23:59:59` : new Date().toISOString().split('T')[0] + ' 23:59:59';

    const query = `
      SELECT
          t.TxnID,
          t.TxnNo,
          t.TableID,
          t.Amount AS TotalAmount,
          t.Discount,
          t.GrossAmt AS GrossAmount,
          t.CGST,
          t.SGST,
          t.RoundOFF,
          t.RevKOT AS RevAmt,
          t.TxnDatetime,
          t.Steward AS Captain,
          t.CustomerName,
          t.MobileNo,
          t.UserId,
          u.username AS UserName,
          (SELECT SUM(CASE WHEN i.item_name LIKE '%water%' THEN d.RuntimeRate * d.Qty ELSE 0 END)
           FROM TAxnTrnbilldetails d
           JOIN mstrestmenu i ON d.ItemID = i.restitemid
           WHERE d.TxnID = t.TxnID) AS Water,
          GROUP_CONCAT(DISTINCT CASE WHEN td.Qty > 0 THEN td.KOTNo END) AS KOTNo,
          COALESCE(GROUP_CONCAT(DISTINCT td.RevKOTNo), '') AS RevKOTNo,
          GROUP_CONCAT(DISTINCT CASE WHEN td.isNCKOT = 1 THEN td.KOTNo END) AS NCKOT,
          t.NCPurpose,
          t.NCName,
          (
            SELECT GROUP_CONCAT(s.PaymentType || ':' || s.Amount)
            FROM TrnSettlement s
            WHERE s.OrderNo = t.TxnNo AND s.isSettled = 1
          ) AS Settlements,
          t.isSetteled,
          t.isBilled,
          t.isreversebill,
          t.isCancelled,
          SUM(td.Qty) AS TotalItems
      FROM TAxnTrnbill t
      LEFT JOIN TAxnTrnbilldetails td ON t.TxnID = td.TxnID
      LEFT JOIN mst_users u ON t.UserId = u.userid
      WHERE ((t.isCancelled = 0 AND (t.isBilled = 1 OR t.isSetteled = 1)) OR t.isreversebill = 1)
        AND t.TxnDatetime BETWEEN ? AND ?
      GROUP BY t.TxnID, t.TxnNo
      ORDER BY t.TxnDatetime DESC;
    `;

    const rows = db.prepare(query).all(startDate, endDate);

    // 🔹 Process and structure the result similar to handover
    const transactions = {};
    for (const row of rows) {
      if (!row.Settlements && !row.isSetteled) continue;

      const settlements = (row.Settlements || '').split(',');
      const paymentBreakdown = {
        cash: 0,
        card: 0,
        gpay: 0,
        phonepe: 0,
        qrcode: 0,
        credit: 0,
      };
      const paymentModes = [];

      settlements.forEach(s => {
        const [type, amountStr] = s.split(':');
        const amount = parseFloat(amountStr) || 0;
        if (type) paymentModes.push(type);
        if (type.toLowerCase().includes('cash')) paymentBreakdown.cash += amount;
        if (type.toLowerCase().includes('card')) paymentBreakdown.card += amount;
        if (type.toLowerCase().includes('gpay') || type.toLowerCase().includes('google')) paymentBreakdown.gpay += amount;
        if (type.toLowerCase().includes('phonepe')) paymentBreakdown.phonepe += amount;
        if (type.toLowerCase().includes('qr')) paymentBreakdown.qrcode += amount;
        if (type.toLowerCase().includes('credit') && !type.toLowerCase().includes('card')) paymentBreakdown.credit += amount;
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
          ncName: row.NCName || '',
          cgst: parseFloat(row.CGST || 0),
          sgst: parseFloat(row.SGST || 0),
          grossAmount: parseFloat(row.GrossAmount || 0),
          roundOff: parseFloat(row.RoundOFF || 0),
          revAmt: parseFloat(row.RevAmt || 0),
          reverseBill: row.isreversebill,
          water: parseFloat(row.Water || 0),
          captain: row.Captain || 'N/A',
          user: row.UserName || 'N/A',
          date: row.TxnDatetime,
          paymentMode: paymentModes.join(', '),
          ...paymentBreakdown,
        };
      }
    }

    const orders = Object.values(transactions);

    // 🔹 Calculate totals
    const totalSales = orders.reduce((sum, o) => sum + o.amount, 0);
    const summary = {
      totalOrders: orders.length,
      totalSales,
      cash: orders.reduce((s, o) => s + (o.cash || 0), 0),
      card: orders.reduce((s, o) => s + (o.card || 0), 0),
      gpay: orders.reduce((s, o) => s + (o.gpay || 0), 0),
      phonepe: orders.reduce((s, o) => s + (o.phonepe || 0), 0),
      qrcode: orders.reduce((s, o) => s + (o.qrcode || 0), 0),
      credit: orders.reduce((s, o) => s + (o.credit || 0), 0),
      averageOrderValue: orders.length ? (totalSales / orders.length).toFixed(2) : 0,
    };

    res.json({
      success: true,
      data: { fromDate, toDate, orders, summary },
    });
  } catch (error) {
    console.error("Error fetching daily sales data:", error);
    res.status(500).json({ success: false, message: "Failed to fetch daily sales data" });
  }
};


module.exports = {
  getHandoverData,
  saveCashDenomination,
  saveDayEndCashDenomination,
  saveDayEnd,
  getDailySalesData
};
