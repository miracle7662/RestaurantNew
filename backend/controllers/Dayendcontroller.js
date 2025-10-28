
const db = require('../config/db');
// Convert to India Standard Time (UTC+5:30)

const getDayendData = (req, res) => {
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
          t.isDayEnd,
          t.DayEndEmpID,
          SUM(td.Qty) as TotalItems
      FROM TAxnTrnbill t
      LEFT JOIN TAxnTrnbilldetails td ON t.TxnID = td.TxnID
      LEFT JOIN mst_users u ON t.UserId = u.userid
      WHERE  t.isDayEnd= 0 and (t.isCancelled = 0 AND (t.isBilled = 1 OR t.isSetteled = 1)) OR t.isreversebill = 1

      GROUP BY t.TxnID, t.TxnNo
      ORDER BY t.TxnDatetime DESC;
    `;

    const rows = db.prepare(query).all();

    // Group by transaction
    const transactions = {};
    for (const row of rows) {
      // If there are no settlements and the bill is not settled, skip it (unless it's a reversed bill)
      if (!row.Settlements && !row.isSetteled && !row.isreversebill) {
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
          isDayEnd: row.isDayEnd,
          dayEndEmpID: row.DayEndEmpID,
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
    console.error('Error fetching dayend data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dayend data' });
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
    const { dayend_total_amt, outlet_id, hotel_id, created_by_id } = req.body;

    if (!outlet_id || !hotel_id || !created_by_id)
      return res.status(400).json({ success: false, message: "Missing fields" });

    console.log("=== DAY END PROCESS ===");
    console.log("Outlet:", outlet_id, "Hotel:", hotel_id, "User:", created_by_id, "Amount:", dayend_total_amt);
    
    // Get last record
    const last = db.prepare(`
      SELECT dayend_date, next_date FROM trn_dayend
      WHERE outlet_id = ? AND hotel_id = ?
      ORDER BY id DESC LIMIT 1
    `).get(outlet_id, hotel_id); // Positional binding is fine here

    console.log("Last record:", last);

    let dayend_date, next_date;

    if (last) {
      // Use the next_date from the last record as the current dayend_date
      dayend_date = last.next_date; 
      const nextDay = new Date(last.next_date);
      nextDay.setDate(nextDay.getDate() + 1);
      next_date = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
    } else {
      const today = new Date();
      dayend_date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + 1);
      next_date = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
    }

    console.log("Calculated dates - Dayend:", dayend_date, "Next:", next_date);

    

    

    // Indian time for system_datetime
    const now = new Date();
    const indiaTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const formattedIndiaTime = indiaTime.toISOString().replace('T', ' ').slice(0, 19);

    const lock_datetime = `${dayend_date} 23:59:59`;

    console.log("Inserting new dayend record...");

    // Insert the dayend record
    const result = db.prepare(`
      INSERT INTO trn_dayend (
        dayend_date, next_date, system_datetime, lock_datetime, 
        outlet_id, hotel_id, dayend_total_amt, created_by_id
      ) VALUES (
        @dayend_date, @next_date, @system_datetime, @lock_datetime, 
        @outlet_id, @hotel_id, @dayend_total_amt, @created_by_id
      )
    `).run({
      dayend_date: dayend_date,
      next_date: next_date,
      system_datetime: formattedIndiaTime,
      lock_datetime: lock_datetime,
      outlet_id: outlet_id,
      hotel_id: hotel_id,
      dayend_total_amt: dayend_total_amt || 0,
      created_by_id: created_by_id
    }
    );

    const lastInsertId = result.lastInsertRowid;
    
    // Verify the inserted data
    const storedData = db.prepare(`
      SELECT id, dayend_date, next_date, system_datetime FROM trn_dayend WHERE id = ?
    `).get(lastInsertId);

    console.log("✅ Dayend completed successfully:", storedData);

    return res.json({ 
      success: true, 
      message: `Day End for ${dayend_date} completed successfully ✅`,
      data: storedData
    });

  } catch (e) {
    console.error("❌ Day End Error:", e);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to complete day end',
      error: e.message 
    });
  }
};

module.exports = {
  getDayendData,
  saveDayEndCashDenomination,
  saveDayEnd,
};