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
      if (TableID) {
        db.prepare('UPDATE TAxnTrnbill SET isBilled = 1 WHERE TableID = ? AND isBilled = 0').run(TableID);
      }
      

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
/* createKOT → add quantity to existing KOT or create new KOT details         */
/* -------------------------------------------------------------------------- */
exports.createKOT = async (req, res) => {
  try {
    const { txnId, tableId, items = [] } = req.body;
    if (!txnId || !tableId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'txnId, tableId and items are required' });
    }

    const bill = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(Number(txnId));
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found', data: null });

    const tx = db.transaction(() => {
      // If any of the new items is an NCKOT, update the main bill header.
      const nckotItem = items.find(item => item.isNCKOT);
      if (nckotItem) {
        db.prepare(`
          UPDATE TAxnTrnbill 
          SET NCName = ?, NCPurpose = ? 
          WHERE TxnID = ?
        `).run(nckotItem.NCName || null, nckotItem.NCPurpose || null, Number(txnId));
      }

      const insertDetail = db.prepare(`
        INSERT INTO TAxnTrnbilldetails (
          TxnID, ItemID, Qty, RuntimeRate, AutoKOT, ManualKOT, SpecialInst, DeptID, HotelID,
          isBilled, isNCKOT
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        insertDetail.run(
          Number(txnId),
          item.ItemID ?? null,
          Number(item.Qty) || 0,
          Number(item.RuntimeRate) || 0,
          1, // AutoKOT = 1
          toBool(item.ManualKOT),
          item.SpecialInst || null,
          item.DeptID ?? null,
          item.HotelID ?? null,
          0, // isBilled default to 0
          toBool(item.isNCKOT)
        );
      }
    });

    tx();

    const updatedBill = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(Number(txnId));
    const updatedDetails = db.prepare('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? ORDER BY TXnDetailID').all(Number(txnId));

    res.json({ success: true, message: 'KOT updated', data: { ...updatedBill, details: updatedDetails } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update KOT', data: null, error: error.message });
  }
};



/* -------------------------------------------------------------------------- */
/* Updated getUnbilledItemsByTable query to fix quantity multiplication issue */
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
        SUM(d.Qty - d.RevQty) as NetQty,
        AVG(d.RuntimeRate) as price,
        b.isBilled,
        d.isNCKOT,
        b.NCName,
        b.NCPurpose,
        SUM(d.RevQty) as RevQty
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE b.TableID = ? AND b.isBilled = 0 AND d.isCancelled = 0
      GROUP BY d.ItemID, COALESCE(m.item_name, 'Unknown Item'), b.isBilled, d.isNCKOT, b.NCName, b.NCPurpose, b.TableID
    `).all(Number(tableId));

    res.json({ success: true, message: 'Fetched unbilled items', data: rows });
  } catch (error) {
    console.error('Error fetching unbilled items by table:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch unbilled items', data: null, error: error.message });
  }
};



module.exports = exports
