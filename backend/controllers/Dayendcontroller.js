
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
          t.outletid,
          t.HotelID,
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
          (SELECT GROUP_CONCAT(s.PaymentType || ':' || s.Amount) FROM TrnSettlement s WHERE s.OrderNo = t.TxnNo AND s.isSettled = 1) as Settlements,
          (SELECT GROUP_CONCAT(s.PaymentType) FROM TrnSettlement s WHERE s.OrderNo = t.TxnNo AND s.isSettled = 1) as PaymentType,
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
      WHERE  t.isDayEnd= 0 and (t.isCancelled = 0 AND (t.isBilled = 1 OR t.isSetteled = 1))

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

      settlements.forEach(s => {
        const [type, amountStr] = s.split(':');
        const amount = parseFloat(amountStr) || 0;
        if (!type) return;
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
            : row.PaymentType || (row.isSetteled ? 'Cash' : 'Unpaid'),
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
          outletid: row.outletid,
          grossAmount: parseFloat(row.GrossAmount || 0),
          roundOff: parseFloat(row.RoundOFF || 0),
          revAmt: parseFloat(row.RevAmt || 0),
          reverseBill: row.isreversebill,
          water: parseFloat(row.Water || 0),
          captain: row.Captain || 'N/A',
          user: row.UserName || 'N/A',
          date: row.TxnDatetime,
          paymentType: row.isreversebill
            ? 'Reversed'
            : row.PaymentType || (row.isSetteled ? 'Cash' : 'Unpaid'),
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

    // // ===========================================
    // // ✅ CALCULATE CLOSING BALANCE (Cash received during the day)
    // // ===========================================
    // const cashSummary = db.prepare(`
    //   SELECT 
    //     COALESCE(SUM(
    //       CAST(
    //         REPLACE(
    //           SUBSTR(s.Amount, 1, INSTR(s.Amount || '.', '.') - 1),
    //           COALESCE(SUBSTR(s.Amount, 1, INSTR(s.Amount, '.') - 1), ''),
    //           ''
    //         ) AS REAL
    //       ), 0)
    //     ) as totalCash
    //   FROM TrnSettlement s
    //   JOIN TAxnTrnbill t ON s.OrderNo = t.TxnNo
    //   WHERE t.isDayEnd = 0 
    //     AND t.isCancelled = 0 
    //     AND (t.isBilled = 1 OR t.isSetteled = 1)
    //     AND s.isSettled = 1
    //     AND LOWER(s.PaymentType) LIKE '%cash%'
    // `).get();

    // // Alternative: Get cash from settlements using a simpler approach
    // const cashFromSettlements = db.prepare(`
    //   SELECT s.Amount, s.PaymentType
    //   FROM TrnSettlement s
    //   JOIN TAxnTrnbill t ON s.OrderNo = t.TxnNo
    //   WHERE t.isDayEnd = 0 
    //     AND t.isCancelled = 0 
    //     AND (t.isBilled = 1 OR t.isSetteled = 1)
    //     AND s.isSettled = 1
    // `).all();

    // let totalCashAmount = 0;
    // cashFromSettlements.forEach(settlement => {
    //   if (settlement.PaymentType && settlement.PaymentType.toLowerCase().includes('cash')) {
    //     totalCashAmount += parseFloat(settlement.Amount) || 0;
    //   }
    // });

    // console.log("💰 Calculated Closing Balance (Cash):", totalCashAmount);

    // ===========================================
    // ✅ STEP 1: CHECK PENDING TABLES BEFORE DAYEND
    // ===========================================
    const pendingTables = db.prepare(`
      SELECT TableID
      FROM msttablemanagement
      WHERE outletid = ?
        AND hotelid = ?
        AND status = 1
    `).all(outlet_id, hotel_id);

    if (pendingTables.length > 0) {
      console.log("⛔ Pending Tables Found:", pendingTables.map(t => t.TableID));
      return res.status(400).json({
        success: false,
        message: "Day End cannot be completed — Some tables still have pending bills!",
        pendingTables: pendingTables.map(t => t.TableID)
      });
    }
    // ===========================================

    // Get last record
    const last = db.prepare(`
      SELECT dayend_date, curr_date FROM trn_dayend
      WHERE outlet_id = ? AND hotel_id = ?
      ORDER BY id DESC LIMIT 1
    `).get(outlet_id, hotel_id);

    console.log("Last record:", last);

    let dayend_date, curr_date;

    if (last) {
      // Use the curr_date from the last record as the current dayend_date
      dayend_date = last.curr_date;
      const nextDay = new Date(last.curr_date);
      nextDay.setDate(nextDay.getDate() + 1);
      curr_date = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
    } else {
      // No previous dayend, calculate based on current IST time
      const now = new Date();
      const indiaTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      const currentHour = indiaTime.getHours();

      let businessDate = new Date(indiaTime);
       // If current time is after midnight (12:00 AM) and before 6:00 AM, use previous day as business date
      if (currentHour < 6) {
        businessDate.setDate(businessDate.getDate() - 1);
      }

      dayend_date = `${businessDate.getFullYear()}-${String(businessDate.getMonth() + 1).padStart(2, '0')}-${String(businessDate.getDate()).padStart(2, '0')}`;
      const nextDay = new Date(businessDate);
      nextDay.setDate(businessDate.getDate() + 1);
      curr_date = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
    }

    console.log("Calculated dates - Dayend:", dayend_date, "Next:", curr_date);

    // Indian time for system_datetime
    const now = new Date();
    const indiaTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const formattedIndiaTime = indiaTime.toISOString().replace('T', ' ').slice(0, 19);

    // ==============================
    // ✅ NEW LOGIC for lock_datetime
    // ==============================
// Check current conditions
  
const today = new Date(indiaTime.toISOString().split('T')[0]); // yyyy-mm-dd
let lock_datetime;

if (last) {
    const lastDayEnd = new Date(last.curr_date);
    const isDayEndPending = lastDayEnd < today;
    const isAfterMidnight = indiaTime.getHours() < 6; // 00:00–05:59

    if (isDayEndPending) {
        // Pending DayEnd → lock at 23:59 of next business day
        const nextDay = new Date(lastDayEnd);
        nextDay.setDate(nextDay.getDate() + 1);
        lock_datetime = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2,'0')}-${String(nextDay.getDate()).padStart(2,'0')} 23:59:00`;
    } else if (isAfterMidnight) {
        // After midnight → lock at 23:59 of previous day
        const prevDay = new Date(today);
        prevDay.setDate(prevDay.getDate() - 1);
        lock_datetime = `${prevDay.getFullYear()}-${String(prevDay.getMonth() + 1).padStart(2,'0')}-${String(prevDay.getDate()).padStart(2,'0')} 23:59:00`;
    } else {
        // Normal → current system time
        lock_datetime = indiaTime.toISOString().replace('T', ' ').slice(0, 19);
    }
} else {
    // First ever DayEnd → current system time
    lock_datetime = indiaTime.toISOString().replace('T', ' ').slice(0, 19);
}

console.log("Lock DateTime selected:", lock_datetime);

console.log("Lock DateTime selected:", lock_datetime);

    console.log("Lock DateTime selected:", lock_datetime);

    console.log("Inserting new dayend record...");

    // Insert the dayend record with closing_balance
    const result = db.prepare(`
      INSERT INTO trn_dayend (
        dayend_date, curr_date, system_datetime, lock_datetime,
        outlet_id, hotel_id, dayend_total_amt,  created_by_id
      ) VALUES (
        @dayend_date, @curr_date, @system_datetime, @lock_datetime,
        @outlet_id, @hotel_id, @dayend_total_amt,  @created_by_id
      )
    `).run({
      dayend_date,
      curr_date,
      system_datetime: formattedIndiaTime,
      lock_datetime,
      outlet_id,
      hotel_id,
      dayend_total_amt: dayend_total_amt || 0,
      created_by_id
    });

    const lastInsertId = result.lastInsertRowid;

    // Update TAxnTrnbill table to mark transactions as dayended
    const updateTxn = db.prepare(`
      UPDATE TAxnTrnbill
      SET isDayEnd = 1, DayEndEmpID = @created_by_id
      WHERE isDayEnd = 0 AND ((isCancelled = 0 AND (isBilled = 1 OR isSetteled = 1)) OR isreversebill = 1)
    `).run({ created_by_id });

    console.log(`Updated ${updateTxn.changes} transactions in TAxnTrnbill`);

    // Verify the inserted data
    const storedData = db.prepare(`
      SELECT id, dayend_date, curr_date, system_datetime, lock_datetime FROM trn_dayend WHERE id = ?
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
      message: e.message || 'Failed to complete day end',
      error: e.message
    });
  }
};

const { getBusinessDate } = require('../utils/businessDate');

const getLatestCurrDate = (req, res) => {
  try {
    const { brandId: outlet_id, hotelid } = req.query;

    if (!hotelid) {
      return res.status(400).json({ success: false, message: 'User hotelid is required' });
    }

    let currDate = null;

    // If outlet_id is provided, use it; otherwise, just use hotelid
    if (outlet_id) {
      currDate = getBusinessDate(outlet_id, hotelid);
    } else {
      // For hotel admins without specific outlet, get the latest dayend for the hotel
      const db = require('../config/db');
      const row = db.prepare(`
        SELECT curr_date FROM trn_dayend
        WHERE hotel_id = ?
        ORDER BY id DESC LIMIT 1
      `).get(hotelid);
      currDate = row ? row.curr_date : null;
    }

    // If no dayend record exists, calculate default business date
    if (!currDate) {
      const now = new Date();
      const indiaTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      const currentHour = indiaTime.getHours();

      let businessDate = new Date(indiaTime);
      // If current time is after midnight (12:00 AM) and before 6:00 AM, use previous day as business date
      if (currentHour < 6) {
        businessDate.setDate(businessDate.getDate() - 1);
      }

      currDate = `${businessDate.getFullYear()}-${String(businessDate.getMonth() + 1).padStart(2, '0')}-${String(businessDate.getDate()).padStart(2, '0')}`;
    }

    res.json({ success: true, data: { curr_date: currDate } });
  } catch (error) {
    console.error('Error fetching latest curr_date:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch latest curr_date' });
  }
};

const generateDayEndReportHTML = (req, res) => {
  try {
    const { DayEndEmpID, businessDate, selectedReports } = req.body;

    if (!DayEndEmpID || !businessDate || !selectedReports) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    // Query to get day-ended transactions for the DayEndEmpID and business date
    const query = `
      SELECT
          t.TxnID,
          t.TxnNo,
          t.TableID,
          t.outletid,
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
          t.NCPurpose,
          t.NCName,
          t.DiscountType,
          t.DiscPer,
          GROUP_CONCAT(DISTINCT CASE WHEN td.Qty > 0 THEN td.KOTNo END) as KOTNo,
          COALESCE(GROUP_CONCAT(DISTINCT td.RevKOTNo), '') as RevKOTNo,
          GROUP_CONCAT(DISTINCT CASE WHEN td.isNCKOT = 1 THEN td.KOTNo END) as NCKOT,
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
          SUM(td.Qty) as TotalItems,
          GROUP_CONCAT(DISTINCT td.ItemID || ':' || td.Qty || ':' || td.RuntimeRate || ':'  || ':' || td.isNCKOT || ':' || td.RevKOTNo) as ItemDetails
      FROM TAxnTrnbill t
      LEFT JOIN TAxnTrnbilldetails td ON t.TxnID = td.TxnID
      LEFT JOIN mst_users u ON t.UserId = u.userid
      WHERE t.isDayEnd = 1 AND strftime('%Y-%m-%d', datetime(t.TxnDatetime, '+05:30')) = ? AND t.DayEndEmpID = ?
      GROUP BY t.TxnID, t.TxnNo
      ORDER BY t.TxnDatetime DESC;
    `;

    const rows = db.prepare(query).all(businessDate, DayEndEmpID);

    // Process data
    const transactions = [];
    const reverseKOTs = [];
    const reverseBills = [];
    const ncKOTs = [];

    rows.forEach(row => {
      const settlements = (row.Settlements || '').split(',');
      const paymentBreakdown = { cash: 0, card: 0, gpay: 0, phonepe: 0, qrcode: 0, credit: 0, other: 0 };
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
        else paymentBreakdown.other += amount;
      });

      const transaction = {
        billNo: row.TxnNo,
        tableNo: row.TableID,
        grossAmount: parseFloat(row.GrossAmount || 0),
        discount: parseFloat(row.Discount || 0),
        cgst: parseFloat(row.CGST || 0),
        sgst: parseFloat(row.SGST || 0),
        netAmount: parseFloat(row.TotalAmount || 0),
        paymentMode: paymentModes.join(', ') || 'Cash',
        discountReason: row.DiscountType || (row.DiscPer ? `${row.DiscPer}%` : 'N/A'),
        customerName: row.NCName || 'N/A',
        creditAmount: paymentBreakdown.credit,
        reversedAmount: parseFloat(row.RevAmt || 0),
        reason: row.DiscountType || 'N/A',
        time: row.TxnDatetime,
        ncName: row.NCName || '',
        ncPurpose: row.NCPurpose || '',
        isReverseBill: row.isreversebill,
        itemDetails: (row.ItemDetails || '').split(',').map(detail => {
          const [itemId, qty, rate, reason, isNcKot, revKotNo] = detail.split(':');
          return { itemId, qty: parseInt(qty), rate: parseFloat(rate), reason, isNcKot: isNcKot === '1', revKotNo };
        }).filter(d => d.itemId)
      };

      transactions.push(transaction);

      // Collect reverse KOTs
      if (row.RevKOTNo) {
        row.RevKOTNo.split(',').forEach(revKot => {
          if (revKot.trim()) {
            reverseKOTs.push({
              kotNo: revKot.trim(),
              tableNo: row.TableID,
              itemName: 'N/A', // Would need to join with mstrestmenu for item name
              quantity: 1, // Placeholder
              reason: 'N/A', // Placeholder
              time: row.TxnDatetime
            });
          }
        });
      }

      // Collect reverse bills
      if (row.isreversebill) {
        reverseBills.push({
          billNo: row.TxnNo,
          tableNo: row.TableID,
          reversedAmount: parseFloat(row.RevAmt || 0),
          reason: 'N/A', // Placeholder
          time: row.TxnDatetime
        });
      }

      // Collect NC KOTs
      if (row.NCKOT) {
        ncKOTs.push({
          ncName: row.NCName || '',
          purpose: row.NCPurpose || '',
          itemName: 'N/A', // Placeholder
          quantity: 1, // Placeholder
          amount: parseFloat(row.TotalAmount || 0)
        });
      }
    });

    // Generate HTML
    let html = '<div style="font-family: monospace; font-size: 12px; line-height: 1.2; max-width: 320px; margin: 0 auto; white-space: pre-wrap;">';

    selectedReports.forEach(reportKey => {
      switch (reportKey) {
        case 'billDetails':
          html += generateBillDetailsHTML(transactions);
          break;
        case 'creditSummary':
          html += generateCreditSummaryHTML(transactions);
          break;
        case 'paymentSummary':
          html += generatePaymentSummaryHTML(transactions);
          break;
        case 'discountSummary':
          html += generateDiscountSummaryHTML(transactions);
          break;
        case 'reverseKOTsSummary':
          html += generateReverseKOTsSummaryHTML(reverseKOTs);
          break;
        case 'reverseBillSummary':
          html += generateReverseBillSummaryHTML(reverseBills);
          break;
        case 'ncKOTSalesSummary':
          html += generateNCKOTSalesSummaryHTML(ncKOTs);
          break;
      }
      html += '\n----------------------------\n';
    });

    html += '</div>';

    res.json({ success: true, html });
  } catch (error) {
    console.error('Error generating day end report HTML:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};

function generateBillDetailsHTML(transactions) {
  let html = 'BILL DETAILS\n\n';
  html += 'Bill No  Table  Gross   Disc   CGST   SGST   Net    Payment\n';
  html += '-------- ------ ------- ------ ------ ------ ------ --------\n';

  let totalGross = 0, totalDisc = 0, totalCGST = 0, totalSGST = 0, totalNet = 0;

  transactions.forEach(t => {
    html += `${t.billNo.padEnd(8)} ${String(t.tableNo).padEnd(6)} ${t.grossAmount.toFixed(2).padStart(7)} ${t.discount.toFixed(2).padStart(6)} ${t.cgst.toFixed(2).padStart(6)} ${t.sgst.toFixed(2).padStart(6)} ${t.netAmount.toFixed(2).padStart(6)} ${t.paymentMode.substring(0,8)}\n`;
    totalGross += t.grossAmount;
    totalDisc += t.discount;
    totalCGST += t.cgst;
    totalSGST += t.sgst;
    totalNet += t.netAmount;
  });

  html += '-------- ------ ------- ------ ------ ------ ------ --------\n';
  html += `TOTAL    ${totalGross.toFixed(2).padStart(7)} ${totalDisc.toFixed(2).padStart(6)} ${totalCGST.toFixed(2).padStart(6)} ${totalSGST.toFixed(2).padStart(6)} ${totalNet.toFixed(2).padStart(6)}\n\n`;

  return html;
}

function generateCreditSummaryHTML(transactions) {
  let html = 'CREDIT SUMMARY\n\n';
  html += 'Customer / Ledger Name     Credit Amount\n';
  html += '----------------------- --------------\n';

  let totalCredit = 0;

  transactions.filter(t => t.creditAmount > 0).forEach(t => {
    html += `${t.customerName.substring(0,23).padEnd(23)} ${t.creditAmount.toFixed(2).padStart(14)}\n`;
    totalCredit += t.creditAmount;
  });

  html += '----------------------- --------------\n';
  html += `TOTAL CREDIT             ${totalCredit.toFixed(2).padStart(14)}\n\n`;

  return html;
}

function generatePaymentSummaryHTML(transactions) {
  let html = 'PAYMENT SUMMARY\n\n';

  let cash = 0, card = 0, upi = 0, qr = 0, other = 0;

  transactions.forEach(t => {
    cash += t.paymentMode.toLowerCase().includes('cash') ? t.netAmount : 0;
    card += t.paymentMode.toLowerCase().includes('card') ? t.netAmount : 0;
    upi += (t.paymentMode.toLowerCase().includes('gpay') || t.paymentMode.toLowerCase().includes('phonepe')) ? t.netAmount : 0;
    qr += t.paymentMode.toLowerCase().includes('qr') ? t.netAmount : 0;
    other += t.netAmount - (cash + card + upi + qr); // Approximation
  });

  html += `Cash          ${cash.toFixed(2).padStart(10)}\n`;
  html += `Card          ${card.toFixed(2).padStart(10)}\n`;
  html += `UPI           ${upi.toFixed(2).padStart(10)}\n`;
  html += `QR Code       ${qr.toFixed(2).padStart(10)}\n`;
  html += `Other         ${other.toFixed(2).padStart(10)}\n`;
  html += '---------- ----------\n';
  html += `GRAND TOTAL   ${(cash + card + upi + qr + other).toFixed(2).padStart(10)}\n\n`;

  return html;
}

function generateDiscountSummaryHTML(transactions) {
  let html = 'DISCOUNT SUMMARY\n\n';
  html += 'Bill No  Discount Reason      Amount\n';
  html += '-------- -------------------- ------\n';

  let totalDiscount = 0;

  transactions.filter(t => t.discount > 0).forEach(t => {
    const discountReason = String(t.discountReason || 'N/A');
    html += `${t.billNo.padEnd(8)} ${discountReason.substring(0,20).padEnd(20)} ${t.discount.toFixed(2).padStart(6)}\n`;
    totalDiscount += t.discount;
  });

  html += '-------- -------------------- ------\n';
  html += `TOTAL DISCOUNT               ${totalDiscount.toFixed(2).padStart(6)}\n\n`;

  return html;
}

function generateReverseKOTsSummaryHTML(reverseKOTs) {
  let html = 'REVERSE KOTs SUMMARY\n\n';
  html += 'KOT No  Table  Item Name          Qty  Reason    Time\n';
  html += '------- ------ ------------------ ---- --------- --------\n';

  reverseKOTs.forEach(r => {
    const timeStr = new Date(r.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const itemName = String(r.itemName || 'N/A');
    const reason = String(r.reason || 'N/A');
    html += `${r.kotNo.padEnd(7)} ${String(r.tableNo).padEnd(6)} ${itemName.substring(0,18).padEnd(18)} ${String(r.quantity).padStart(4)} ${reason.substring(0,9).padEnd(9)} ${timeStr}\n`;
  });

  html += '\n';
  return html;
}

function generateReverseBillSummaryHTML(reverseBills) {
  let html = 'REVERSE BILL SUMMARY\n\n';
  html += 'Bill No  Table  Reversed Amount  Reason    Time\n';
  html += '-------- ------ ---------------- --------- --------\n';

  reverseBills.forEach(r => {
    const timeStr = new Date(r.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    html += `${r.billNo.padEnd(8)} ${String(r.tableNo).padEnd(6)} ${r.reversedAmount.toFixed(2).padStart(16)} ${r.reason.substring(0,9).padEnd(9)} ${timeStr}\n`;
  });

  html += '\n';
  return html;
}

function generateNCKOTSalesSummaryHTML(ncKOTs) {
  let html = 'NC KOT SALES SUMMARY\n\n';
  html += 'NC Name    Purpose    Item Name          Qty  Amount\n';
  html += '---------- ---------- ------------------ ---- ------\n';

  let totalAmount = 0;

  ncKOTs.forEach(n => {
    html += `${n.ncName.substring(0,10).padEnd(10)} ${n.purpose.substring(0,10).padEnd(10)} ${n.itemName.substring(0,18).padEnd(18)} ${String(n.quantity).padStart(4)} ${n.amount.toFixed(2).padStart(6)}\n`;
    totalAmount += n.amount;
  });

  html += '---------- ---------- ------------------ ---- ------\n';
  html += `TOTAL NC AMOUNT                            ${totalAmount.toFixed(2).padStart(6)}\n\n`;

  return html;
}

const getClosingBalance = (req, res) => {
  try {
    const { outlet_id, hotel_id } = req.query;

    if (!hotel_id) {
      return res.status(400).json({ success: false, message: 'hotel_id is required' });
    }

    // Get the last dayend record for the outlet/hotel
    // Handle both cases: when outlet_id is provided and when it's not
    let lastDayend;
    
    if (outlet_id) {
      // If outlet_id is provided, match both hotel_id and outlet_id
      lastDayend = db.prepare(`
        SELECT closing_balance
FROM trn_dayend
WHERE  hotel_id = ?
  AND  curr_date
ORDER BY dayend_date DESC
LIMIT 1 OFFSET 1;

      `).get(outlet_id, hotel_id);
    } else {
      // If outlet_id is not provided, just match by hotel_id
      // This will get the most recent dayend record for this hotel (regardless of outlet)
      lastDayend = db.prepare(`
        SELECT closing_balance
FROM trn_dayend
WHERE  hotel_id = ?
  AND  curr_date
ORDER BY dayend_date DESC
LIMIT 1 OFFSET 1;
      `).get(hotel_id);
    }

    if (lastDayend) {
      res.json({
        success: true,
        data: {
          closing_balance: lastDayend.closing_balance || 0,
          dayend_date: lastDayend.dayend_date,
          curr_date: lastDayend.curr_date
        }
      });
    } else {
      // No previous dayend found - return 0 as opening balance
      res.json({
        success: true,
        data: {
          closing_balance: 0,
          dayend_date: null,
          curr_date: null
        }
      });
    }
  } catch (error) {
    console.error('Error fetching closing balance:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch closing balance' });
  }
};

const saveOpeningBalance = (req, res) => {
  try {
    const { opening_balance, outlet_id, hotel_id, user_id } = req.body;

    // Validate required fields - handle NaN values
    const validHotelId = Number(hotel_id);
    const validUserId = Number(user_id);
    
    if (!validHotelId || !validUserId || isNaN(validHotelId) || isNaN(validUserId)) {
      return res.status(400).json({ success: false, message: 'hotel_id and user_id are required' });
    }

    // Handle outlet_id - use 0 or null based on database constraint
    // If outlet_id is undefined/null/NaN, we'll use null for the database
    let validOutletId = outlet_id ? Number(outlet_id) : null;
    if (isNaN(validOutletId)) {
      validOutletId = null;
    }

    console.log("=== SAVE OPENING BALANCE ===");
    console.log("Outlet:", validOutletId, "Hotel:", validHotelId, "User:", validUserId, "Opening Balance:", opening_balance);

    // Get current business date
    const now = new Date();
    const indiaTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const currentHour = indiaTime.getHours();

    let businessDate = new Date(indiaTime);
    if (currentHour < 6) {
      businessDate.setDate(businessDate.getDate() - 1);
    }

    const curr_date = `${businessDate.getFullYear()}-${String(businessDate.getMonth() + 1).padStart(2, '0')}-${String(businessDate.getDate()).padStart(2, '0')}`;
    const nextDay = new Date(businessDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const next_date = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;

    const formattedIndiaTime = indiaTime.toISOString().replace('T', ' ').slice(0, 19);

    // Check if a record already exists for this outlet/hotel
    const existingRecord = db.prepare(`
      SELECT id, dayend_date, curr_date FROM trn_dayend
      WHERE ${validOutletId ? 'outlet_id = ? AND' : ''} hotel_id = ?
      ORDER BY id DESC LIMIT 1
    `).get(...(validOutletId ? [validOutletId, validHotelId] : [validHotelId]));

    let result;
    if (existingRecord) {
      // Update existing record with new opening balance
      db.prepare(`
        UPDATE trn_dayend
        SET opening_balance = ?, dayend_date = ?, curr_date = ?, system_datetime = ?
        WHERE id = ?
      `).run(
        opening_balance || 0,
        existingRecord.curr_date,
        next_date,
        formattedIndiaTime,
        existingRecord.id
      );
      
      console.log("✅ Updated existing record with opening balance:", existingRecord.id);
      
      result = {
        id: existingRecord.id,
        opening_balance: opening_balance,
        dayend_date: existingRecord.curr_date,
        curr_date: next_date
      };
    } else {
      // Insert new record - if outlet_id is required, we need a valid value
      // Check if the table has a NOT NULL constraint on outlet_id
      // For now, we'll use 0 as a placeholder if outlet_id is not provided
      const outletIdToInsert = validOutletId !== null ? validOutletId : 0;
      
      const insertResult = db.prepare(`
        INSERT INTO trn_dayend (
          dayend_date, curr_date, system_datetime, lock_datetime,
          outlet_id, hotel_id, opening_balance, closing_balance, created_by_id
        ) VALUES (
          @dayend_date, @curr_date, @system_datetime, @lock_datetime,
          @outlet_id, @hotel_id, @opening_balance, 0, @created_by_id
        )
      `).run({
        dayend_date: curr_date,
        curr_date: next_date,
        system_datetime: formattedIndiaTime,
        lock_datetime: formattedIndiaTime,
        outlet_id: outletIdToInsert,
        hotel_id: validHotelId,
        opening_balance: opening_balance || 0,
        created_by_id: validUserId
      });

      console.log("✅ Created new record with opening balance:", insertResult.lastInsertRowid);
      
      result = {
        id: insertResult.lastInsertRowid,
        opening_balance: opening_balance,
        dayend_date: curr_date,
        curr_date: next_date
      };
    }

    return res.json({
      success: true,
      message: 'Opening balance saved successfully',
      data: result
    });

  } catch (error) {
    console.error('Error saving opening balance:', error);
    res.status(500).json({ success: false, message: 'Failed to save opening balance' });
  }
};


module.exports = {
  getDayendData,
  saveDayEndCashDenomination,
  saveDayEnd,
  getLatestCurrDate,
  getClosingBalance,
  saveOpeningBalance,
  generateDayEndReportHTML,
};
