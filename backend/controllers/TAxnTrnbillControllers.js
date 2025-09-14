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
    const { isBilled, tableId } = req.query;
    console.log('getAllBills called with query params:', { isBilled, tableId });
    
    // Build WHERE clause based on query parameters
    let whereClause = 'WHERE b.isCancelled = 0';
    const params = [];
    
    if (isBilled !== undefined) {
      whereClause += ' AND b.isBilled = ?';
      params.push(Number(isBilled));
    }
    
    if (tableId !== undefined) {
      whereClause += ' AND b.TableID = ?';
      params.push(Number(tableId));
    }
    
    const query = `
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
            'isBilled', d.isBilled
          )
        ) as _details,
        b.NCName,
        b.NCPurpose
      FROM TAxnTrnbill b
      LEFT JOIN TAxnTrnbilldetails d 
        ON d.TxnID = b.TxnID AND d.isCancelled = 0
      ${whereClause}
      GROUP BY b.TxnID
      ORDER BY b.TxnDatetime DESC
    `;
    
    console.log('Executing query:', query);
    console.log('With params:', params);

    let rows;
    try {
      rows = db.prepare(query).all(...params);
      console.log('Query returned', rows.length, 'rows');
    } catch (sqlError) {
      console.error('SQL Error in getAllBills:', sqlError.message);
      console.error('Query:', query);
      console.error('Params:', params);
      throw sqlError; // Re-throw to be caught by outer catch
    }

    const data = rows.map(r => ({
      ...r,
      details: r._details ? JSON.parse(`[${r._details}]`) : [],
    }))
    
    console.log('Returning data:', data.length, 'bills');
    res.json(ok('Fetched all bills', data))
  } catch (error) {
    console.error('Error in getAllBills:', error);
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
    console.log('Received createBill body:', JSON.stringify(req.body));
    const {
      outletid, TxnNo, TableID, Steward, PAX, AutoKOT, ManualKOT, TxnDatetime,
      GrossAmt, RevKOT, Discount, CGST, SGST, IGST, CESS, RoundOFF, Amount,
      isHomeDelivery, DriverID, CustomerName, MobileNo, Address, Landmark,
      orderNo, isPickup, HotelID, GuestID, DiscRefID, DiscPer, DiscountType, UserId,
      BatchNo, PrevTableID, PrevDeptId, isTrnsfered, isChangeTrfAmt,
      ServiceCharge, ServiceCharge_Amount, Extra1, Extra2, Extra3,
      details = []
    } = req.body

    // Get NCName and NCPurpose from the first NCKOT item
    const nckotInfo = details.find(d => d.isNCKOT) || {};
    const billNCName = nckotInfo.NCName || null;
    const billNCPurpose = nckotInfo.NCPurpose || null;

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
      // Generate KOTNo
      const maxKOT = db.prepare('SELECT MAX(KOTNo) as maxKOT FROM TAxnTrnbill').get();
      const kotNo = maxKOT && maxKOT.maxKOT ? maxKOT.maxKOT + 1 : 1;

      const stmt = db.prepare(`
        INSERT INTO TAxnTrnbill (
          outletid, TxnNo, TableID, Steward, PAX, AutoKOT, ManualKOT, TxnDatetime,
          GrossAmt, RevKOT, Discount, CGST, SGST, IGST, CESS, RoundOFF, Amount,
          isHomeDelivery, DriverID, CustomerName, MobileNo, Address, Landmark,
          orderNo, isPickup, NCName, NCPurpose, HotelID, GuestID, DiscRefID, DiscPer, DiscountType, UserId,
          BatchNo, PrevTableID, PrevDeptId, isTrnsfered, isChangeTrfAmt,
          ServiceCharge, ServiceCharge_Amount, Extra1, Extra2, Extra3, KOTNo
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `)

      const result = stmt.run(
        outletid ?? null,
        TxnNo || null,
        TableID ?? null,
        Steward || null,
        PAX ?? null,
        1, // AutoKOT = 1 for KOT
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
        billNCName,
        billNCPurpose,
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
        kotNo
      )

      const txnId = result.lastInsertRowid

      // If a table is associated, update its status to Occupied (1)
      if (TableID) {
        db.prepare('UPDATE msttablemanagement SET status = 1 WHERE tableid = ?').run(TableID)
      }

      if (isArray) {
        const dStmt = db.prepare(`
          INSERT INTO TAxnTrnbilldetails (
            TxnID, outletid, ItemID, TableID,
            CGST, CGST_AMOUNT, SGST, SGST_AMOUNT, IGST, IGST_AMOUNT,
            CESS, CESS_AMOUNT, Qty, AutoKOT, ManualKOT, SpecialInst,
            isKOTGenerate, isSetteled, isNCKOT, isCancelled,
            DeptID, HotelID, RuntimeRate, RevQty, KOTUsedDate,
            isBilled, KOTNo
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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
            1, // AutoKOT = 1
            toBool(d.ManualKOT),
            d.SpecialInst || null,
            1, // isKOTGenerate = 1
            toBool(d.isSetteled),
            isNCKOT,
            toBool(d.isCancelled),
            d.DeptID ?? null,
            d.HotelID ?? null,
            rate,
            Number(d.RevQty) || 0,
            d.KOTUsedDate || null,
            0, // isBilled default to 0
            kotNo

          )
        }
      }

      return { txnId, kotNo }
    })

    const { txnId, kotNo } = trx()
    const header = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(txnId)
    const items = db.prepare('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? ORDER BY TXnDetailID').all(txnId)
    res.json(ok('Bill created', { ...header, details: items, KOTNo: kotNo }))
  } catch (error) {
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
      orderNo, isPickup,  HotelID, GuestID, DiscRefID, DiscPer,DiscountType, UserId,
      BatchNo, PrevTableID, PrevDeptId, isTrnsfered, isChangeTrfAmt, 
      ServiceCharge, ServiceCharge_Amount, Extra1, Extra2, Extra3,
      details = []
    } = req.body

    // Get NCName and NCPurpose from the first NCKOT item
    const nckotInfo = details.find(d => d.isNCKOT) || {};
    const billNCName = nckotInfo.NCName || null;
    const billNCPurpose = nckotInfo.NCPurpose || null;

    const txn = db.transaction(() => {
      const u = db.prepare(`
        UPDATE TAxnTrnbill SET
          outletid=?, TxnNo=?, TableID=?, Steward=?, PAX=?, AutoKOT=?, ManualKOT=?, TxnDatetime=?,
          GrossAmt=?, RevKOT=?, Discount=?, CGST=?, SGST=?, IGST=?, CESS=?, RoundOFF=?, Amount=?,
          isHomeDelivery=?, DriverID=?, CustomerName=?, MobileNo=?, Address=?, Landmark=?,
          orderNo=?, isPickup=?, NCName=?, NCPurpose=?, HotelID=?, GuestID=?, DiscRefID=?, DiscPer=?, DiscountType=?, UserId=?,
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
        billNCName,
        billNCPurpose,
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
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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
/* getUnbilledItemsByTable → fetch aggregated unbilled items by TableID       */
/* -------------------------------------------------------------------------- */
exports.getUnbilledItemsByTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    if (!tableId) {
      return res.status(400).json({ success: false, message: 'Table ID is required' });
    }
    const rows = db.prepare(`
      SELECT
        d.ItemID,
        COALESCE(m.item_name, 'Unknown Item') AS ItemName,
        SUM(d.Qty) as Qty,
        d.RuntimeRate as price,
        b.isBilled,
        d.isNCKOT,
        b.NCName,
        b.NCPurpose,
        b.TableID,
        MIN(d.TxnID) as TxnID
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE b.TableID = ? AND b.isBilled = 0 AND d.isCancelled = 0
      GROUP BY d.ItemID, COALESCE(m.item_name, 'Unknown Item'), d.RuntimeRate, b.isBilled, d.isNCKOT, b.NCName, b.NCPurpose, b.TableID
      HAVING SUM(d.Qty) > 0
    `).all(Number(tableId));

    res.json({ success: true, message: 'Fetched unbilled items', data: rows });
  } catch (error) {
    console.error('Error fetching unbilled items by table:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch unbilled items', data: null, error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* getUnbilledItemsByKOTNo → fetch aggregated unbilled items by KOTNo         */
/* -------------------------------------------------------------------------- */
exports.getUnbilledItemsByKOTNo = async (req, res) => {
  try {
    const { kotNo } = req.params;
    if (!kotNo) {
      return res.status(400).json({ success: false, message: 'KOT No is required' });
    }

    const rows = db.prepare(`
      SELECT
        d.ItemID,
        COALESCE(m.item_name, 'Unknown Item') AS ItemName,
        SUM(d.Qty) as Qty,
        d.RuntimeRate as price,
        b.isBilled,
        d.isNCKOT,
        b.NCName,
        b.NCPurpose
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE b.KOTNo = ? AND b.isBilled = 0 AND d.isCancelled = 0
      GROUP BY d.ItemID, COALESCE(m.item_name, 'Unknown Item'), d.RuntimeRate, b.isBilled, d.isNCKOT, b.NCName, b.NCPurpose
      HAVING SUM(d.Qty) > 0
    `).all(Number(kotNo));

    res.json({ success: true, message: 'Fetched unbilled items by KOT', data: rows });
  } catch (error) {
    console.error('Error fetching unbilled items by KOT:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch unbilled items by KOT', data: null, error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* updateItemsBilledByTable → mark isBilled = 1 for unbilled items by TableID */
/* -------------------------------------------------------------------------- */
exports.updateItemsBilledByTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    if (!tableId) {
      return res.status(400).json({ success: false, message: 'Table ID is required' });
    }

    const tx = db.transaction(() => {
      // Mark all unbilled KOT headers for the specified table as billed.
      const updateKOTs = db.prepare(`
        UPDATE TAxnTrnbill
        SET isBilled = 1
        WHERE TableID = ? AND isBilled = 0
      `);
      const result = updateKOTs.run(Number(tableId));


      return result;
    });

    const result = tx();

    res.json({ success: true, message: `Marked ${result.changes} KOTs as billed and table status updated to Billed.`, changes: result.changes });
  } catch (error) {
    console.error('Error updating items billed status by table:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update items billed status', data: null, error: error.message });
  }
};

exports.getNextKOTNo = async (req, res) => {
  try {
    const maxKOT = db.prepare('SELECT MAX(KOTNo) as maxKOT FROM TAxnTrnbill').get();
    const nextKOT = maxKOT && maxKOT.maxKOT ? maxKOT.maxKOT + 1 : 1;
    res.json(ok('Next KOT No', { nextKOT }));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get next KOT', data: null, error: error.message });
  }
};



/* -------------------------------------------------------------------------- */
/* KOT Management Functions                                                  */
/* -------------------------------------------------------------------------- */

// Create normal KOT
exports.createKOT = async (req, res) => {
  try {
    const { txnId, tableId, items = [] } = req.body;
    
    if (!txnId || !tableId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'txnId, tableId, and items array are required', 
        data: null 
      });
    }

    const trx = db.transaction(() => {
      // Get next KOT number
      const maxKOT = db.prepare('SELECT MAX(KOTNo) as maxKOT FROM TAxnTrnbill').get();
      const kotNo = maxKOT && maxKOT.maxKOT ? maxKOT.maxKOT + 1 : 1;

      // Update the bill header with new KOT number
      db.prepare('UPDATE TAxnTrnbill SET KOTNo = ? WHERE TxnID = ?').run(kotNo, txnId);

      // Insert new KOT items
      const insertStmt = db.prepare(`
        INSERT INTO TAxnTrnbilldetails (
          TxnID, outletid, ItemID, TableID, Qty, RevQty, KOTNo, isKOTGenerate,
          AutoKOT, ManualKOT, SpecialInst, isSetteled, isNCKOT, isCancelled,
          DeptID, HotelID, RuntimeRate, KOTUsedDate, isBilled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        const qty = Number(item.Qty) || 0;
        const rate = Number(item.RuntimeRate) || 0;
        
        insertStmt.run(
          txnId,
          item.outletid || null,
          item.ItemID,
          tableId,
          qty,
          0, // RevQty = 0 for normal KOT
          kotNo,
          1, // isKOTGenerate = 1
          1, // AutoKOT = 1
          toBool(item.ManualKOT),
          item.SpecialInst || null,
          toBool(item.isSetteled),
          toBool(item.isNCKOT),
          toBool(item.isCancelled),
          item.DeptID || null,
          item.HotelID || null,
          rate,
          new Date().toISOString(),
          0 // isBilled = 0
        );
      }

      return { kotNo, txnId };
    });

    const { kotNo, txnId: resultTxnId } = trx();
    
    res.json(ok('KOT created successfully', { 
      kotNo, 
      txnId: resultTxnId, 
      tableId,
      itemsCount: items.length 
    }));
  } catch (error) {
    console.error('Error creating KOT:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create KOT', 
      data: null, 
      error: error.message 
    });
  }
};

// Create reverse KOT (Re-KOT)
exports.reverseKOT = async (req, res) => {
  try {
    const { txnId, tableId, itemId, qtyToReverse = 1 } = req.body;
    
    if (!txnId || !tableId || !itemId) {
      return res.status(400).json({ 
        success: false, 
        message: 'txnId, tableId, and itemId are required', 
        data: null 
      });
    }

    const trx = db.transaction(() => {
      // Get next KOT number
      const maxKOT = db.prepare('SELECT MAX(KOTNo) as maxKOT FROM TAxnTrnbill').get();
      const kotNo = maxKOT && maxKOT.maxKOT ? maxKOT.maxKOT + 1 : 1;

      // Get the original item details
      const originalItem = db.prepare(`
        SELECT * FROM TAxnTrnbilldetails 
        WHERE TxnID = ? AND ItemID = ? AND TableID = ? AND isCancelled = 0
        ORDER BY TXnDetailID DESC LIMIT 1
      `).get(txnId, itemId, tableId);

      if (!originalItem) {
        throw new Error('Original item not found');
      }

      // Insert reverse KOT entry with negative quantities
      const insertStmt = db.prepare(`
        INSERT INTO TAxnTrnbilldetails (
          TxnID, outletid, ItemID, TableID, Qty, RevQty, KOTNo, isKOTGenerate,
          AutoKOT, ManualKOT, SpecialInst, isSetteled, isNCKOT, isCancelled,
          DeptID, HotelID, RuntimeRate, KOTUsedDate, isBilled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const reverseQty = -Math.abs(Number(qtyToReverse));
      
      insertStmt.run(
        txnId,
        originalItem.outletid,
        itemId,
        tableId,
        reverseQty, // Qty = negative value
        reverseQty, // RevQty = negative value
        kotNo,
        1, // isKOTGenerate = 1 (marked as Re-KOT generated)
        1, // AutoKOT = 1
        toBool(originalItem.ManualKOT),
        originalItem.SpecialInst,
        toBool(originalItem.isSetteled),
        toBool(originalItem.isNCKOT),
        toBool(originalItem.isCancelled),
        originalItem.DeptID,
        originalItem.HotelID,
        originalItem.RuntimeRate,
        new Date().toISOString(),
        0 // isBilled = 0
      );

      return { kotNo, txnId, itemId, reverseQty };
    });

    const { kotNo, txnId: resultTxnId, itemId: resultItemId, reverseQty } = trx();
    
    res.json(ok('Re-KOT created successfully', { 
      kotNo, 
      txnId: resultTxnId, 
      tableId,
      itemId: resultItemId,
      reverseQty,
      message: `Reversed ${Math.abs(reverseQty)} quantity for item ${resultItemId}`
    }));
  } catch (error) {
    console.error('Error creating Re-KOT:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create Re-KOT', 
      data: null, 
      error: error.message 
    });
  }
};

// Get KOT list for a table (including normal and reverse KOTs)
exports.getKOTList = async (req, res) => {
  try {
    const { tableId } = req.query;
    
    if (!tableId) {
      return res.status(400).json({ 
        success: false, 
        message: 'tableId query parameter is required', 
        data: null 
      });
    }

    const query = `
      SELECT 
        d.KOTNo,
        d.TXnDetailID,
        d.ItemID,
        COALESCE(m.item_name, 'Unknown Item') AS ItemName,
        d.Qty,
        d.RevQty,
        d.RuntimeRate,
        d.isKOTGenerate,
        d.KOTUsedDate,
        d.SpecialInst,
        CASE 
          WHEN d.Qty < 0 THEN 'Re-KOT'
          ELSE 'Normal KOT'
        END as KOTType,
        b.TxnDatetime,
        b.Steward
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE b.TableID = ? AND d.isCancelled = 0 AND d.KOTNo IS NOT NULL
      ORDER BY d.KOTNo DESC, d.TXnDetailID DESC
    `;

    const kotList = db.prepare(query).all(Number(tableId));

    // Group by KOT number for better organization
    const groupedKOTs = kotList.reduce((acc, item) => {
      const kotNo = item.KOTNo;
      if (!acc[kotNo]) {
        acc[kotNo] = {
          kotNo,
          kotType: item.KOTType,
          items: [],
          kotDate: item.TxnDatetime,
          steward: item.Steward
        };
      }
      acc[kotNo].items.push({
        TXnDetailID: item.TXnDetailID,
        ItemID: item.ItemID,
        ItemName: item.ItemName,
        Qty: item.Qty,
        RevQty: item.RevQty,
        RuntimeRate: item.RuntimeRate,
        isKOTGenerate: item.isKOTGenerate,
        KOTUsedDate: item.KOTUsedDate,
        SpecialInst: item.SpecialInst
      });
      return acc;
    }, {});

    const result = Object.values(groupedKOTs).sort((a, b) => b.kotNo - a.kotNo);

    res.json(ok('KOT list retrieved successfully', { 
      tableId: Number(tableId),
      kotList: result,
      totalKOTs: result.length
    }));
  } catch (error) {
    console.error('Error retrieving KOT list:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve KOT list', 
      data: null, 
      error: error.message 
    });
  }
};

module.exports = exports
