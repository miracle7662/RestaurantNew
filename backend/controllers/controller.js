const db = require('../config/db')

// Utility: standard success response
function ok(message, data) {
  return { success: true, message, data }
}

// Utility: standard error response (thrown to be caught by catch)
function fail(message, error) {
  const err = new Error(message)
  err.original = error
  throw err
}

// Map nullable/boolean/number safely
function toBool(value) {
  return value ? 1 : 0
}

// 1) getAllBills → fetch all bills with their details (no settlement)
exports.getAllBills = async (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        b.*,
        GROUP_CONCAT(
          DISTINCT json_object(
            'TXnDetailID', d.TXnDetailID,
            'ItemID', d.ItemID,
            'Qty', d.Qty,
            'AutoKOT', d.AutoKOT,
            'ManualKOT', d.ManualKOT,
            'SpecialInst', d.SpecialInst,
            'isKOTGenerate', d.isKOTGenerate,
            'isSetteled', d.isSetteled,
            'TableID', d.TableID,
            'isNCKOT', d.isNCKOT,
            'isCancelled', d.isCancelled,
            'DeptID', d.DeptID,
            'HotelID', d.HotelID,
            'RuntimeRate', d.RuntimeRate,
            'RevQty', d.RevQty,
            'KOTUsedDate', d.KOTUsedDate
          )
        ) as _details
      FROM TAxnTrnbill b
      LEFT JOIN TAxnTrnbilldetails d ON d.TxnID = b.TxnID AND d.isCancelled = 0
      WHERE b.isCancelled = 0
      GROUP BY b.TxnID
      ORDER BY b.TxnDatetime DESC
    `).all()

    const data = rows.map(r => ({
      ...r,
      details: r._details ? JSON.parse(`[${r._details}]`) : [],
    }))
    res.json(ok('Fetched all bills', data))
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bills', data: null, error: error.message })
  }
}

// 2) getBillById(TxnID) → header + details, include settlement if available
exports.getBillById = async (req, res) => {
  try {
    const { id } = req.params
    const bill = db.prepare(`SELECT * FROM TAxnTrnbill WHERE TxnID = ?`).get(Number(id))
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found', data: null })

    const details = db.prepare(`
      SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? AND isCancelled = 0 ORDER BY TXnDetailID ASC
    `).all(Number(id))

    // Settlement linked via OrderNo + HotelID (TrnSettlement has no TxnID)
    const settlements = db.prepare(`
      SELECT * FROM TrnSettlement WHERE OrderNo = ? AND (HotelID = ? OR ? IS NULL)
    `).all(bill.orderNo || null, bill.HotelID || null, bill.HotelID || null)

    const data = { ...bill, details, settlement: settlements }
    res.json(ok('Fetched bill', data))
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bill', data: null, error: error.message })
  }
}

// 3) createBill → insert new bill + multiple details (no settlement)
exports.createBill = async (req, res) => {
  try {
    const {
      // Header
      TxnNo, TableID, Steward, PAX, AutoKOT, ManualKOT, TxnDatetime,
      GrossAmt, RevKOT, Discount, CGST, SGST, CESS, RoundOFF, Amount,
      isHomeDelivery, DriverID, CustomerName, MobileNo, Address, Landmark,
      orderNo, isPickup, HotelID, GuestID, DiscRefID, DiscPer, UserId,
      BatchNo, PrevTableID, PrevDeptId, isTrnsfered, isChangeTrfAmt,
      Extra1, Extra2, Extra3,
      // Details array
      details = []
    } = req.body

    const trx = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO TAxnTrnbill (
          TxnNo, TableID, Steward, PAX, AutoKOT, ManualKOT, TxnDatetime,
          GrossAmt, RevKOT, Discount, CGST, SGST, CESS, RoundOFF, Amount,
          isHomeDelivery, DriverID, CustomerName, MobileNo, Address, Landmark,
          orderNo, isPickup, HotelID, GuestID, DiscRefID, DiscPer, UserId,
          BatchNo, PrevTableID, PrevDeptId, isTrnsfered, isChangeTrfAmt,
          Extra1, Extra2, Extra3
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `)

      const result = stmt.run(
        TxnNo || null,
        TableID ?? null,
        Steward || null,
        PAX ?? null,
        toBool(AutoKOT),
        toBool(ManualKOT),
        TxnDatetime || null,
        Number(GrossAmt) || 0,
        toBool(RevKOT),
        Number(Discount) || 0,
        Number(CGST) || 0,
        Number(SGST) || 0,
        Number(CESS) || 0,
        Number(RoundOFF) || 0,
        Number(Amount) || 0,
        toBool(isHomeDelivery),
        DriverID ?? null,
        CustomerName || null,
        MobileNo || null,
        Address || null,
        Landmark || null,
        orderNo || null,
        toBool(isPickup),
        HotelID ?? null,
        GuestID ?? null,
        DiscRefID ?? null,
        Number(DiscPer) || 0,
        UserId ?? null,
        BatchNo || null,
        PrevTableID ?? null,
        PrevDeptId ?? null,
        toBool(isTrnsfered),
        toBool(isChangeTrfAmt),
        Extra1 || null,
        Extra2 || null,
        Extra3 || null
      )

      const txnId = result.lastInsertRowid

      if (Array.isArray(details) && details.length > 0) {
        const dStmt = db.prepare(`
          INSERT INTO TAxnTrnbilldetails (
            TxnID, ItemID, Qty, AutoKOT, ManualKOT, SpecialInst,
            isKOTGenerate, isSetteled, TableID, isNCKOT, isCancelled,
            DeptID, HotelID, RuntimeRate, RevQty, KOTUsedDate
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `)

        for (const d of details) {
          dStmt.run(
            txnId,
            d.ItemID ?? null,
            Number(d.Qty) || 0,
            toBool(d.AutoKOT),
            toBool(d.ManualKOT),
            d.SpecialInst || null,
            toBool(d.isKOTGenerate),
            toBool(d.isSetteled),
            d.TableID ?? null,
            toBool(d.isNCKOT),
            toBool(d.isCancelled),
            d.DeptID ?? null,
            d.HotelID ?? null,
            Number(d.RuntimeRate) || 0,
            Number(d.RevQty) || 0,
            d.KOTUsedDate || null
          )
        }
      }

      return txnId
    })

    const txnId = trx()
    const header = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(txnId)
    const items = db.prepare('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? ORDER BY TXnDetailID').all(txnId)
    res.json(ok('Bill created', { ...header, details: items }))
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create bill', data: null, error: error.message })
  }
}

// 4) updateBill → update header + details (no settlement)
exports.updateBill = async (req, res) => {
  try {
    const { id } = req.params
    const {
      // Header fields (same as create where applicable)
      TxnNo, TableID, Steward, PAX, AutoKOT, ManualKOT, TxnDatetime,
      GrossAmt, RevKOT, Discount, CGST, SGST, CESS, RoundOFF, Amount,
      isHomeDelivery, DriverID, CustomerName, MobileNo, Address, Landmark,
      orderNo, isPickup, HotelID, GuestID, DiscRefID, DiscPer, UserId,
      BatchNo, PrevTableID, PrevDeptId, isTrnsfered, isChangeTrfAmt,
      Extra1, Extra2, Extra3,
      // Details array to REPLACE existing
      details = []
    } = req.body

    const txn = db.transaction(() => {
      const u = db.prepare(`
        UPDATE TAxnTrnbill SET
          TxnNo=?, TableID=?, Steward=?, PAX=?, AutoKOT=?, ManualKOT=?, TxnDatetime=?,
          GrossAmt=?, RevKOT=?, Discount=?, CGST=?, SGST=?, CESS=?, RoundOFF=?, Amount=?,
          isHomeDelivery=?, DriverID=?, CustomerName=?, MobileNo=?, Address=?, Landmark=?,
          orderNo=?, isPickup=?, HotelID=?, GuestID=?, DiscRefID=?, DiscPer=?, UserId=?,
          BatchNo=?, PrevTableID=?, PrevDeptId=?, isTrnsfered=?, isChangeTrfAmt=?,
          Extra1=?, Extra2=?, Extra3=?
        WHERE TxnID=?
      `)

      u.run(
        TxnNo || null,
        TableID ?? null,
        Steward || null,
        PAX ?? null,
        toBool(AutoKOT),
        toBool(ManualKOT),
        TxnDatetime || null,
        Number(GrossAmt) || 0,
        toBool(RevKOT),
        Number(Discount) || 0,
        Number(CGST) || 0,
        Number(SGST) || 0,
        Number(CESS) || 0,
        Number(RoundOFF) || 0,
        Number(Amount) || 0,
        toBool(isHomeDelivery),
        DriverID ?? null,
        CustomerName || null,
        MobileNo || null,
        Address || null,
        Landmark || null,
        orderNo || null,
        toBool(isPickup),
        HotelID ?? null,
        GuestID ?? null,
        DiscRefID ?? null,
        Number(DiscPer) || 0,
        UserId ?? null,
        BatchNo || null,
        PrevTableID ?? null,
        PrevDeptId ?? null,
        toBool(isTrnsfered),
        toBool(isChangeTrfAmt),
        Extra1 || null,
        Extra2 || null,
        Extra3 || null,
        Number(id)
      )

      // Replace details: delete then insert
      db.prepare('DELETE FROM TAxnTrnbilldetails WHERE TxnID = ?').run(Number(id))

      if (Array.isArray(details) && details.length > 0) {
        const ins = db.prepare(`
          INSERT INTO TAxnTrnbilldetails (
            TxnID, ItemID, Qty, AutoKOT, ManualKOT, SpecialInst,
            isKOTGenerate, isSetteled, TableID, isNCKOT, isCancelled,
            DeptID, HotelID, RuntimeRate, RevQty, KOTUsedDate
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `)
        for (const d of details) {
          ins.run(
            Number(id),
            d.ItemID ?? null,
            Number(d.Qty) || 0,
            toBool(d.AutoKOT),
            toBool(d.ManualKOT),
            d.SpecialInst || null,
            toBool(d.isKOTGenerate),
            toBool(d.isSetteled),
            d.TableID ?? null,
            toBool(d.isNCKOT),
            toBool(d.isCancelled),
            d.DeptID ?? null,
            d.HotelID ?? null,
            Number(d.RuntimeRate) || 0,
            Number(d.RevQty) || 0,
            d.KOTUsedDate || null
          )
        }
      }
    })

    txn()
    const header = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(Number(id))
    const items = db.prepare('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? ORDER BY TXnDetailID').all(Number(id))
    res.json(ok('Bill updated', { ...header, details: items }))
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update bill', data: null, error: error.message })
  }
}

// 5) deleteBill → delete bill by TxnID (explicitly remove details to avoid FK pragma issues)
exports.deleteBill = async (req, res) => {
  try {
    const { id } = req.params
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM TAxnTrnbilldetails WHERE TxnID = ?').run(Number(id))
      const r = db.prepare('DELETE FROM TAxnTrnbill WHERE TxnID = ?').run(Number(id))
      return r.changes > 0
    })
    const success = tx()
    res.json(success ? ok('Bill deleted', { id: Number(id) }) : { success: false, message: 'Bill not found', data: null })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete bill', data: null, error: error.message })
  }
}

// 6) settleBill → insert into TrnSettlement, update isSetteled = 1 (supports multiple payment modes)
exports.settleBill = async (req, res) => {
  try {
    const { id } = req.params
    const { settlements = [] } = req.body // [{ PaymentTypeID, PaymentType, Amount, Batch, Name, OrderNo, HotelID, Name2, Name3 }]

    if (!Array.isArray(settlements) || settlements.length === 0) {
      return res.status(400).json({ success: false, message: 'settlements array is required', data: null })
    }

    const bill = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(Number(id))
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found', data: null })

    const tx = db.transaction(() => {
      // Insert settlements
      const ins = db.prepare(`
        INSERT INTO TrnSettlement (
          PaymentTypeID, PaymentType, Amount, Batch, Name, OrderNo, HotelID, Name2, Name3
        ) VALUES (?,?,?,?,?,?,?,?,?)
      `)
      for (const s of settlements) {
        ins.run(
          s.PaymentTypeID ?? null,
          s.PaymentType || null,
          Number(s.Amount) || 0,
          s.Batch || null,
          s.Name || null,
          s.OrderNo || bill.orderNo || null,
          s.HotelID ?? bill.HotelID ?? null,
          s.Name2 || null,
          s.Name3 || null
        )
      }

      // Mark bill + details settled
      db.prepare(`UPDATE TAxnTrnbill SET isSetteled = 1, isBilled = 1, BilledDate = CURRENT_TIMESTAMP WHERE TxnID = ?`).run(Number(id))
      db.prepare(`UPDATE TAxnTrnbilldetails SET isSetteled = 1 WHERE TxnID = ?`).run(Number(id))
    })

    tx()

    // Return nested object including settlements
    const header = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(Number(id))
    const items = db.prepare('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? ORDER BY TXnDetailID').all(Number(id))
    const stl = db.prepare('SELECT * FROM TrnSettlement WHERE OrderNo = ? AND (HotelID = ? OR ? IS NULL) ORDER BY SettlementID').all(header.orderNo || null, header.HotelID || null, header.HotelID || null)
    res.json(ok('Bill settled', { ...header, details: items, settlement: stl }))
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to settle bill', data: null, error: error.message })
  }
}

module.exports = exports


