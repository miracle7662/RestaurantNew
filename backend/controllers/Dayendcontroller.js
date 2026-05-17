const db = require('../config/db');
// Convert to India Standard Time (UTC+5:30)

const getDayendData = async (req, res) => {
  try {

    console.log("========================================");
    console.log("DAYEND API START");
    console.log("========================================");

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

    console.log("PAYMENT TYPES =>", paymentTypes);

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
      .join(",");

    // ======================================================
    // MAIN QUERY
    // ======================================================

    const query = `

      SELECT

        t.TxnID,
        t.TxnNo,
        t.TableID,
        t.table_name,
        t.outletid,
        t.HotelID,

        t.Amount AS TotalAmount,
        t.Discount,
        t.GrossAmt AS GrossAmount,
        t.CGST,
        t.SGST,
        t.RoundOFF,
        t.RevKOT AS RevAmt,
        t.TxnDatetime,

        t.Steward AS Captain,
        t.UserId,

        u.username AS UserName,

        -- ==================================================
        -- WATER AMOUNT
        -- ==================================================

        (
          SELECT COALESCE(
            SUM(
              CASE
                WHEN LOWER(i.item_name) LIKE '%water%'
                THEN d.RuntimeRate * d.Qty
                ELSE 0
              END
            ),
            0
          )
          FROM TAxnTrnbilldetails d
          JOIN mstrestmenu i
            ON d.ItemID = i.restitemid
          WHERE d.TxnID = t.TxnID
        ) AS Water,

        -- ==================================================
        -- KOT DETAILS
        -- ==================================================

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

        -- ==================================================
        -- PAYMENT MODE COLUMNS
        -- ==================================================

        ${paymentColumns},

        -- ==================================================
        -- PAYMENT DETAILS
        -- ==================================================

        GROUP_CONCAT(
          DISTINCT CONCAT(
            s.PaymentType,
            ':',
            s.Amount
          )
        ) AS Settlements,

        GROUP_CONCAT(
          DISTINCT s.PaymentType
        ) AS PaymentType,

        -- ==================================================
        -- TIP AMOUNT
        -- ==================================================

        COALESCE(
          SUM(
            DISTINCT COALESCE(s.TipAmount, 0)
          ),
          0
        ) AS TipAmountTotal,

        -- ==================================================
        -- SETTLEMENT AMOUNT
        -- BILL TOTAL + TIP
        -- ==================================================

        (
          COALESCE(t.Amount, 0)
          +
          COALESCE(
            SUM(
              DISTINCT COALESCE(s.TipAmount, 0)
            ),
            0
          )
        ) AS SettlementAmountTotal,

        -- ==================================================
        -- STATUS
        -- ==================================================

        t.isSetteled,
        t.isBilled,
        t.isreversebill,
        t.isCancelled,
        t.isDayEnd,
        t.DayEndEmpID,

        -- ==================================================
        -- TOTAL ITEMS
        -- ==================================================

        COALESCE(
          SUM(td.Qty),
          0
        ) AS TotalItems

      FROM TAxnTrnbill t

      -- ==================================================
      -- BILL DETAILS
      -- ==================================================

      LEFT JOIN TAxnTrnbilldetails td
        ON t.TxnID = td.TxnID

      -- ==================================================
      -- USER DETAILS
      -- ==================================================

      LEFT JOIN mst_users u
        ON t.UserId = u.userid

      -- ==================================================
      -- AGGREGATED SETTLEMENTS
      -- ==================================================

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
        CAST(s.OrderNo AS CHAR) = CAST(t.TxnNo AS CHAR)
        OR CAST(s.OrderNo AS CHAR) = CAST(t.orderNo AS CHAR)
      )

      -- ==================================================
      -- FILTERS
      -- ==================================================

      WHERE t.isDayEnd = 0

      AND (
        (
          t.isCancelled = 0
          AND (
            t.isBilled = 1
            OR t.isSetteled = 1
          )
        )
        OR t.isreversebill = 1
      )

      -- ==================================================
      -- GROUP BY
      -- ==================================================

      GROUP BY
        t.TxnID,
        t.TxnNo

      ORDER BY
        t.TxnDatetime DESC
    `;

    console.log("========================================");
    console.log("FINAL QUERY =>");
    console.log(query);
    console.log("========================================");

    // ======================================================
    // EXECUTE QUERY
    // ======================================================

    const [rows] = await db.query(query);

    console.log("TOTAL ROWS =>", rows.length);

    // ======================================================
    // FORMAT RESPONSE
    // ======================================================

    const orders = rows.map((row) => {

      // ====================================================
      // PAYMENT BREAKDOWN
      // ====================================================

      const payments = {};

const usedPaymentTypes = (
  row.PaymentType || ''
)
.split(',')
.map((p) => p.trim())
.filter(Boolean);

usedPaymentTypes.forEach((paymentType) => {

  payments[paymentType] = Number(
    row.TotalAmount || 0
  ) + Number(
    row.TipAmountTotal || 0
  );

});

      return {

        // ==================================================
        // BASIC DETAILS
        // ==================================================

        txnId: row.TxnID,

        orderNo: row.TxnNo,

        table: row.TableID,

        tableName: row.table_name || '',

        waiter: row.Captain || 'Unknown',

        captain: row.Captain || 'N/A',

        user: row.UserName || 'N/A',

        outletid: row.outletid,

        hotelid: row.HotelID,

        date: row.TxnDatetime,

        time: row.TxnDatetime,

        // ==================================================
        // AMOUNTS
        // ==================================================

        amount: Number(
          row.TotalAmount || 0
        ),

        grossAmount: Number(
          row.GrossAmount || 0
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

        // ==================================================
        // TIP
        // ==================================================

        tip: Number(
          row.TipAmountTotal || 0
        ),

        // ==================================================
        // BILL AMOUNT
        // TOTAL BILL + TIP
        // ==================================================

        settlementAmount: Number(
          row.SettlementAmountTotal || 0
        ),

        // ==================================================
        // PAYMENT
        // ==================================================

        paymentType: row.PaymentType || '',

        payments,

        settlements: row.Settlements || '',

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

        // ==================================================
        // STATUS
        // ==================================================

        status: row.isSetteled
          ? 'Settled'
          : (
              row.isBilled
                ? 'Billed'
                : 'Pending'
            ),

        isDayEnd: row.isDayEnd,

        dayEndEmpID: row.DayEndEmpID,

        reverseBill: row.isreversebill,

        // ==================================================
        // KOT DETAILS
        // ==================================================

        items: Number(
          row.TotalItems || 0
        ),

        kotNo: row.KOTNo || '',

        revKotNo: row.RevKOTNo || '',

        ncKot: row.NCKOT || '',

        ncPurpose: row.NCPurpose || '',

        ncName: row.NCName || '',
      };
    });

    console.log("========================================");
    console.log("FINAL ORDERS =>");
    console.log(JSON.stringify(orders, null, 2));
    console.log("========================================");

    // ======================================================
    // RESPONSE
    // ======================================================

    res.json({
      success: true,
      data: {
        orders
      }
    });

  } catch (error) {

    console.error(
      'Error fetching dayend data:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Failed to fetch dayend data'
    });
  }
};




const saveDayEndCashDenomination = async (req, res) => {
  const { denominations, total, userId, reason } = req.body;

  if (!denominations || !userId) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  try {
    // MySQL conversion: Changed from SQLite named parameters (@variable) to MySQL positional parameters (?)
    const query = `
      INSERT INTO trn_dayend_cashdenomination (
        note_2000, note_500, note_200, note_100, note_50, note_20, note_10, note_5, note_2, note_1,
        total_2000, total_500, total_200, total_100, total_50, total_20, total_10, total_5, total_2, total_1,
        grand_total, user_id
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?
      )
    `;

    const values = [
      denominations['2000'] || 0, denominations['500'] || 0,
      denominations['200'] || 0, denominations['100'] || 0,
      denominations['50'] || 0, denominations['20'] || 0,
      denominations['10'] || 0, denominations['5'] || 0,
      denominations['2'] || 0, denominations['1'] || 0,
      (denominations['2000'] || 0) * 2000, (denominations['500'] || 0) * 500,
      (denominations['200'] || 0) * 200, (denominations['100'] || 0) * 100,
      (denominations['50'] || 0) * 50, (denominations['20'] || 0) * 20,
      (denominations['10'] || 0) * 10, (denominations['5'] || 0) * 5,
      (denominations['2'] || 0) * 2, (denominations['1'] || 0) * 1,
      total,
      userId,
    ];

    // MySQL conversion: Changed from stmt.run() to db.query()
    const [result] = await db.query(query, values);

    res.json({ 
      success: true, 
      message: 'Day-End cash denomination saved successfully.', 
      id: result.insertId  // MySQL uses insertId instead of lastInsertRowid
    });
  } catch (error) {
    // console.error('Error saving day-end cash denomination:', error);
    res.status(500).json({ success: false, message: 'Failed to save day-end cash denomination data.' });
  }
};

const saveDayEnd = async (req, res) => {
  try {
    const { dayend_total_amt, outlet_id, hotel_id, created_by_id } = req.body;

    if (!outlet_id || !hotel_id || !created_by_id)
      return res.status(400).json({ success: false, message: "Missing fields" });

    // console.log("=== DAY END PROCESS ===");
    // console.log("Outlet:", outlet_id, "Hotel:", hotel_id, "User:", created_by_id, "Amount:", dayend_total_amt);

    // ===========================================
    // ✅ CALCULATE CLOSING BALANCE (Cash received during the day)
    // ===========================================
    // MySQL conversion: Changed from db.prepare().all() to await db.query()
    const [cashFromSettlements] = await db.query(`
      SELECT s.Amount, s.PaymentType
      FROM TrnSettlement s
      JOIN TAxnTrnbill t ON s.OrderNo = t.TxnNo
      WHERE t.isDayEnd = 0 
        AND t.isCancelled = 0 
        AND (t.isBilled = 1 OR t.isSetteled = 1)
        AND s.isSettled = 1
    `);

    let closing_balance = 0;
    cashFromSettlements.forEach(settlement => {
      if (settlement.PaymentType && settlement.PaymentType.toLowerCase().includes('cash')) {
        closing_balance += parseFloat(settlement.Amount) || 0;
      }
    });

    // console.log("💰 Calculated Closing Balance (Cash):", closing_balance);

    // ===========================================
    // ✅ STEP 1: CHECK PENDING TABLES & BILLS BEFORE DAYEND
    // ===========================================
    // MySQL conversion: Changed positional parameters from ? to ?
    const [pendingTables] = await db.query(`
      SELECT tableid AS TableID, table_name
      FROM msttablemanagement
      WHERE outletid = ?
        AND hotelid = ?
        AND status = 1
    `, [outlet_id, hotel_id]);

    // ✅ NEW: Check pending non-table bills (pickup/delivery/quickbill/takeaway)
    const [pendingBills] = await db.query(`
      SELECT 
        TxnID, 
        COALESCE(TxnNo, '') as TxnNo,
        COALESCE(table_name, 'Unnamed') as table_name
      FROM TAxnTrnbill 
      WHERE outletid = ? 
        AND hotelid = ?
        AND isDayEnd = 0 
        AND isSetteled = 0
        AND table_name IN ('Pickup','Delivery','Quick Bill','Takeaway')
    `, [outlet_id, hotel_id]);

    const allPending = [
      ...pendingTables.map(t => ({
        type: 'Table',
        id: t.TableID,
        name: t.table_name
      })),
      ...pendingBills.map(b => ({
        type: 'Bill',
        id: b.TxnID,
        name: b.TxnNo 
          ? `${b.table_name} (${b.TxnNo})`
          : `${b.table_name} (ID: ${b.TxnID})`
      }))
    ];

    if (allPending.length > 0) {
      // console.log("⛔ Pending Items Found:", allPending.map(p => `${p.type}:${p.id} (${p.name})`));
      return res.status(200).json({
        success: false,
        message: `Day End cannot be completed — Pending Tables/Bills: ${allPending.map(p => p.name).join(', ')}`,
        pendingTables: allPending.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type
        }))
      });
    }
    
    // ===========================================

    // Get last record
    // MySQL conversion: Changed from .get() to [rows][0]
    const [lastRows] = await db.query(`
      SELECT dayend_date, curr_date FROM trn_dayend
      WHERE outlet_id = ? AND hotel_id = ?
      ORDER BY id DESC LIMIT 1
    `, [outlet_id, hotel_id]);
    
    const last = lastRows[0] || null;

    // console.log("Last record:", last);

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

    // console.log("Lock DateTime selected:", lock_datetime);
    // console.log("Inserting new dayend record...");

    // Insert the dayend record with closing_balance
    // MySQL conversion: Changed from named parameters (@variable) to positional parameters (?)
    const [result] = await db.query(`
      INSERT INTO trn_dayend (
        dayend_date, curr_date, system_datetime, lock_datetime,
        outlet_id, hotel_id, dayend_total_amt, closing_balance, created_by_id
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `, [
      dayend_date,
      curr_date,
      formattedIndiaTime,
      lock_datetime,
      outlet_id,
      hotel_id,
      dayend_total_amt || 0,
      closing_balance || 0,
      created_by_id
    ]);

    const lastInsertId = result.insertId; // MySQL uses insertId instead of lastInsertRowid

    // Update TAxnTrnbill table to mark transactions as dayended
    // MySQL conversion: Changed named parameter to positional parameter
    const [updateResult] = await db.query(`
      UPDATE TAxnTrnbill
      SET isDayEnd = 1, DayEndEmpID = ?
      WHERE isDayEnd = 0 AND ((isCancelled = 0 AND (isBilled = 1 OR isSetteled = 1)) OR isreversebill = 1)
    `, [created_by_id]);

    // console.log(`Updated ${updateResult.affectedRows} transactions in TAxnTrnbill`); // MySQL uses affectedRows

    // Verify the inserted data
    const [storedRows] = await db.query(`
      SELECT id, dayend_date, curr_date, system_datetime, lock_datetime, closing_balance FROM trn_dayend WHERE id = ?
    `, [lastInsertId]);
    
    const storedData = storedRows[0];

    // console.log("✅ Dayend completed successfully:", storedData);

    return res.json({
      success: true,
      message: `Day End for ${dayend_date} completed successfully ✅`,
      data: {
        ...storedData,
        closing_balance: closing_balance
      }
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

const getLatestCurrDate = async (req, res) => {
  try {
    const { brandId: outlet_id, hotelid } = req.query;

    if (!hotelid) {
      return res.status(400).json({ success: false, message: 'User hotelid is required' });
    }

    let currDate = null;

    // If outlet_id is provided, use it; otherwise, just use hotelid
    if (outlet_id) {
      currDate = await getBusinessDate(outlet_id, hotelid);
    } else {
      // For hotel admins without specific outlet, get the latest dayend for the hotel
      const db = require('../config/db');
      // MySQL conversion: Changed from db.prepare().get() to await db.query()
      const [rows] = await db.query(`
        SELECT curr_date FROM trn_dayend
        WHERE hotel_id = ?
        ORDER BY id DESC LIMIT 1
      `, [hotelid]);
      
      const row = rows[0] || null;
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



// ==================== MAIN CONTROLLER ====================
// ==================== MAIN CONTROLLER ====================

const generateDayEndReportHTML = async (req, res) => {
  try {
    const { DayEndEmpID, businessDate, selectedReports = [] } = req.body;

    // VALIDATION
    if (!DayEndEmpID || !businessDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'DayEndEmpID and businessDate required' 
      });
    }

    if (!Array.isArray(selectedReports) || selectedReports.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'selectedReports array required' 
      });
    }

    console.log(`📊 Generating DayEndReport for Emp:${DayEndEmpID}, Date:${businessDate}`);
    console.log('Reports:', selectedReports.join(', '));

    // ✅ Fetch ONLY required report data
    const reportData = {};

    for (const reportKey of selectedReports) {
      try {
        switch(reportKey) {
          case 'billDetails':
            reportData.billDetails = await getBillDetailsData(businessDate, DayEndEmpID);
            break;
          case 'paymentSummary':
            reportData.paymentSummary = await getPaymentSummaryData(businessDate, DayEndEmpID);
            break;
          case 'creditSummary':
            reportData.creditSummary = await getCreditSummaryData(businessDate, DayEndEmpID);
            break;
          case 'discountSummary':
            reportData.discountSummary = await getDiscountSummaryData(businessDate, DayEndEmpID);
            break;
          case 'reverseKOTSummary':
            reportData.reverseKOTs = await getReverseKOTsData(businessDate, DayEndEmpID);
            break;
          case 'reverseBillSummary':
            reportData.reverseBills = await getReverseBillsData(businessDate, DayEndEmpID);
            break;
          case 'ncKOTSummary':
            reportData.ncKOTSummary = await getNCKOTsData(businessDate, DayEndEmpID);
            break;
        }
      } catch (queryError) {
        console.error(`❌ Error fetching ${reportKey}:`, queryError);
        reportData[reportKey] = [];
      }
    }

    // ✅ Generate plain text content for thermal printer
    let reportContent = '';

    for (const reportKey of selectedReports) {
      try {
        let sectionText = '';
        switch(reportKey) {
          case 'billDetails': sectionText = generateBillDetailsText(reportData.billDetails); break;
          case 'paymentSummary': sectionText = generatePaymentSummaryText(reportData.paymentSummary); break;
          case 'creditSummary': sectionText = generateCreditSummaryText(reportData.creditSummary); break;
          case 'discountSummary': sectionText = generateDiscountSummaryText(reportData.discountSummary); break;
          case 'reverseKOTSummary': sectionText = generateReverseKOTsText(reportData.reverseKOTs); break;
          case 'reverseBillSummary': sectionText = generateReverseBillsText(reportData.reverseBills); break;
          case 'ncKOTSummary': sectionText = generateNCKOTsText(reportData.ncKOTSummary); break;
        }
        if (sectionText) reportContent += sectionText;
      } catch (textError) {
        console.error(`❌ Text generation failed for ${reportKey}:`, textError);
      }
    }

    if (!reportContent.trim()) {
      reportContent = '\n' + centerText('NO DATA AVAILABLE', 48) + '\n\n';
    }

    const thermalHTML = `<pre style="font-family:'Courier New',Courier,monospace;font-size:10px;margin:0;padding:0;line-height:1.2;">\n${reportContent}</pre>`;

    console.log(`✅ Generated ${selectedReports.length} report sections`);
    
    // ✅ CRITICAL FIX: Send reportData back to frontend
    res.json({ 
      success: true, 
      html: thermalHTML,
      data: reportData,  // ← THIS IS THE KEY FIX!
      debug: { 
        reportsProcessed: selectedReports.length,
        dataCounts: Object.keys(reportData).map(k => ({[k]: reportData[k]?.length || 0}))
      }
    });
  } catch (error) {
    console.error('❌ Fatal error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate Day End Report',
      error: error.message 
    });
  }
};

// ==================== DAY END DATA FETCHERS ====================
// Each report gets its OWN optimized SQL query (NO massive JOINs)

const getBillDetailsData = async (businessDate, dayEndEmpID) => {
  console.log(`🔍 getBillDetailsData: EmpID=${dayEndEmpID}, Date=${businessDate}`);

  const query = `
    SELECT 
      t.TxnID,
      t.TxnNo,
      t.table_name,

      t.Amount AS netAmount,
      t.GrossAmt AS grossAmount,

      -- Discount
      IFNULL(t.Discount, 0) AS Discount,

      -- GST
      IFNULL(t.CGST, 0) AS CGST,
      IFNULL(t.SGST, 0) AS SGST,

      t.RoundOFF,
      t.TxnDatetime,

      -- Payment Modes
      GROUP_CONCAT(DISTINCT s.PaymentType SEPARATOR ', ') AS paymentMode,

      -- Total Tip
      SUM(IFNULL(s.tipAmount, 0)) AS tipAmount

    FROM TAxnTrnbill t

    LEFT JOIN TrnSettlement s 
      ON s.OrderNo = t.TxnNo 
      AND s.isSettled = 1

    WHERE t.isDayEnd = 1
      AND t.DayEndEmpID = ?
      AND t.isNCKOT = 0
      AND t.isreversebill = 0
      AND t.TxnDatetime = ?
      AND t.isCancelled = 0

    GROUP BY t.TxnID

    ORDER BY t.TxnDatetime DESC
  `;

  const [rows] = await db.query(query, [dayEndEmpID, businessDate]);

  console.log(`✅ getBillDetailsData found ${rows.length} records`);

  return rows;
};

const getPaymentSummaryData = async (businessDate, dayEndEmpID) => {
  const query = `
    SELECT 
      s.PaymentType,
      SUM(s.Amount) as totalAmount,
      COUNT(DISTINCT s.OrderNo) as billCount
    FROM TrnSettlement s
    JOIN TAxnTrnbill t ON s.OrderNo = t.TxnNo
    WHERE t.isDayEnd = 1 
      AND t.DayEndEmpID = ?
      AND t.TxnDatetime = ?
      AND s.isSettled = 1
    GROUP BY s.PaymentType
    ORDER BY totalAmount DESC
  `;
  const [rows] = await db.query(query, [dayEndEmpID, businessDate]);
  return rows;
};

const getCreditSummaryData = async (businessDate, dayEndEmpID) => {
  const query = `
    SELECT 
      COALESCE(t.NCName, 'Walk-in Credit') as customerName,
      SUM(s.Amount) as creditAmount,
      COUNT(DISTINCT t.TxnNo) as billCount
    FROM TAxnTrnbill t
    LEFT JOIN TrnSettlement s ON s.OrderNo = t.TxnNo 
      AND LOWER(s.PaymentType) LIKE '%credit%' 
      AND s.isSettled = 1
    WHERE t.isDayEnd = 1 
      AND t.DayEndEmpID = ?
      AND t.TxnDatetime= ?
      AND t.isCancelled = 0
    GROUP BY t.NCName
    HAVING creditAmount > 0
    ORDER BY creditAmount DESC
  `;
  const [rows] = await db.query(query, [dayEndEmpID, businessDate]);
  return rows;
};

const getDiscountSummaryData = async (businessDate, dayEndEmpID) => {
  const query = `
    SELECT 
      t.TxnNo, t.table_name, t.Discount, t.DiscPer,
      CASE 
        WHEN t.DiscountType = 1 THEN 'Fixed'
        WHEN t.DiscountType = 2 THEN CONCAT(t.DiscPer, '%')
        ELSE 'Other'
      END as reason
    FROM TAxnTrnbill t
    WHERE t.isDayEnd = 1 
      AND t.DayEndEmpID = ?
      AND t.TxnDatetime = ?
      AND t.Discount > 0
      AND t.isCancelled = 0
    ORDER BY t.Discount DESC
  `;
  const [rows] = await db.query(query, [dayEndEmpID, businessDate]);
  return rows;
};

const getReverseKOTsData = async (businessDate, dayEndEmpID) => {
  console.log(`🔍 getReverseKOTsData: EmpID=${dayEndEmpID}, Date=${businessDate}`);
  const query = `
    SELECT DISTINCT
      td.RevKOTNo as kotNo,
      t.table_name,
      m.item_name,
      td.Qty as quantity,
      t.TxnDatetime
    FROM TAxnTrnbilldetails td
    JOIN TAxnTrnbill t ON td.TxnID = t.TxnID
    LEFT JOIN mstrestmenu m ON td.ItemID = m.restitemid
    WHERE t.isDayEnd = 1 
      AND t.DayEndEmpID = ?
      AND t.TxnDatetime = ?
      AND td.RevKOTNo IS NOT NULL 
      AND td.RevKOTNo != ''
    ORDER BY td.RevKOTNo DESC, t.TxnDatetime
  `;
  const [rows] = await db.query(query, [dayEndEmpID, businessDate]);
  console.log(`✅ getReverseKOTsData found ${rows.length} records`);
  return rows;
};

const getReverseBillsData = async (businessDate, dayEndEmpID) => {
  console.log(`🔍 getReverseBillsData: EmpID=${dayEndEmpID}, Date=${businessDate}`);
  const query = `
    SELECT 
      t.TxnNo as billNo,
      t.table_name,
      t.RevKOT as reversedAmount,
      t.TxnDatetime
    FROM TAxnTrnbill t
    WHERE t.isDayEnd = 1 
      AND t.DayEndEmpID = ?
      AND t.TxnDatetime = ?
      AND t.isreversebill = 1
      AND t.isCancelled = 1
    ORDER BY t.TxnDatetime DESC
  `;
  const [rows] = await db.query(query, [dayEndEmpID, businessDate]);
  console.log(`✅ getReverseBillsData found ${rows.length} records`);
  return rows;
};

const getNCKOTsData = async (businessDate, dayEndEmpID) => {
  console.log(`🔍 getNCKOTsData: EmpID=${dayEndEmpID}, Date=${businessDate}`);

  const query = `
    SELECT DISTINCT
      t.NCName AS ncName,
      t.NCPurpose AS purpose,
      td.Qty AS quantity,
      t.Amount AS amount,
      t.TxnDatetime,
      td.KOTNo AS kotNo
    FROM TAxnTrnbilldetails td
    JOIN TAxnTrnbill t ON td.TxnID = t.TxnID
    WHERE t.isDayEnd = 1
      AND t.DayEndEmpID = ?
      AND td.isNCKOT = 1
      AND t.TxnDatetime = ?
    
    ORDER BY t.TxnDatetime DESC, td.KOTNo DESC
  `;

  const [rows] = await db.query(query, [dayEndEmpID, businessDate, businessDate]);
  console.log(`✅ getNCKOTsData found ${rows.length} records`);
  return rows;
};

// ==================== THERMAL PRINTER TEXT GENERATORS ====================
// All styling removed - pure text for thermal printer (48 char width max)

const centerText = (text, width) => {
  text = text || '';
  if (text.length >= width) return text.substring(0, width);
  const totalSpace = width - text.length;
  const left = Math.floor(totalSpace / 2);
  const right = totalSpace - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
};

const generateBillDetailsText = (data) => {
  if (!data?.length) return '';

  let text = '='.repeat(48) + '\n';
  text += centerText('BILL DETAILS', 48) + '\n';
  text += '='.repeat(48) + '\n';

  // Header
  text += 'Bill  Tbl  Disc Gross GST Tip  Net   Mode\n';
  text += '-'.repeat(48) + '\n';

  let totals = {
    disc: 0,
    gross: 0,
    gst: 0,
    tip: 0,
    net: 0,
  };

  data.slice(0, 12).forEach((bill) => {
    const billNo = String(bill.TxnNo || '')
      .replace(/^\D+/, '')
      .substring(0, 5)
      .padEnd(5);

    const table = (bill.table_name || '')
      .substring(0, 4)
      .padEnd(4);

    const disc = Number(bill.discountAmount || 0)
      .toFixed(0)
      .padStart(4);

    const gross = Number(bill.grossAmount || 0)
      .toFixed(0)
      .padStart(5);

    const gst = (
      Number(bill.CGST || 0) +
      Number(bill.SGST || 0)
    )
      .toFixed(0)
      .padStart(3);

    const tip = Number(bill.tipAmount || 0)
      .toFixed(0)
      .padStart(4);

    const net = Number(bill.netAmount || 0)
      .toFixed(0)
      .padStart(5);

    const mode = (bill.paymentMode || 'Cash')
      .substring(0, 6)
      .padEnd(6);

    text += `${billNo} ${table} ${disc} ${gross} ${gst} ${tip} ${net} ${mode}\n`;

    totals.disc += Number(bill.discountAmount || 0);
    totals.gross += Number(bill.grossAmount || 0);
    totals.gst +=
      Number(bill.CGST || 0) +
      Number(bill.SGST || 0);
    totals.tip += Number(bill.tipAmount || 0);
    totals.net += Number(bill.netAmount || 0);
  });

  text += '-'.repeat(48) + '\n';

  text += `TOTAL      ${totals.disc
    .toFixed(0)
    .padStart(4)} ${totals.gross
    .toFixed(0)
    .padStart(5)} ${totals.gst
    .toFixed(0)
    .padStart(3)} ${totals.tip
    .toFixed(0)
    .padStart(4)} ${totals.net
    .toFixed(0)
    .padStart(5)}\n`;

  text += '='.repeat(48) + '\n\n';

  return text;
};

const generatePaymentSummaryText = (data) => {
  if (!data?.length) return '';

  let summary = {
    cash: 0, card: 0, upi: 0, qrcode: 0, credit: 0, total: 0
  };

  data.forEach((payment) => {
    const type = payment.PaymentType?.toLowerCase() || '';
    const amt = Number(payment.totalAmount || 0);

    if (type.includes('cash')) summary.cash += amt;
    else if (type.includes('card')) summary.card += amt;
    else if (type.includes('gpay') || type.includes('phone') || type.includes('upi')) summary.upi += amt;
    else if (type.includes('qr')) summary.qrcode += amt;
    else if (type.includes('credit')) summary.credit += amt;

    summary.total += amt;
  });

  if (summary.total === 0) return '';

  let text = '='.repeat(48) + '\n';
  text += centerText('PAYMENT SUMMARY', 48) + '\n';
  text += '='.repeat(48) + '\n';

  if (summary.cash > 0)
    text += `Cash          ${summary.cash.toLocaleString().padStart(12)}\n`;
  if (summary.card > 0)
    text += `Card          ${summary.card.toLocaleString().padStart(12)}\n`;
  if (summary.upi > 0)
    text += `UPI (GPay+PP) ${summary.upi.toLocaleString().padStart(12)}\n`;
  if (summary.qrcode > 0)
    text += `QR Code       ${summary.qrcode.toLocaleString().padStart(12)}\n`;
  if (summary.credit > 0)
    text += `Credit        ${summary.credit.toLocaleString().padStart(12)}\n`;

  text += '\n';
  text += `TOTAL         ${summary.total.toLocaleString().padStart(12)}\n`;
  text += '='.repeat(48) + '\n\n';

  return text;
};

const generateCreditSummaryText = (data) => {
  if (!data?.length) return '';
  
  let text = '='.repeat(48) + '\n';
  text += centerText('CREDIT SUMMARY', 48) + '\n';
  text += '='.repeat(48) + '\n';
  text += 'Customer             Bills   Amount\n';
  text += '-'.repeat(48) + '\n';

  let totalCredit = 0;
  data.slice(0, 8).forEach((cred) => {
    const name = (cred.customerName || '').substring(0, 18).padEnd(18);
    const bills = String(cred.billCount || 0).padStart(4);
    const amt = Number(cred.creditAmount || 0).toLocaleString().padStart(9);
    text += `${name} ${bills} ${amt}\n`;
    totalCredit += Number(cred.creditAmount || 0);
  });

  text += '-'.repeat(48) + '\n';
  text += `TOTAL                      ${totalCredit.toLocaleString().padStart(9)}\n`;
  text += '='.repeat(48) + '\n\n';
  
  return text;
};

const generateDiscountSummaryText = (data) => {
  if (!data?.length) return '';
  
  let text = '='.repeat(48) + '\n';
  text += centerText('DISCOUNT SUMMARY', 48) + '\n';
  text += '='.repeat(48) + '\n';
  text += 'Bill   Table   Reason   Amount\n';
  text += '-'.repeat(48) + '\n';

  let totalDisc = 0;
  data.slice(0, 10).forEach((disc) => {
    const bill = (disc.TxnNo || '').substring(0, 6).padEnd(6);
    const table = (disc.table_name || '').substring(0, 6).padEnd(6);
    const reason = (disc.reason || '').substring(0, 8).padEnd(8);
    const amt = String(Number(disc.Discount || 0).toLocaleString()).padStart(7);
    text += `${bill} ${table} ${reason} ${amt}\n`;
    totalDisc += Number(disc.Discount || 0);
  });

  text += '-'.repeat(48) + '\n';
  text += `TOTAL${' '.repeat(17)}${totalDisc.toLocaleString().padStart(7)}\n`;
  text += '='.repeat(48) + '\n\n';
  
  return text;
};

const generateReverseKOTsText = (data) => {
  if (!data?.length) return '';
  
  let text = '='.repeat(48) + '\n';
  text += centerText('REVERSE KOT SUMMARY', 48) + '\n';
  text += '='.repeat(48) + '\n';
  text += 'KOT#  Table  Item          Qty  Time\n';
  text += '-'.repeat(48) + '\n';

  data.slice(0, 10).forEach((kot) => {
    const kotNo = String(kot.kotNo || '').substring(0, 5).padEnd(5);
    const table = String(kot.table_name || '').substring(0, 6).padEnd(6);
    const item = String(kot.item_name || '').substring(0, 12).padEnd(12);
    const qty = String(kot.quantity || 0).padStart(3);
    const time = kot.TxnDatetime 
      ? new Date(kot.TxnDatetime).toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'})
      : '--:--';
    
    text += `${kotNo} ${table} ${item} ${qty} ${time}\n`;
  });

  text += '='.repeat(48) + '\n\n';
  return text;
};

const generateReverseBillsText = (data) => {
  if (!data?.length) return '';
  
  let text = '='.repeat(48) + '\n';
  text += centerText('REVERSE BILL SUMMARY', 48) + '\n';
  text += '='.repeat(48) + '\n';
  text += 'BillNo  Table    Amount   Time\n';
  text += '-'.repeat(48) + '\n';

  let totalRev = 0;
  data.slice(0, 10).forEach((bill) => {
    const billNo = (bill.billNo || '').substring(0, 7).padEnd(7);
    const table = (bill.table_name || '').substring(0, 7).padEnd(7);
    const amt = Number(bill.reversedAmount || 0).toLocaleString().padStart(8);
    const time = bill.TxnDatetime 
      ? new Date(bill.TxnDatetime).toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'})
      : '--:--';
    
    text += `${billNo} ${table} ${amt} ${time}\n`;
    totalRev += Number(bill.reversedAmount || 0);
  });

  text += '-'.repeat(48) + '\n';
  text += `TOTAL${' '.repeat(15)}${totalRev.toLocaleString().padStart(8)}\n`;
  text += '='.repeat(48) + '\n\n';
  
  return text;
};

const generateNCKOTsText = (data) => {
  if (!data?.length) return '';

  let text = '='.repeat(48) + '\n';
  text += centerText('NC KOT SUMMARY', 48) + '\n';
  text += '='.repeat(48) + '\n';
  text += 'NCName     Purpose    Qty   Amount\n';
  text += '-'.repeat(48) + '\n';

  let totalQty = 0;
  let totalAmt = 0;

  data.slice(0, 12).forEach(n => {
    const NCName = String(n.ncName || 'N/A').substring(0, 9).padEnd(10);
    const purpose = String(n.purpose || 'N/A').substring(0, 9).padEnd(10);
    const qty = String(n.quantity || 0).padStart(4);
    const amount = (Number(n.amount) || 0).toFixed(2).padStart(8);

    text += `${NCName} ${purpose} ${qty} ${amount}\n`;

    totalQty += Number(n.quantity || 0);
    totalAmt += Number(n.amount || 0);
  });

  text += '-'.repeat(48) + '\n';
  text += `TOTAL${' '.repeat(19)}${totalQty.toString().padStart(4)} ${totalAmt.toFixed(2).padStart(8)}\n`;
  text += '='.repeat(48) + '\n\n';

  return text;
};








const getClosingBalance = async (req, res) => {
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
      // MySQL conversion: Changed from db.prepare().get() to await db.query()
      const [rows] = await db.query(`
        SELECT closing_balance, opening_balance, dayend_date, curr_date
        FROM trn_dayend
        WHERE outlet_id = ? AND hotel_id = ?
          AND curr_date IS NOT NULL
        ORDER BY dayend_date DESC, id DESC
        LIMIT 1
      `, [outlet_id, hotel_id]);
      
      lastDayend = rows[0] || null;
    } else {
      // If outlet_id is not provided, just match by hotel_id
      // This will get the most recent dayend record for this hotel (regardless of outlet)
      const [rows] = await db.query(`
        SELECT closing_balance, opening_balance, dayend_date, curr_date
        FROM trn_dayend
        WHERE hotel_id = ?
          AND curr_date IS NOT NULL
        ORDER BY dayend_date DESC, id DESC
        LIMIT 1
      `, [hotel_id]);
      
      lastDayend = rows[0] || null;
    }

    if (lastDayend) {
      res.json({
        success: true,
        data: {
          closing_balance: lastDayend.closing_balance || 0,
          opening_balance: lastDayend.opening_balance,
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
          opening_balance: null,
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

// New endpoint to check if opening balance is required
const checkOpeningBalanceRequired = async (req, res) => {
  try {
    const { outlet_id, hotel_id } = req.query;

    if (!hotel_id) {
      return res.status(400).json({ success: false, message: 'hotel_id is required' });
    }

    // Get the last dayend record with curr_date not null
    let lastDayend;
    
    if (outlet_id) {
      // MySQL conversion: Changed from db.prepare().get() to await db.query()
      const [rows] = await db.query(`
        SELECT opening_balance, closing_balance, dayend_date, curr_date
        FROM trn_dayend
        WHERE outlet_id = ? AND hotel_id = ?
          AND curr_date IS NOT NULL
        ORDER BY dayend_date DESC, id DESC
        LIMIT 1
      `, [outlet_id, hotel_id]);
      
      lastDayend = rows[0] || null;
    } else {
      const [rows] = await db.query(`
        SELECT opening_balance, closing_balance, dayend_date, curr_date
        FROM trn_dayend
        WHERE hotel_id = ?
          AND curr_date IS NOT NULL
        ORDER BY dayend_date DESC, id DESC
        LIMIT 1
      `, [hotel_id]);
      
      lastDayend = rows[0] || null;
    }

    // If no record found, opening balance is NOT required (first time login)
    if (!lastDayend) {
      return res.json({
        success: true,
        data: {
          required: false,
          reason: 'No previous dayend record found',
          opening_balance: 0
        }
      });
    }

    // Check if opening_balance is NULL
    const openingBalance = Number(lastDayend.opening_balance || 0);

     const isRequired = openingBalance <= 0;

    res.json({
      success: true,
      data: {
        required: isRequired,
        reason: isRequired ? 'Opening balance is NULL' : 'Opening balance already set',
        opening_balance: lastDayend.opening_balance || lastDayend.closing_balance || 0,
        dayend_date: lastDayend.dayend_date,
        curr_date: lastDayend.curr_date
      }
    });
  } catch (error) {
    console.error('Error checking opening balance requirement:', error);
    res.status(500).json({ success: false, message: 'Failed to check opening balance requirement' });
  }
};
const saveOpeningBalance = async (req, res) => {
  try {
    const { opening_balance, outlet_id, hotel_id, user_id } = req.body;

    const validHotelId = Number(hotel_id);
    const validUserId = Number(user_id);

    if (!validHotelId || !validUserId || isNaN(validHotelId) || isNaN(validUserId)) {
      return res.status(400).json({
        success: false,
        message: 'hotel_id and user_id are required'
      });
    }

    let validOutletId = outlet_id ? Number(outlet_id) : null;
    if (isNaN(validOutletId)) {
      validOutletId = null;
    }

    console.log("=== SAVE OPENING BALANCE ONLY ===");

    // 🔎 Get latest record for this outlet/hotel
    // MySQL conversion: Changed dynamic query building for MySQL
    let query = `
      SELECT id FROM trn_dayend
      WHERE ${validOutletId ? 'outlet_id = ? AND' : ''} hotel_id = ?
      ORDER BY id DESC LIMIT 1
    `;
    
    const params = validOutletId ? [validOutletId, validHotelId] : [validHotelId];
    
    const [existingRows] = await db.query(query, params);
    const existingRecord = existingRows[0] || null;

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: 'No previous dayend record found'
      });
    }

    // ✅ ONLY update opening_balance
    // MySQL conversion: Changed from db.prepare().run() to await db.query()
    const [updateResult] = await db.query(`
      UPDATE trn_dayend
      SET opening_balance = ?
      WHERE id = ?
    `, [opening_balance || 0, existingRecord.id]);

    console.log("✅ Opening balance updated for ID:", existingRecord.id);

    return res.json({
      success: true,
      message: 'Opening balance updated successfully',
      data: {
        id: existingRecord.id,
        opening_balance: opening_balance || 0
      }
    });

  } catch (error) {
    console.error('Error saving opening balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save opening balance'
    });
  }
};


module.exports = {
  getDayendData,
  saveDayEndCashDenomination,
  saveDayEnd,
  getLatestCurrDate,
  getClosingBalance,
  checkOpeningBalanceRequired,
  saveOpeningBalance,
  generateDayEndReportHTML,
};
