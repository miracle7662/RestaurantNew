const db = require('../config/db')
const { formatMySQLDate } = require('../utils/dateUtils')

module.exports = {
  // ------------------------------------
  // 1️⃣ GET CUSTOMER LIST (Debtors) - Only those with Souda entries on specified date
  // ------------------------------------
  getCustomers: async (req, res) => {
    try {
      // console.log('getCustomers called with hotelid:', req.hotelid);
      const hotelid = req.hotelid;
      const date = req.query.date || 'now';

      const query = `
        SELECT DISTINCT
          m.LedgerId,
          m.LedgerNo,         
          m.Name,
          m.MarathiName,
          m.address,
          s.state_name AS state,
          c.city_name AS city,
          m.stateid,
          m.cityid,
          m.MobileNo,
          m.PhoneNo,
          m.GstNo,
          m.PanNo,
          m.OpeningBalance,
          m.OpeningBalanceDate,
          m.AccountTypeId,
          m.AccountType,
          m.Status,
          m.hotelid
        FROM AccountLedger m
        INNER JOIN soudaitemsdetails sid
          ON sid.LedgerNo = m.LedgerNo AND sid.hotelid = m.hotelid
        INNER JOIN soudaheader sh
          ON sh.SoudaID = sid.SoudaID AND sh.hotelid = sid.hotelid
        LEFT JOIN mststatemaster s
          ON s.stateid = CAST(m.stateid AS INTEGER)
        LEFT JOIN mstcitymaster c
          ON c.cityid = CAST(m.cityid AS INTEGER) AND c.stateId = s.stateid
        WHERE m.AccountType = 'SUNDRY DEBTORS(Customer)' 
          AND m.hotelid = ? 
          AND DATE(sh.SoudaDate) = DATE(?)
        ORDER BY m.Name DESC
      `;

       console.log('Executing query with params:', hotelid, date);
      const [rows] = await db.query(query, [hotelid, date]);
      console.log('Query returned', rows.length, 'rows');
      res.json(rows)
    } catch (error) {
       console.error('Error in getCustomers:', error)
      res.status(500).json({ error: error.message, stack: error.stack })
    }
  },

  // ------------------------------------
  // 2️⃣ GET FARMER LIST (Creditors)
  // ------------------------------------
  getFarmers: async (req, res) => {
    try {
      const hotelid = req.hotelid;

      const query = `
        SELECT
          m.LedgerId,
          m.LedgerNo,
          m.Name,
          m.MarathiName,
          m.address,
          s.state_name AS state,
          c.city_name AS city,
          m.stateid,
          m.cityid,
          m.MobileNo,
          m.PhoneNo,
          m.GstNo,
          m.PanNo,
          m.OpeningBalance,
          m.OpeningBalanceDate,
          m.AccountTypeId,
          m.AccountType,
          m.Status,
          m.hotelid
        FROM AccountLedger m
        LEFT JOIN mststatemaster s
          ON s.stateid = CAST(m.stateid AS INTEGER)
        LEFT JOIN mstcitymaster c
          ON c.cityid = CAST(m.cityid AS INTEGER) AND c.stateId = s.stateid
        WHERE m.AccountType ='SUNDRY CREDITORS(Supplier)' AND m.hotelid = ?
        ORDER BY m.Name DESC
      `;

      const [rows] = await db.query(query, [hotelid]);
      res.json(rows)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  // ------------------------------------
  // 3️⃣ GET LEDGER LIST (ALL)
  // ------------------------------------
  getLedger: async (req, res) => {
    try {
      if (!req.hotelid) {
        return res.status(400).json({
          error: 'hotelid missing (auth middleware not applied)'
        });
      }

      const hotelid = req.hotelid;

      // console.log('getLedger called with hotelid:', hotelid);

      const query = `
        SELECT
          m.LedgerId,
          m.LedgerNo,
          m.Name,
          m.MarathiName,
          m.address,
          s.state_name AS state,
          c.city_name AS city,
          m.stateid,
          m.cityid,
          m.MobileNo,
          m.PhoneNo,
          m.GstNo,
          m.PanNo,
          m.OpeningBalance,
          m.OpeningBalanceDate,
          m.AccountTypeId,
          m.AccountType,
          m.Status,
          m.hotelid
        FROM AccountLedger m
        LEFT JOIN mststatemaster s
          ON s.stateid = CAST(m.stateid AS UNSIGNED)
        LEFT JOIN mstcitymaster c
          ON c.cityid = CAST(m.cityid AS UNSIGNED) AND c.stateId = s.stateid
        WHERE m.hotelid = ?
        ORDER BY m.Name DESC
      `;

      const [rows] = await db.query(query, [hotelid]);
      res.json(rows);

    } catch (error) {
       console.error('Error in getLedger:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ------------------------------------
  // ADD, UPDATE, DELETE — common for all
  // ------------------------------------

  createLedger: async (req, res) => {
    try {
      const data = req.body

      const LedgerNo = parseInt(data.LedgerNo)
      const sanitizedLedgerNo = isNaN(LedgerNo) ? null : LedgerNo

      const OpeningBalance = parseFloat(data.OpeningBalance)
      const sanitizedOpeningBalance = isNaN(OpeningBalance) ? 0 : OpeningBalance

      let accountTypeName = data.AccountType
      if ((!accountTypeName || accountTypeName.trim() === '') && data.AccountTypeId) {
        try {
          const [row] = await db.query('SELECT AccName FROM accounttypedetails WHERE AccID = ? AND hotelid = ?', [data.AccountTypeId, req.hotelid])
          if (row && row[0] && row[0].AccName) {
            accountTypeName = row[0].AccName
          }
        } catch (err) {
           console.error('Failed to fetch account type name in createLedger:', err)
        }
      }

      const sanitizedAccountTypeId = data.AccountTypeId === '' ? null : parseInt(data.AccountTypeId) || null
      const sanitizedOpeningBalanceDate = data.OpeningBalanceDate === '' ? null : formatMySQLDate(data.OpeningBalanceDate)

      const query = `
        INSERT INTO AccountLedger
        (LedgerNo, Name, MarathiName, address, stateid, cityid, MobileNo, PhoneNo, GstNo, PanNo,
        OpeningBalance, OpeningBalanceDate, AccountTypeId, AccountType, Status, createdbyid, hotelid)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      const params = [
        sanitizedLedgerNo,
        data.Name,
        data.MarathiName,
        data.address,
        data.stateid,
        data.cityid,
        data.MobileNo,
        data.PhoneNo,
        data.GstNo,
        data.PanNo,
        sanitizedOpeningBalance,
        sanitizedOpeningBalanceDate,
        sanitizedAccountTypeId,
        accountTypeName,
        1,
        data.createdbyid || req.userid || 1,
        req.hotelid
      ]

      const result = await db.query(query, params)
      res.json({ success: true, id: result[0].insertId })
    } catch (err) {
      // console.error('Error in createLedger:', err, 'Received data:', req.body)
      res.status(500).json({ error: err.message })
    }
  },

  updateLedger: async (req, res) => {
    console.log('=== UPDATE LEDGER START ===');
    console.log('ID:', req.params.id);
    console.log('hotelid:', req.hotelid);
    console.log('BODY:', JSON.stringify(req.body, null, 2));
    
    try {
      const id = req.params.id
      const data = req.body

      const OpeningBalance = parseFloat(data.OpeningBalance)
      const sanitizedOpeningBalance = isNaN(OpeningBalance) ? 0 : OpeningBalance

      const sanitizedAccountTypeId = data.AccountTypeId === '' ? null : parseInt(data.AccountTypeId) || null
      const sanitizedOpeningBalanceDate = data.OpeningBalanceDate === '' ? null : formatMySQLDate(data.OpeningBalanceDate)

      let accountTypeName = data.AccountType
      if ((!accountTypeName || accountTypeName.trim() === '') && data.AccountTypeId) {
        try {
          const [row] = await db.query('SELECT AccName FROM accounttypedetails WHERE AccID = ? AND hotelid = ?', [data.AccountTypeId, req.hotelid])
          if (row && row[0] && row[0].AccName) {
            accountTypeName = row[0].AccName
          }
        } catch (err) {
          console.error('Failed to fetch account type name in updateLedger:', err)
        }
      }

      const [exists] = await db.query(`
        SELECT LedgerId
        FROM AccountLedger
        WHERE LedgerId = ? AND hotelid = ?
      `, [id, req.hotelid]);
      console.log('Exists check result:', exists);

      if (!exists || exists.length === 0) {
        console.log('❌ Ledger not found');
        return res.status(404).json({ error: 'Ledger not found or access denied' });
      }
      console.log('✅ Ledger exists');

      const query = `
        UPDATE AccountLedger SET
        LedgerNo = ?, Name = ?, MarathiName = ?, address = ?, stateid = ?, cityid = ?,
        MobileNo = ?, PhoneNo = ?, GstNo = ?, PanNo = ?, OpeningBalance = ?, OpeningBalanceDate = ?,
        AccountTypeId = ?, AccountType = ?, Status = ?, updated_date = ?, updatedbyid = ?, hotelid = ?
        WHERE LedgerId = ? AND hotelid = ?
      `

      const updated_date = formatMySQLDate(data.updated_date || new Date())
      const params = [
        data.LedgerNo,
        data.Name,
        data.MarathiName,
        data.address,
        data.stateid,
        data.cityid,
        data.MobileNo,
        data.PhoneNo,
        data.GstNo,
        data.PanNo,
        sanitizedOpeningBalance,
        sanitizedOpeningBalanceDate,
        sanitizedAccountTypeId,
        accountTypeName,
        data.Status !== undefined ? data.Status : 1,
        updated_date,
        data.updatedbyid || req.userid || 1,
        req.hotelid,
        id,
        req.hotelid,
      ]

      const result = await db.query(query, params)
      console.log('Query result:', result);
      console.log('Affected rows:', result[0].affectedRows);
      console.log('=== UPDATE LEDGER END ===');
      res.json({ success: true, changes: result[0].affectedRows })
    } catch (err) {
      console.error('❌ UPDATE LEDGER ERROR:', err);
      console.error('Full error:', err.message);
      console.error('Stack:', err.stack);
      res.status(500).json({ error: err.message })
    }
  },

  deleteLedger: async (req, res) => {
    try {
      const id = req.params.id
      const hotelid = req.hotelid;

      const [existsResult] = await db.query(`
        SELECT LedgerId 
        FROM AccountLedger 
        WHERE LedgerId = ? AND hotelid = ?
      `, [id, hotelid]);

      if (!existsResult || existsResult.length === 0) {
        return res.status(404).json({ error: 'Ledger not found or access denied' });
      }

      await db.query('DELETE FROM AccountLedger WHERE LedgerId = ? AND hotelid = ?', [id, hotelid])
      res.json({ success: true })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  // ------------------------------------
  // 4️⃣ TEST DB CONNECTION
  // ------------------------------------
  testDbConnection: async (req, res) => {
    try {
      await db.query('SELECT 1')
      res.json({ success: true, message: 'Database connection is OK!' })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  },

  getCashBankLedgers: async (req, res) => {
    try {
      const hotelid = req.hotelid;

      const query = `
        SELECT LedgerId, Name 
        FROM AccountLedger 
        WHERE AccountTypeId IN ('17', '18') AND hotelid = ?
        ORDER BY Name DESC
      `

      const [rows] = await db.query(query, [hotelid]);
      res.json(rows)
    } catch (error) {
      // console.error('Error in getCashBankLedgers:', error)
      res.status(500).json({ error: error.message })
    }
  },

  // ------------------------------------
  // GET Opposite Bank Ledger List with Label Formatting
  // ------------------------------------

  getOppBankList: async (req, res) => {
    try {
      const hotelid = req.hotelid;

      const query = `
        SELECT LedgerId, LedgerNo, Name, AccountType
        FROM AccountLedger
        WHERE hotelid = ?
        ORDER BY Name ASC
      `

      const [rows] = await db.query(query, [hotelid]);
      res.json(rows)
    } catch (error) {
      // console.error('Error in getOppBankList:', error)
      res.status(500).json({ error: error.message })
    }
  },

   // ------------------------------------
  // GET CUSTOMER BY CUSTOMER NO
  // ------------------------------------

  getCustomerByNo: async (req, res) => {
    try {
      const customerNo = req.params.customerNo
      const hotelid = req.hotelid;

      const query = `
        SELECT
          m.LedgerId,
          m.LedgerNo,        
          m.Name,
          m.MarathiName,
          m.address,
          s.state_name AS state,
          c.city_name AS city,
          m.stateid,
          m.cityid,
          m.MobileNo,
          m.PhoneNo,
          m.GstNo,
          m.PanNo,
          m.OpeningBalance,
          m.OpeningBalanceDate,
          m.AccountTypeId,
          m.AccountType,
          m.Status,
         h.hotelid
        FROM AccountLedger m
        INNER JOIN msthotelmasters h
          ON h.hotelid = m.hotelid
        INNER JOIN mststatemaster s
          ON s.stateid = CAST(m.stateid AS INTEGER)
        INNER JOIN mstcitymaster c
          ON c.cityid = CAST(m.cityid AS INTEGER)
        WHERE m.AccountType = 'SUNDRY DEBTORS(Customer)' 
          AND h.hotelid = ?
      `;

      const [rows] = await db.query(query, [hotelid]);
      if (rows.length > 0) {
        res.json(rows[0])
      } else {
        res.status(404).json({ error: 'Customer not found' })
      }
    } catch (error) {
      // console.error('Error in getCustomerByNo:', error)
      res.status(500).json({ error: error.message })
    }
  },

   // ------------------------------------
  // GET FARMER BY LEDGER ID
  // ------------------------------------

  getFarmerByNo: async (req, res) => {
    try {
      const ledgerId = req.params.farmerNo
      const hotelid = req.hotelid;

      const query = `
        SELECT
          m.LedgerId,
          m.LedgerNo,
          m.Name,
          m.MarathiName,
          m.address,
          s.state_name AS state,
          c.city_name AS city,
          m.stateid,
          m.cityid,
          m.MobileNo,
          m.PhoneNo,
          m.GstNo,
          m.PanNo,
          m.OpeningBalance,
          m.OpeningBalanceDate,
          m.AccountTypeId,
          m.AccountType,
          m.Status,
          m.hotelid
        FROM AccountLedger m
        INNER JOIN mststatemaster s
          ON s.stateid = CAST(m.stateid AS INTEGER)
        INNER JOIN mstcitymaster c
          ON c.cityid = CAST(m.cityid AS INTEGER)
        WHERE m.LedgerId = ? 
          AND m.AccountType = 'SUNDRY CREDITORS(Supplier)' 
          AND m.hotelid = ?
      `;

      const [rows] = await db.query(query, [ledgerId, hotelid]);
      if (rows.length > 0) {
        res.json(rows[0])
      } else {
        res.status(404).json({ error: 'Farmer not found' })
      }
    } catch (error) {
      // console.error('Error in getFarmerByNo:', error)
      res.status(500).json({ error: error.message })
    }
  },

  getsodacustomer: async (req, res) => {
    try {
      const hotelid = req.hotelid;

      const query = `
        SELECT
          m.LedgerId,
          m.LedgerNo,
          m.CustomerNo,
          m.FarmerNo,
          m.Name,
          m.MarathiName,
          m.address,
          s.state_name AS state,
          c.city_name AS city,
          m.stateid,
          m.cityid,
          m.MobileNo,
          m.PhoneNo,
          m.GstNo,
          m.PanNo,
          m.OpeningBalance,
          m.OpeningBalanceDate,
          m.AccountTypeId,
          m.AccountType,
          m.Status,
          m.hotelid
        FROM AccountLedger m
        LEFT JOIN mststatemaster s
          ON s.stateid = CAST(m.stateid AS INTEGER)
        LEFT JOIN mstcitymaster c
          ON c.cityid = CAST(m.cityid AS INTEGER) AND c.stateId = s.stateid
        WHERE m.AccountType = 'SUNDRY DEBTORS(Customer)'
          AND m.hotelid = ?
        ORDER BY m.Name DESC
      `;

      const [rows] = await db.query(query, [hotelid]);
      res.json(rows);
    } catch (error) {
      // console.error('Error in getsodacustomer:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ------------------------------------
  // GET OUTSTANDING CUSTOMERS AND FARMERS
  // ------------------------------------
  getOutstandingCustomersAndFarmers: async (req, res) => {
    try {
      const hotelid = req.hotelid;
      const cutoffDate = req.query.cutoffDate || '2025-12-12';

      const query = `
SELECT
    m.LedgerId,
    m.Name,
    m.AccountType,
    (
        CASE
            WHEN m.AccountType = 'SUNDRY DEBTORS(Customer)' THEN
                COALESCE(m.OpeningBalance, 0)
                + COALESCE(
                    (SELECT SUM(cb.FinalBillAmount)
                     FROM customerbillheader cb
                     WHERE cb.CustomerID = m.LedgerId
                       AND cb.hotelid = ?
                       AND DATE(cb.custBillDate) <= DATE(?)
                    ), 0
                )
                + COALESCE(
                    (SELECT SUM(c.Amount)
                     FROM CashBook c
                     WHERE (c.CashBankID = m.LedgerId OR c.OppBankID = m.LedgerId)
                       AND c.TransactionType = 'Payment'
                       AND c.hotelid = ?
                       AND DATE(c.TransactionDate) <= DATE(?)
                    ), 0
                )
                - COALESCE(
                    (SELECT SUM(c.Amount)
                     FROM CashBook c
                     WHERE (c.CashBankID = m.LedgerId OR c.OppBankID = m.LedgerId)
                       AND c.TransactionType = 'Receipt'
                       AND c.hotelid = ?
                       AND DATE(c.TransactionDate) <= DATE(?)
                    ), 0
                )

            WHEN m.AccountType = 'SUNDRY CREDITORS(Supplier)' THEN
                COALESCE(m.OpeningBalance, 0)
                + COALESCE(
                    (SELECT SUM(fb.FinalBillAmount)
                     FROM FarmerBill fb
                     WHERE fb.FarmerID = m.FarmerNo
                       AND fb.hotelid = ?
                       AND DATE(fb.farBillDate) <= DATE(?)
                    ), 0
                )
                + COALESCE(
                    (SELECT SUM(c.Amount)
                     FROM CashBook c
                     WHERE (c.CashBankID = m.LedgerId OR c.OppBankID = m.LedgerId)
                       AND c.TransactionType = 'Receipt'
                       AND c.hotelid = ?
                       AND DATE(c.TransactionDate) <= DATE(?)
                    ), 0
                )
                - COALESCE(
                    (SELECT SUM(c.Amount)
                     FROM CashBook c
                     WHERE (c.CashBankID = m.LedgerId OR c.OppBankID = m.LedgerId)
                       AND c.TransactionType = 'Payment'
                       AND c.hotelid = ?
                       AND DATE(c.TransactionDate) <= DATE(?)
                    ), 0
                )

            ELSE 0
        END
    ) AS Balance,
    COALESCE(
        (SELECT MAX(fb.farBillDate)
         FROM FarmerBill fb
         WHERE fb.FarmerID = m.FarmerNo
           AND fb.hotelid = ?
        ),
        (SELECT MAX(cb.custBillDate)
         FROM customerbillheader cb
         WHERE cb.CustomerID = m.LedgerId
           AND cb.hotelid = ?
        )
    ) AS LastBillDate,

    COALESCE(
        DATEDIFF(?, 
            COALESCE(
                (SELECT MAX(fb.farBillDate)
                 FROM FarmerBill fb
                 WHERE fb.FarmerID = m.FarmerNo
                   AND fb.hotelid = ?
                ),
                (SELECT MAX(cb.custBillDate)
                 FROM customerbillheader cb
                 WHERE cb.CustomerID = m.LedgerId
                   AND cb.hotelid = ?
                )
            )
        ),
        0
    ) AS LastBillDaysCount

FROM AccountLedger m
WHERE m.hotelid = ?
  AND (
        CASE
            WHEN m.AccountType = 'SUNDRY DEBTORS(Customer)' THEN
                COALESCE(m.OpeningBalance, 0)
                + COALESCE(
                    (SELECT SUM(cb.FinalBillAmount)
                     FROM customerbillheader cb
                     WHERE cb.CustomerID = m.LedgerId
                       AND cb.hotelid = ?
                       AND DATE(cb.custBillDate) <= DATE(?)
                    ), 0
                )
                + COALESCE(
                    (SELECT SUM(c.Amount)
                     FROM CashBook c
                     WHERE (c.CashBankID = m.LedgerId OR c.OppBankID = m.LedgerId)
                       AND c.TransactionType = 'Payment'
                       AND c.hotelid = ?
                       AND DATE(c.TransactionDate) <= DATE(?)
                    ), 0
                )
                - COALESCE(
                    (SELECT SUM(c.Amount)
                     FROM CashBook c
                     WHERE (c.CashBankID = m.LedgerId OR c.OppBankID = m.LedgerId)
                       AND c.TransactionType = 'Receipt'
                       AND c.hotelid = ?
                       AND DATE(c.TransactionDate) <= DATE(?)
                    ), 0
                )

            WHEN m.AccountType = 'SUNDRY CREDITORS(Supplier)' THEN
                COALESCE(m.OpeningBalance, 0)
                + COALESCE(
                    (SELECT SUM(fb.FinalBillAmount)
                     FROM FarmerBill fb
                     WHERE fb.FarmerID = m.FarmerNo
                       AND fb.hotelid = ?
                       AND DATE(fb.farBillDate) <= DATE(?)
                    ), 0
                )
                + COALESCE(
                    (SELECT SUM(c.Amount)
                     FROM CashBook c
                     WHERE (c.CashBankID = m.LedgerId OR c.OppBankID = m.LedgerId)
                       AND c.TransactionType = 'Receipt'
                       AND c.hotelid = ?
                       AND DATE(c.TransactionDate) <= DATE(?)
                    ), 0
                )
                - COALESCE(
                    (SELECT SUM(c.Amount)
                     FROM CashBook c
                     WHERE (c.CashBankID = m.LedgerId OR c.OppBankID = m.LedgerId)
                       AND c.TransactionType = 'Payment'
                       AND c.hotelid = ?
                       AND DATE(c.TransactionDate) <= DATE(?)
                    ), 0
                )
            ELSE 0
        END
  ) != 0
ORDER BY m.Name DESC
      `;

      const params = Array(46).fill(hotelid).flatMap((h, i) => i % 2 === 0 ? [h, cutoffDate] : []);

      const [rows] = await db.query(query, params);
      res.json(rows);
    } catch (error) {
      // console.error('Error in getOutstandingCustomersAndFarmers:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ------------------------------------
  // GET NEXT LEDGER NO
  // ------------------------------------
  getNextLedgerNo: async (req, res) => {
    try {
      const hotelid = req.hotelid;

      const query = `
        SELECT MAX(LedgerNo) as maxLedgerNo
        FROM AccountLedger
        WHERE hotelid = ?
      `;

      const [row] = await db.query(query, [hotelid]);
      const nextLedgerNo = (row[0].maxLedgerNo || 0) + 1;

      res.json({ nextLedgerNo });
    } catch (error) {
      // console.error('Error in getNextLedgerNo:', error);
      res.status(500).json({ error: error.message });
    }
  },
}

