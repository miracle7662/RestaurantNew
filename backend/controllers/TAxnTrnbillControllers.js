const db = require('../config/db')

// Utility: standard success response
function ok(message, data) {
  return { success: true, message, data }
}

function toBool(value) {
  return value ? 1 : 0
}


/* -------------------------------------------------------------------------- */
/* 1) getAllBills → fetch all bills with details (no settlement)              */
/* -------------------------------------------------------------------------- */
exports.getAllBills = async (req, res) => {
  try {
    const { isBilled, tableId } = req.query; // get filters from query

    let whereClauses = ['b.isCancelled = 0'];
    const params = [];

    if (isBilled !== undefined) {
      whereClauses.push('b.isBilled = ?');
      params.push(Number(isBilled));
    }

    if (tableId !== undefined) {
      whereClauses.push('b.TableID = ?');
      params.push(Number(tableId));
    }

    const sql = `
      SELECT 
        b.*,
        GROUP_CONCAT(
          DISTINCT json_object(
            'TXnDetailID', d.TXnDetailID,
            'outletid', d.outletid,
            'ItemID', d.ItemID,
            'TableID', d.TableID,
            'Qty', d.Qty,
            'CGST', d.CGST,
            'CGST_AMOUNT', d.CGST_AMOUNT,
            'SGST', d.SGST,
            'SGST_AMOUNT', d.SGST_AMOUNT,
            'IGST', d.IGST,
            'IGST_AMOUNT', d.IGST_AMOUNT,
            'CESS', d.CESS,
            'CESS_AMOUNT', d.CESS_AMOUNT,
            'AutoKOT', d.AutoKOT,
            'ManualKOT', d.ManualKOT,
            'SpecialInst', d.SpecialInst,
            'isKOTGenerate', d.isKOTGenerate,
            'isSetteled', d.isSetteled,
            'isNCKOT', d.isNCKOT,
            'isCancelled', d.isCancelled,
            'DeptID', d.DeptID,
            'HotelID', d.HotelID,
            'RuntimeRate', d.RuntimeRate,
            'RevQty', d.RevQty,
            'KOTUsedDate', d.KOTUsedDate,
            'isBilled', d.isBilled,
          )
        ) as _details
      FROM TAxnTrnbill b
      LEFT JOIN TAxnTrnbilldetails d 
        ON d.TxnID = b.TxnID AND d.isCancelled = 0
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY b.TxnID
      ORDER BY b.TxnDatetime DESC
    `;

    const rows = db.prepare(sql).all(...params);

    const data = rows.map(r => ({
      ...r,
      details: r._details ? JSON.parse(`[${r._details}]`) : [],
    }))
    res.json(ok('Fetched all bills', data))
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bills', data: null, error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* 2) getBillById → header + details + settlements                            */
/* -------------------------------------------------------------------------- */
exports.getBillById = async (req, res) => {
  try {
    const { id } = req.params
    const bill = db.prepare(`SELECT * FROM TAxnTrnbill WHERE TxnID = ?`).get(Number(id))
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found', data: null })

    const details = db.prepare(`
      SELECT * FROM TAxnTrnbilldetails 
      WHERE TxnID = ? AND isCancelled = 0 
      ORDER BY TXnDetailID ASC
    `).all(Number(id))

    const settlements = db.prepare(`
      SELECT * FROM TrnSettlement 
      WHERE OrderNo = ? AND HotelID = ?
      ORDER BY SettlementID
    `).all(bill.orderNo || null, bill.HotelID || null)

    res.json(ok('Fetched bill', { ...bill, details, settlement: settlements }))
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bill', data: null, error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* 3) createBill → insert new bill + details                                  */
/* -------------------------------------------------------------------------- */
exports.createBill = async (req, res) => {
  try {
    console.log('Received createBill body:', JSON.stringify(req.body, null, 2));
    const {
      outletid, TxnNo, TableID, Steward, PAX, AutoKOT, ManualKOT, TxnDatetime,
      GrossAmt, RevKOT, Discount, CGST, SGST, IGST, CESS, RoundOFF, Amount,
      isHomeDelivery, DriverID, CustomerName, MobileNo, Address, Landmark,
      orderNo, isPickup, HotelID, GuestID, DiscRefID, DiscPer, DiscountType, UserId,
      BatchNo, PrevTableID, PrevDeptId, isTrnsfered, isChangeTrfAmt,
      ServiceCharge, ServiceCharge_Amount, Extra1, Extra2, Extra3,
      NCName, NCPurpose,
      details = []
    } = req.body

    console.log('Details array length:', details.length);
    if (details.length > 0) {
      console.log('First detail item:', JSON.stringify(details[0], null, 2));
    }

    console.log('NCName:', NCName);
    console.log('NCPurpose:', NCPurpose);

    // Compute header totals from details if missing/zero
    const isArray = Array.isArray(details) && details.length > 0
    let computedGross = 0, computedCgstAmt = 0, computedSgstAmt = 0, computedIgstAmt = 0, computedCessAmt = 0
    if (isArray) {
      for (const d of details) {
        const qty = Number(d.Qty) || 0
        const rate = Number(d.RuntimeRate) || 0
        const lineSubtotal = qty * rate
        const cgstPer = Number(d.CGST) || 0
        const sgstPer = Number(d.SGST) || 0
        const igstPer = Number(d.IGST) || 0
        const cessPer = Number(d.CESS) || 0
        const cgstAmt = Number(d.CGST_AMOUNT) || (lineSubtotal * cgstPer) / 100
        const sgstAmt = Number(d.SGST_AMOUNT) || (lineSubtotal * sgstPer) / 100
        const igstAmt = Number(d.IGST_AMOUNT) || (lineSubtotal * igstPer) / 100
        const cessAmt = Number(d.CESS_AMOUNT) || (lineSubtotal * cessPer) / 100
        computedGross += lineSubtotal
        computedCgstAmt += cgstAmt
        computedSgstAmt += sgstAmt
        computedIgstAmt += igstAmt
        computedCessAmt += cessAmt
      }
    }

    const headerGross = Number(GrossAmt) || 0
    const headerCgst = Number(CGST) || 0
    const headerSgst = Number(SGST) || 0
    const headerIgst = Number(IGST) || 0
    const headerCess = Number(CESS) || 0
    const headerRound = Number(RoundOFF) || 0
    const headerAmount = Number(Amount) || 0

    const finalGross = (isArray && headerGross === 0) ? computedGross : headerGross
    const finalCgst = (isArray && headerCgst === 0) ? computedCgstAmt : headerCgst
    const finalSgst = (isArray && headerSgst === 0) ? computedSgstAmt : headerSgst
    const finalIgst = (isArray && headerIgst === 0) ? computedIgstAmt : headerIgst
    const finalCess = (isArray && headerCess === 0) ? computedCessAmt : headerCess
    const finalAmount = (isArray && headerAmount === 0)
      ? (finalGross + finalCgst + finalSgst + finalIgst + finalCess + headerRound)
      : headerAmount

    const trx = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO TAxnTrnbill (
          outletid, TxnNo, TableID, Steward, PAX, AutoKOT, ManualKOT, TxnDatetime,
          GrossAmt, RevKOT, Discount, CGST, SGST, IGST, CESS, RoundOFF, Amount,
          isHomeDelivery, DriverID, CustomerName, MobileNo, Address, Landmark,
          orderNo, isPickup, HotelID, GuestID, DiscRefID, DiscPer, DiscountType, UserId,
      BatchNo, PrevTableID, PrevDeptId, isTrnsfered, isChangeTrfAmt,
      ServiceCharge, ServiceCharge_Amount, Extra1, Extra2, Extra3, NCName, NCPurpose
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `)

    const result = stmt.run(
      outletid ?? null,
      TxnNo || null,
      TableID ?? null,
      Steward || null,
      PAX ?? null,
      toBool(AutoKOT),
      toBool(ManualKOT),
      TxnDatetime || null,
      Number(finalGross) || 0,
      toBool(RevKOT),
      Number(Discount) || 0,
      Number(finalCgst) || 0,
      Number(finalSgst) || 0,
      Number(finalIgst) || 0,
      Number(finalCess) || 0,
      Number(headerRound) || 0,
      Number(finalAmount) || 0,
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
      Number(DiscountType) || 0,
      UserId ?? null,
      BatchNo ?? null,
      PrevTableID ?? null,
      PrevDeptId ?? null,
      toBool(isTrnsfered),
      toBool(isChangeTrfAmt),
      Number(ServiceCharge) || 0,
      Number(ServiceCharge_Amount) || 0,
      Extra1 || null,
      Extra2 || null,
      Extra3 || null,
      NCName || null,
      NCPurpose || null
    )

      const txnId = result.lastInsertRowid

      if (isArray) {
        const dStmt = db.prepare(`
          INSERT INTO TAxnTrnbilldetails (
            TxnID, outletid, ItemID, TableID,
            CGST, CGST_AMOUNT, SGST, SGST_AMOUNT, IGST, IGST_AMOUNT,
            CESS, CESS_AMOUNT, Qty, AutoKOT, ManualKOT, SpecialInst,
            isKOTGenerate, isSetteled, isNCKOT, isCancelled,
            DeptID, HotelID, RuntimeRate, RevQty, KOTUsedDate,
            isBilled
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `)

        for (const d of details) {
          const qty = Number(d.Qty) || 0
          const rate = Number(d.RuntimeRate) || 0
          const lineSubtotal = qty * rate
          const cgstPer = Number(d.CGST) || 0
          const sgstPer = Number(d.SGST) || 0
          const igstPer = Number(d.IGST) || 0
          const cessPer = Number(d.CESS) || 0
          const cgstAmt = Number(d.CGST_AMOUNT) || (lineSubtotal * cgstPer) / 100
          const sgstAmt = Number(d.SGST_AMOUNT) || (lineSubtotal * sgstPer) / 100
          const igstAmt = Number(d.IGST_AMOUNT) || (lineSubtotal * igstPer) / 100
          const cessAmt = Number(d.CESS_AMOUNT) || (lineSubtotal * cessPer) / 100
          const isNCKOT = toBool(d.isNCKOT)
          dStmt.run(
            txnId,
            d.outletid ?? null,
            d.ItemID ?? null,
            d.TableID ?? null,
            cgstPer,
            Number(cgstAmt) || 0,
            sgstPer,
            Number(sgstAmt) || 0,
            igstPer,
            Number(igstAmt) || 0,
            cessPer,
            Number(cessAmt) || 0,
            qty,
            toBool(d.AutoKOT),
            toBool(d.ManualKOT),
            d.SpecialInst || null,
            toBool(d.isKOTGenerate),
            toBool(d.isSetteled),
            isNCKOT,
            toBool(d.isCancelled),
            d.DeptID ?? null,
            d.HotelID ?? null,
            rate,
            Number(d.RevQty) || 0,
            d.KOTUsedDate || null,
            0 // isBilled default to 0
            
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
    console.error('Error in createBill:', error);
    res.status(500).json({ success: false, message: 'Failed to create bill', data: null, error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* 4) updateBill → update bill + replace details                              */
/* -------------------------------------------------------------------------- */
exports.updateBill = async (req, res) => {
  try {
    const { id } = req.params
    const {
      outletid, TxnNo, TableID, Steward, PAX, AutoKOT, ManualKOT, TxnDatetime,
      GrossAmt, RevKOT, Discount, CGST, SGST, IGST, CESS, RoundOFF, Amount,
      isHomeDelivery, DriverID, CustomerName, MobileNo, Address, Landmark,
      orderNo, isPickup, HotelID, GuestID, DiscRefID, DiscPer,DiscountType, UserId,
      BatchNo, PrevTableID, PrevDeptId, isTrnsfered, isChangeTrfAmt,
      ServiceCharge, ServiceCharge_Amount, Extra1, Extra2, Extra3,
      details = []
    } = req.body

    const txn = db.transaction(() => {
      const u = db.prepare(`
        UPDATE TAxnTrnbill SET
          outletid=?, TxnNo=?, TableID=?, Steward=?, PAX=?, AutoKOT=?, ManualKOT=?, TxnDatetime=?,
          GrossAmt=?, RevKOT=?, Discount=?, CGST=?, SGST=?, IGST=?, CESS=?, RoundOFF=?, Amount=?,
          isHomeDelivery=?, DriverID=?, CustomerName=?, MobileNo=?, Address=?, Landmark=?,
          orderNo=?, isPickup=?, HotelID=?, GuestID=?, DiscRefID=?, DiscPer=?, DiscountType=?, UserId=?,
          BatchNo=?, PrevTableID=?, PrevDeptId=?, isTrnsfered=?, isChangeTrfAmt=?,
          ServiceCharge=?, ServiceCharge_Amount=?, Extra1=?, Extra2=?, Extra3=?
        WHERE TxnID=?
      `)

      u.run(
        outletid ?? null,
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
        Number(IGST) || 0,
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
        Number(DiscountType) || 0,
        UserId ?? null,
        BatchNo || null,
        PrevTableID ?? null,
        PrevDeptId ?? null,
        toBool(isTrnsfered),
        toBool(isChangeTrfAmt),
        Number(ServiceCharge) || 0,
        Number(ServiceCharge_Amount) || 0,
        Extra1 || null,
        Extra2 || null,
        Extra3 || null,
        Number(id)
      )

      db.prepare('DELETE FROM TAxnTrnbilldetails WHERE TxnID = ?').run(Number(id))

      if (Array.isArray(details) && details.length > 0) {
        const ins = db.prepare(`
          INSERT INTO TAxnTrnbilldetails (
            TxnID, outletid, ItemID, TableID,
            CGST, CGST_AMOUNT, SGST, SGST_AMOUNT, IGST, IGST_AMOUNT,
            CESS, CESS_AMOUNT, Qty, AutoKOT, ManualKOT, SpecialInst,
            isKOTGenerate, isSetteled, isNCKOT, isCancelled,
            DeptID, HotelID, RuntimeRate, RevQty, KOTUsedDate,
            isBilled
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `)
        for (const d of details) {
          const isNCKOT = toBool(d.isNCKOT)
          ins.run(
            Number(id),
            d.outletid ?? null,
            d.ItemID ?? null,
            d.TableID ?? null,
            Number(d.CGST) || 0,
            Number(d.CGST_AMOUNT) || 0,
            Number(d.SGST) || 0,
            Number(d.SGST_AMOUNT) || 0,
            Number(d.IGST) || 0,
            Number(d.IGST_AMOUNT) || 0,
            Number(d.CESS) || 0,
            Number(d.CESS_AMOUNT) || 0,
            Number(d.Qty) || 0,
            toBool(d.AutoKOT),
            toBool(d.ManualKOT),
            d.SpecialInst || null,
            toBool(d.isKOTGenerate),
            toBool(d.isSetteled),
            isNCKOT,
            toBool(d.isCancelled),
            d.DeptID ?? null,
            d.HotelID ?? null,
            Number(d.RuntimeRate) || 0,
            Number(d.RevQty) || 0,
            d.KOTUsedDate || null,
            0 // isBilled default to 0
           
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
/* -------------------------------------------------------------------------- */
/* 5) deleteBill → delete bill + details                                      */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/* 6) settleBill → insert settlement + mark settled                           */
/* -------------------------------------------------------------------------- */
exports.settleBill = async (req, res) => {
  try {
    const { id } = req.params
    const { settlements = [] } = req.body

    if (!Array.isArray(settlements) || settlements.length === 0) {
      return res.status(400).json({ success: false, message: 'settlements array is required', data: null })
    }

    const bill = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(Number(id))
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found', data: null })

    const tx = db.transaction(() => {
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

      db.prepare(`
        UPDATE TAxnTrnbill 
        SET isSetteled = 1, isBilled = 1, BilledDate = CURRENT_TIMESTAMP 
        WHERE TxnID = ?
      `).run(Number(id))

      db.prepare(`UPDATE TAxnTrnbilldetails SET isSetteled = 1 WHERE TxnID = ?`).run(Number(id))
    })

    tx()

    const header = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(Number(id))
    const items = db.prepare('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? ORDER BY TXnDetailID').all(Number(id))
    const stl = db.prepare(`
      SELECT * FROM TrnSettlement 
      WHERE OrderNo = ? AND HotelID = ?
      ORDER BY SettlementID
    `).all(header.orderNo || null, header.HotelID || null)

    res.json(ok('Bill settled', { ...header, details: items, settlement: stl }))
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to settle bill', data: null, error: error.message })
  }
}

exports.addItemToBill = async (req, res) => {
  try {
    const { id } = req.params
    const { details = [] } = req.body

    if (!Array.isArray(details) || details.length === 0) {
      return res.status(400).json({ success: false, message: 'details array required', data: null })
    }

    const bill = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(Number(id))
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found', data: null })

    const tx = db.transaction(() => {
      const din = db.prepare(`
        INSERT INTO TAxnTrnbilldetails (
          TxnID, ItemID, Qty, RuntimeRate, AutoKOT, ManualKOT, SpecialInst, DeptID, HotelID,
          isBilled, isNCKOT, NCName, NCPurpose
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `)
      for (const it of details) {
        const isNCKOT = toBool(it.isNCKOT)
        din.run(
          Number(id), it.ItemID ?? null, Number(it.Qty) || 0, Number(it.RuntimeRate) || 0,
          toBool(it.AutoKOT), toBool(it.ManualKOT), it.SpecialInst || null, it.DeptID ?? null, it.HotelID ?? null,
          0, // isBilled default to 0
          isNCKOT, // isNCKOT as provided or 0
          isNCKOT ? (it.NCName || null) : null,
          isNCKOT ? (it.NCPurpose || null) : null
        )
      }
    })

    tx()
    const header = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(Number(id))
    const items = db.prepare('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? ORDER BY TXnDetailID').all(Number(id))

    res.json({ success: true, message: 'Items added', data: { ...header, details: items } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add items', data: null, error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* 7) updateBillItemsIsBilled → update isBilled = 1 for all items in a bill   */
/* -------------------------------------------------------------------------- */
exports.updateBillItemsIsBilled = async (req, res) => {
  try {
    const { id } = req.params

    const bill = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(Number(id))
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found', data: null })

    const updateStmt = db.prepare('UPDATE TAxnTrnbilldetails SET isBilled = 1 WHERE TxnID = ?')
    updateStmt.run(Number(id))

    const header = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(Number(id))
    const items = db.prepare('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? ORDER BY TXnDetailID').all(Number(id))

    res.json(ok('Bill items marked as billed', { ...header, details: items }))
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update bill items isBilled', data: null, error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* 8) createKOT → insert new KOT + details (only new/extra items)             */
/* -------------------------------------------------------------------------- */
exports.createKOT = async (req, res) => {
  try {
    console.log('Received createKOT body:', JSON.stringify(req.body, null, 2));
    const { outletid, TableID, UserId, HotelID, NCName, NCPurpose, details = [] } = req.body;

    if (!TableID) {
      return res.status(400).json({ success: false, message: 'TableID is required' });
    }
    if (!Array.isArray(details) || details.length === 0) {
      return res.status(400).json({ success: false, message: 'details array is required' });
    }

    const trx = db.transaction(() => {
      console.log('Creating a new KOT.');
      const maxKOTResult = db.prepare('SELECT MAX(KOTNo) as maxKOT FROM TAxnTrnbill').get();
      const kotNo = (maxKOTResult?.maxKOT || 0) + 1;

      const insertHeaderStmt = db.prepare(`
        INSERT INTO TAxnTrnbill (
          outletid, TableID, UserId, HotelID, KOTNo, TxnDatetime,
          isBilled, isCancelled, isSetteled, status, AutoKOT,
          NCName, NCPurpose
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), 0, 0, 0, 1, 1, ?, ?)
      `);
      const result = insertHeaderStmt.run(outletid, TableID, UserId, HotelID, kotNo, NCName || null, NCPurpose || null);
      const txnId = result.lastInsertRowid;

      db.prepare('UPDATE msttablemanagement SET status = 1 WHERE tableid = ?').run(TableID);
      console.log(`Created new KOT. TxnID: ${txnId}, KOTNo: ${kotNo}. Updated table ${TableID} status.`);

      const insertDetailStmt = db.prepare(`
        INSERT INTO TAxnTrnbilldetails (
          TxnID, outletid, ItemID, TableID, Qty, RuntimeRate, DeptID, HotelID,
          KOTNo, isKOTGenerate, AutoKOT, KOTUsedDate, isBilled, isCancelled, isSetteled, isNCKOT,
          CGST, CGST_AMOUNT, SGST, SGST_AMOUNT, IGST, IGST_AMOUNT, CESS, CESS_AMOUNT
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, datetime('now'), 0, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of details) {
        const qty = Number(item.Qty) || 0;
        const rate = Number(item.RuntimeRate) || 0;
        const lineSubtotal = qty * rate;
        const cgstPer = Number(item.CGST) || 0;
        const sgstPer = Number(item.SGST) || 0;
        const igstPer = Number(item.IGST) || 0;
        const cessPer = Number(item.CESS) || 0;
        const cgstAmt = Number(item.CGST_AMOUNT) || (lineSubtotal * cgstPer) / 100;
        const sgstAmt = Number(item.SGST_AMOUNT) || (lineSubtotal * sgstPer) / 100;
        const igstAmt = Number(item.IGST_AMOUNT) || (lineSubtotal * igstPer) / 100;
        const cessAmt = Number(item.CESS_AMOUNT) || (lineSubtotal * cessPer) / 100;
        const isNCKOT = toBool(item.isNCKOT);

        insertDetailStmt.run(
          txnId,
          outletid,
          item.ItemID,
          TableID,
          qty,
          rate,
          item.DeptID,
          HotelID,
          kotNo,
          isNCKOT,
          cgstPer,
          cgstAmt,
          sgstPer,
          sgstAmt,
          igstPer,
          igstAmt,
          cessPer,
          cessAmt
        );
      }

      const totals = db.prepare(`
        SELECT 
          SUM(Qty * RuntimeRate) as totalGross,
          SUM(CGST_AMOUNT) as totalCgst,
          SUM(SGST_AMOUNT) as totalSgst,
          SUM(IGST_AMOUNT) as totalIgst,
          SUM(CESS_AMOUNT) as totalCess
        FROM TAxnTrnbilldetails 
        WHERE TxnID = ? AND isCancelled = 0
      `).get(txnId);

      const grossAmount = totals?.totalGross || 0;
      const totalCgst = totals?.totalCgst || 0;
      const totalSgst = totals?.totalSgst || 0;
      const totalIgst = totals?.totalIgst || 0;
      const totalCess = totals?.totalCess || 0;
      const totalAmount = grossAmount + totalCgst + totalSgst + totalIgst + totalCess;

      db.prepare(`
        UPDATE TAxnTrnbill 
        SET GrossAmt = ?, Amount = ?, CGST = ?, SGST = ?, IGST = ?, CESS = ? 
        WHERE TxnID = ?
      `).run(grossAmount, totalAmount, totalCgst, totalSgst, totalIgst, totalCess, txnId);

      return { txnId, kotNo };
    })(); // Immediately invoke the transaction

    const { txnId, kotNo } = trx;
    const header = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(txnId);
    const items = db.prepare('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? AND isCancelled = 0 ORDER BY TXnDetailID').all(txnId);

    res.json(ok('KOT processed successfully', { ...header, details: items, KOTNo: kotNo }));

  } catch (error) {
    console.error('Error in createKOT:', error);
    res.status(500).json({ success: false, message: 'Failed to create/update KOT', data: null, error: error.message });
  }
}

/* -------------------------------------------------------------------------- */
/* 9) getSavedKOTs → fetch all unbilled KOTs for table, merged                */
/* -------------------------------------------------------------------------- */
exports.getSavedKOTs = async (req, res) => {
  try {
    const { tableId, isBilled } = req.query; // get filters from query

    let whereClauses = ['b.isCancelled = 0'];
    const params = [];

    if (isBilled !== undefined) {
      whereClauses.push('b.isBilled = ?');
      params.push(Number(isBilled));
    }

    // This makes tableId optional. If provided, it filters.
    if (tableId !== undefined) {
      whereClauses.push('b.TableID = ?');
      params.push(Number(tableId));
    }

    // Select only the fields needed for the "Saved KOTs" modal
    const sql = `
      SELECT
        b.TxnID,
        b.TableID,
        b.Amount,
        b.orderNo,
        b.TxnDatetime,
        b.KOTNo
      FROM TAxnTrnbill b
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY b.TxnDatetime DESC
    `;

    const rows = db.prepare(sql).all(...params);

    res.json(ok('Fetched saved KOTs', rows));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch saved KOTs', data: null, error: error.message })
  }
}

exports.getLatestKOTForTable = async (req, res) => {
  try {
    const { tableId } = req.query;
    if (!tableId) return res.status(400).json({ success: false, message: 'tableId required', data: null })

    const bill = db.prepare(`SELECT * FROM TAxnTrnbill WHERE TableID = ? AND isBilled = 0 AND isCancelled = 0 ORDER BY TxnID DESC LIMIT 1`).get(tableId)
    if (!bill) return res.status(404).json({ success: false, message: 'No KOT found', data: null })

    const details = db.prepare(`
      SELECT * FROM TAxnTrnbilldetails 
      WHERE TxnID = ? AND isCancelled = 0 
      ORDER BY TXnDetailID ASC
    `).all(bill.TxnID)

    res.json(ok('Latest KOT fetched', { ...bill, details }))
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch KOT', data: null, error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* Updated getUnbilledItemsByTable to fetch all unbilled items with isNew flag */
/* -------------------------------------------------------------------------- */
exports.getUnbilledItemsByTable = async (req, res) => {
  try {
    const { tableId } = req.params;

    // Get the latest KOTNo for the table
    const latestKOT = db.prepare(`
      SELECT KOTNo
      FROM TAxnTrnbill
      WHERE TableID = ? AND isBilled = 0 AND isCancelled = 0
      ORDER BY TxnID DESC
      LIMIT 1
    `).get(Number(tableId));

    const kotNo = latestKOT ? latestKOT.KOTNo : null;

    // Fetch all unbilled items for the table (not aggregated)
    const rows = db.prepare(`
      SELECT
        d.TXnDetailID,
        d.ItemID,
        COALESCE(m.item_name, 'Unknown Item') AS ItemName,
        d.Qty,
        COALESCE(d.RevQty, 0) as RevQty,
        (d.Qty - COALESCE(d.RevQty, 0)) as NetQty,
        d.RuntimeRate as price,
        d.KOTNo
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE b.TableID = ? AND b.isBilled = 0 AND d.isCancelled = 0 AND (d.Qty - COALESCE(d.RevQty, 0)) > 0
    `).all(Number(tableId));

    // Map to add isNew flag
    const items = rows.map(r => ({
      txnDetailId: r.TXnDetailID,
      itemId: r.ItemID,
      itemName: r.ItemName,
      qty: r.Qty,
      revQty: r.RevQty,
      netQty: r.NetQty,
      price: r.price,
      isNew: r.KOTNo === kotNo,
      kotNo: r.KOTNo,
    }));

    console.log('Unbilled items for tableId', tableId, ':', items);

    res.json({ success: true, message: 'Fetched unbilled items', data: { kotNo: kotNo, items: items } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch unbilled items', data: null, error: error.message });
  }
};

module.exports = exports
