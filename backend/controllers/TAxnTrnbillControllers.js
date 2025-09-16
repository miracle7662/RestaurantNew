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
    const { isBilled } = req.query
    let whereClause = 'isCancelled = 0'

    if (isBilled !== undefined) {
      whereClause += ` AND isBilled = ${Number(isBilled)}`
    }

    const bills = db.prepare(`
      SELECT * FROM TAxnTrnbill
      WHERE ${whereClause}
      ORDER BY TxnDatetime DESC
    `).all()

    const data = bills.map(bill => {
      const details = db.prepare(`
        SELECT * FROM TAxnTrnbilldetails
        WHERE TxnID = ? AND isCancelled = 0
        ORDER BY TXnDetailID ASC
      `).all(bill.TxnID)

      return { ...bill, details }
    })

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
      // If any of the new items is an NCKOT, update the main bill header.
      const nckotItem = details.find(item => item.isNCKOT);
      if (nckotItem) {
        db.prepare(`
          UPDATE TAxnTrnbill 
          SET NCName = ?, NCPurpose = ? 
          WHERE TxnID = ?
        `).run(nckotItem.NCName || null, nckotItem.NCPurpose || null, Number(id));
      }

      const din = db.prepare(`
        INSERT INTO TAxnTrnbilldetails (
          TxnID, ItemID, Qty, RuntimeRate, AutoKOT, ManualKOT, SpecialInst, DeptID, HotelID,
          isBilled, isNCKOT
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
      `)
      for (const it of details) {
        const isNCKOT = toBool(it.isNCKOT)
        din.run(
          Number(id),
          it.ItemID ?? null,
          Number(it.Qty) || 0,
          Number(it.RuntimeRate) || 0,
          toBool(it.AutoKOT),
          toBool(it.ManualKOT),
          it.SpecialInst || null,
          it.DeptID ?? null,
          it.HotelID ?? null,
          0, // isBilled default to 0
          isNCKOT // isNCKOT as provided or 0
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
/* createKOT → add to existing KOT or create new KOT details                 */
/* -------------------------------------------------------------------------- */
exports.createKOT = async (req, res) => {
  try {
    console.log('Received createKOT body:', JSON.stringify(req.body));
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

    // Check if there's an existing unbilled KOT for this table
    const existingKOT = db.prepare('SELECT TxnID, KOTNo FROM TAxnTrnbill WHERE TableID = ? AND isBilled = 0').get(TableID);

    if (existingKOT) {
      // Add to existing KOT
      const existingTxnId = existingKOT.TxnID;
      const existingKotNo = existingKOT.KOTNo;

      const trx = db.transaction(() => {
        // Insert or update details
        if (Array.isArray(details) && details.length > 0) {
          const selectDetail = db.prepare(`
            SELECT TXnDetailID, Qty FROM TAxnTrnbilldetails 
            WHERE TxnID = ? AND ItemID = ? AND isCancelled = 0
          `);
          const insertDetail = db.prepare(`
            INSERT INTO TAxnTrnbilldetails (
              TxnID, outletid, ItemID, TableID,
              CGST, CGST_AMOUNT, SGST, SGST_AMOUNT, IGST, IGST_AMOUNT,
              CESS, CESS_AMOUNT, Qty, AutoKOT, ManualKOT, SpecialInst,
              isKOTGenerate, isSetteled, isNCKOT, isCancelled,
              DeptID, HotelID, RuntimeRate, RevQty, KOTUsedDate,
              isBilled, KOTNo
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          `);
          const updateDetailQty = db.prepare(`
            UPDATE TAxnTrnbilldetails SET Qty = ?, CGST_AMOUNT = ?, SGST_AMOUNT = ?, IGST_AMOUNT = ?, CESS_AMOUNT = ?
            WHERE TXnDetailID = ?
          `);

          for (const d of details) {
            const qty = Number(d.Qty) || 0;
            const rate = Number(d.RuntimeRate) || 0;
            const lineSubtotal = qty * rate;
            const cgstPer = Number(d.CGST) || 0;
            const sgstPer = Number(d.SGST) || 0;
            const igstPer = Number(d.IGST) || 0;
            const cessPer = Number(d.CESS) || 0;
            const cgstAmt = Number(d.CGST_AMOUNT) || (lineSubtotal * cgstPer) / 100;
            const sgstAmt = Number(d.SGST_AMOUNT) || (lineSubtotal * sgstPer) / 100;
            const igstAmt = Number(d.IGST_AMOUNT) || (lineSubtotal * igstPer) / 100;
            const cessAmt = Number(d.CESS_AMOUNT) || (lineSubtotal * cessPer) / 100;
            const isNCKOT = toBool(d.isNCKOT);

            const existingDetail = selectDetail.get(existingTxnId, d.ItemID);
            if (existingDetail) {
              // Update quantity and tax amounts by adding new qty and recalculating amounts
              const newQty = existingDetail.Qty + qty;
              const newLineSubtotal = newQty * rate;
              const newCgstAmt = (newLineSubtotal * cgstPer) / 100;
              const newSgstAmt = (newLineSubtotal * sgstPer) / 100;
              const newIgstAmt = (newLineSubtotal * igstPer) / 100;
              const newCessAmt = (newLineSubtotal * cessPer) / 100;

              updateDetailQty.run(
                newQty,
                newCgstAmt,
                newSgstAmt,
                newIgstAmt,
                newCessAmt,
                existingDetail.TXnDetailID
              );
            } else {
              // Insert new detail row
              insertDetail.run(
                existingTxnId,
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
                existingKotNo
              );
            }
          }
        }

        // Update NCName and NCPurpose if NCKOT
        if (billNCName || billNCPurpose) {
          db.prepare('UPDATE TAxnTrnbill SET NCName = ?, NCPurpose = ? WHERE TxnID = ?').run(billNCName, billNCPurpose, existingTxnId);
        }

        // Recalculate header totals from all details
        const allDetails = db.prepare('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? AND isCancelled = 0').all(existingTxnId);
        let totalGross = 0, totalCgst = 0, totalSgst = 0, totalIgst = 0, totalCess = 0;
        for (const det of allDetails) {
          const qty = Number(det.Qty) || 0;
          const rate = Number(det.RuntimeRate) || 0;
          const lineSubtotal = qty * rate;
          totalGross += lineSubtotal;
          totalCgst += Number(det.CGST_AMOUNT) || 0;
          totalSgst += Number(det.SGST_AMOUNT) || 0;
          totalIgst += Number(det.IGST_AMOUNT) || 0;
          totalCess += Number(det.CESS_AMOUNT) || 0;
        }
        const totalAmount = totalGross + totalCgst + totalSgst + totalIgst + totalCess;

        db.prepare(`
          UPDATE TAxnTrnbill SET
            GrossAmt = ?, CGST = ?, SGST = ?, IGST = ?, CESS = ?, Amount = ?
          WHERE TxnID = ?
        `).run(totalGross, totalCgst, totalSgst, totalIgst, totalCess, totalAmount, existingTxnId);

        return { txnId: existingTxnId, kotNo: existingKotNo };
      });

      const { txnId, kotNo } = trx();
      const header = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(txnId);
      const items = db.prepare('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? ORDER BY TXnDetailID').all(txnId);
      res.json(ok('Items added to existing KOT', { ...header, details: items, KOTNo: kotNo }));
    } else {
      // Create new KOT
      // Compute header totals from details if missing/zero
      const isArray = Array.isArray(details) && details.length > 0;
      let computedGross = 0, computedCgstAmt = 0, computedSgstAmt = 0, computedIgstAmt = 0, computedCessAmt = 0;
      if (isArray) {
        for (const d of details) {
          const qty = Number(d.Qty) || 0;
          const rate = Number(d.RuntimeRate) || 0;
          const lineSubtotal = qty * rate;
          const cgstPer = Number(d.CGST) || 0;
          const sgstPer = Number(d.SGST) || 0;
          const igstPer = Number(d.IGST) || 0;
          const cessPer = Number(d.CESS) || 0;
          const cgstAmt = Number(d.CGST_AMOUNT) || (lineSubtotal * cgstPer) / 100;
          const sgstAmt = Number(d.SGST_AMOUNT) || (lineSubtotal * sgstPer) / 100;
          const igstAmt = Number(d.IGST_AMOUNT) || (lineSubtotal * igstPer) / 100;
          const cessAmt = Number(d.CESS_AMOUNT) || (lineSubtotal * cessPer) / 100;
          computedGross += lineSubtotal;
          computedCgstAmt += cgstAmt;
          computedSgstAmt += sgstAmt;
          computedIgstAmt += igstAmt;
          computedCessAmt += cessAmt;
        }
      }

      const headerGross = Number(GrossAmt) || 0;
      const headerCgst = Number(CGST) || 0;
      const headerSgst = Number(SGST) || 0;
      const headerIgst = Number(IGST) || 0;
      const headerCess = Number(CESS) || 0;
      const headerRound = Number(RoundOFF) || 0;
      const headerAmount = Number(Amount) || 0;

      const finalGross = (isArray && headerGross === 0) ? computedGross : headerGross;
      const finalCgst = (isArray && headerCgst === 0) ? computedCgstAmt : headerCgst;
      const finalSgst = (isArray && headerSgst === 0) ? computedSgstAmt : headerSgst;
      const finalIgst = (isArray && headerIgst === 0) ? computedIgstAmt : headerIgst;
      const finalCess = (isArray && headerCess === 0) ? computedCessAmt : headerCess;
      const finalAmount = (isArray && headerAmount === 0)
        ? (finalGross + finalCgst + finalSgst + finalIgst + finalCess + headerRound)
        : headerAmount;

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
        `);

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
        );

        const txnId = result.lastInsertRowid;

        // If a table is associated, update its status to Occupied (1)
        if (TableID) {
          db.prepare('UPDATE msttablemanagement SET status = 1 WHERE tableid = ?').run(TableID);
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
      res.json(ok('New KOT created', { ...header, details: items, KOTNo: kotNo }))
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create KOT', data: null, error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* Updated getUnbilledItemsByTable query to fix quantity multiplication issue */
/* -------------------------------------------------------------------------- */
exports.getUnbilledItemsByTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const rows = db.prepare(`
      SELECT
        d.ItemID,
        COALESCE(m.item_name, 'Unknown Item') AS ItemName,
        SUM(d.Qty) as Qty,
        COALESCE(SUM(d.RevQty), 0) as RevQty,
        AVG(d.RuntimeRate) as price
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE b.TableID = ? AND b.isBilled = 0 AND d.isCancelled = 0
      GROUP BY d.ItemID
      HAVING SUM(d.Qty) > 0
    `).all(Number(tableId));

    res.json({ success: true, message: 'Fetched unbilled items', data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch unbilled items', data: null, error: error.message });
  }
};

module.exports = exports
