const db = require('../config/db')

// Utility: standard success response
function ok(message, data) {
  return { success: true, message, data }
}

function toBool(value) {
  return value ? 1 : 0
}

function generateTxnNo(outletid) {
  // 1. Fetch bill_prefix from settings
  const settings = db.prepare('SELECT bill_prefix FROM mstbill_preview_settings WHERE outletid = ?').get(outletid);
  const billPrefix = settings ? settings.bill_prefix : 'BILL-';

  // 2. Construct a date-based prefix for searching to ensure daily unique sequence
 
  const prefix = `${billPrefix}`;
  const prefixLen = prefix.length + 1;
  const likePattern = prefix + '%';

  // 3. Find the maximum sequence number for the current day for the entire outlet
  const maxStmt = db.prepare(`
    SELECT MAX(CAST(SUBSTR(TxnNo, ?) AS INTEGER)) as maxSeq
    FROM TAxnTrnbill
    WHERE outletid = ? AND TxnNo LIKE ?
  `);

  const result = maxStmt.get(prefixLen, outletid, likePattern);
  const newSeq = (result.maxSeq || 0) + 1;
  
  // 4. Construct the final TxnNo, e.g., "BILL-20240521-0001"
  return `${prefix}${String(newSeq).padStart(4, '0')}`;
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
            'Discount_Amount', d.Discount_Amount,
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
  console.log('Discount fields - DiscPer:', req.body.DiscPer, 'Discount:', req.body.Discount, 'DiscountType:', req.body.DiscountType);
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

    const isHeaderNCKOT = details.some(item => toBool(item.isNCKOT));

    console.log('Details array length:', details.length);
    if (details.length > 0) {
      console.log('First detail item:', JSON.stringify(details[0], null, 2));
    }

    console.log('NCName:', NCName);
    console.log('NCPurpose:', NCPurpose);

    // Always compute totals from details if provided, to ensure accuracy
    const isArray = Array.isArray(details) && details.length > 0;
    let computedGross = 0, computedCgstAmt = 0, computedSgstAmt = 0, computedIgstAmt = 0, computedCessAmt = 0, computedRevKOT = 0;
    if (isArray) {
      for (const d of details) {
        const qty = Number(d.Qty) || 0;
        const rate = Number(d.RuntimeRate) || 0;
        const revQty = Number(d.RevQty) || 0;
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
        computedRevKOT += revQty * rate;
      }
    }

    // Prioritize backend calculation if details are provided
    const finalGross = isArray ? computedGross : (Number(GrossAmt) || 0);
    const finalRevKOT = isArray ? computedRevKOT : (Number(RevKOT) || 0);
    const finalCgst = isArray ? computedCgstAmt : (Number(CGST) || 0);
    const finalSgst = isArray ? computedSgstAmt : (Number(SGST) || 0);
    const finalIgst = isArray ? computedIgstAmt : (Number(IGST) || 0);
    const finalCess = isArray ? computedCessAmt : (Number(CESS) || 0);
    const finalDiscount = Number(Discount) || 0;
    const finalRoundOff = Number(RoundOFF) || 0;

    // Calculate final amount based on computed/provided values
    const finalAmount = finalGross - finalDiscount + finalCgst + finalSgst + finalIgst + finalCess + finalRoundOff;

    const trx = db.transaction(() => {
      let txnNo = TxnNo;
      if (!txnNo && outletid) {
        txnNo = generateTxnNo(outletid);
      }

      const stmt = db.prepare(`
        INSERT INTO TAxnTrnbill (
          outletid, TxnNo, TableID, Steward, PAX, AutoKOT, ManualKOT, TxnDatetime,
          GrossAmt, RevKOT, Discount, CGST, SGST, IGST, CESS, RoundOFF, Amount,
          isHomeDelivery, DriverID, CustomerName, MobileNo, Address, Landmark,
          orderNo, isPickup, HotelID, GuestID, DiscRefID, DiscPer, DiscountType, UserId,
          BatchNo, PrevTableID, PrevDeptId, isTrnsfered, isChangeTrfAmt,
          ServiceCharge, ServiceCharge_Amount, Extra1, Extra2, Extra3, NCName, NCPurpose, isNCKOT
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `)

    const result = stmt.run(
      outletid ?? null,
      txnNo || null,
      TableID ?? null,
      Steward || null,
      PAX ?? null,
      toBool(AutoKOT),
      toBool(ManualKOT),
      TxnDatetime || null,
      finalGross,
      finalRevKOT,
      finalDiscount,
      finalCgst,
      finalSgst,
      finalIgst,
      finalCess,
      finalRoundOff,
      finalAmount,
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
      NCPurpose || null,
      toBool(isHeaderNCKOT)
    )

      const txnId = result.lastInsertRowid

      if (isArray) {
        const dStmt = db.prepare(`
          INSERT INTO TAxnTrnbilldetails (
            TxnID, outletid, ItemID, TableID,
            CGST, CGST_AMOUNT, SGST, SGST_AMOUNT, IGST, IGST_AMOUNT,
            CESS, CESS_AMOUNT, Discount_Amount, Qty, KOTNo, AutoKOT, ManualKOT, SpecialInst,
            isKOTGenerate, isSetteled, isNCKOT, isCancelled,
            DeptID, HotelID, RuntimeRate, RevQty, KOTUsedDate,
            isBilled
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `)

        const billDiscountType = Number(DiscountType) || 0
        const billDiscPer = Number(DiscPer) || 0
        const billDiscount = Number(Discount) || 0

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

          let itemDiscountAmount = 0
          if (billDiscountType === 1) { // Percentage
            itemDiscountAmount = (lineSubtotal * billDiscPer) / 100
          } else { // Fixed amount
            // As per requirement, the full fixed discount is applied to each item.
            itemDiscountAmount = billDiscount
          }
          const isNCKOT = toBool(d.isNCKOT)

          dStmt.run(
            txnId, // TxnID
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
            itemDiscountAmount,
            qty,
            d.KOTNo ?? null,
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
            d.KOTUsedDate || new Date().toISOString(), // KOTUsedDate
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

    // Always compute totals from details if provided, to ensure accuracy
    const isArray = Array.isArray(details) && details.length > 0;
    let computedGross = 0, computedCgstAmt = 0, computedSgstAmt = 0, computedIgstAmt = 0, computedCessAmt = 0, computedRevKOT = 0;
    if (isArray) {
      for (const d of details) {
        const qty = Number(d.Qty) || 0;
        const rate = Number(d.RuntimeRate) || 0;
        const revQty = Number(d.RevQty) || 0;
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
        computedRevKOT += revQty * rate;
      }
    }

    // Prioritize backend calculation if details are provided
    const finalGross = isArray ? computedGross : (Number(GrossAmt) || 0);
    const finalRevKOT = isArray ? computedRevKOT : (Number(RevKOT) || 0);
    const finalCgst = isArray ? computedCgstAmt : (Number(CGST) || 0);
    const finalSgst = isArray ? computedSgstAmt : (Number(SGST) || 0);
    const finalIgst = isArray ? computedIgstAmt : (Number(IGST) || 0);
    const finalCess = isArray ? computedCessAmt : (Number(CESS) || 0);
    const finalDiscount = Number(Discount) || 0;
    const finalRoundOff = Number(RoundOFF) || 0;

    // Calculate final amount based on computed/provided values
    const finalAmount = finalGross - finalDiscount + finalCgst + finalSgst + finalIgst + finalCess + finalRoundOff;

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
        finalGross,
        finalRevKOT,
        finalDiscount,
        finalCgst,
        finalSgst,
        finalIgst,
        finalCess,
        finalRoundOff,
        finalAmount,
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
            CGST, CGST_AMOUNT, SGST, SGST_AMOUNT, IGST, IGST_AMOUNT, CESS, CESS_AMOUNT,
            Discount_Amount, Qty, KOTNo, AutoKOT, ManualKOT, SpecialInst,
            isKOTGenerate, isSetteled, isNCKOT, isCancelled,
            DeptID, HotelID, RuntimeRate, RevQty, KOTUsedDate,
            isBilled
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `)
        const billDiscountType = Number(DiscountType) || 0
        const billDiscPer = Number(DiscPer) || 0
        const billDiscount = Number(Discount) || 0

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

          let itemDiscountAmount = 0
          if (billDiscountType === 1) { // Percentage
            itemDiscountAmount = (lineSubtotal * billDiscPer) / 100
          } else { // Fixed amount
            // As per requirement, the full fixed discount is applied to each item.
            itemDiscountAmount = billDiscount
          }

          const isNCKOT = toBool(d.isNCKOT)
          ins.run(
            Number(id),
            d.outletid ?? null,
            d.ItemID ?? null,
            d.TableID ?? null,
            cgstPer,
            cgstAmt,
            sgstPer,
            sgstAmt,
            igstPer,
            igstAmt,
            cessPer,
            cessAmt,
            itemDiscountAmount,
            qty,
            d.KOTNo ?? null,
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
            d.KOTUsedDate || new Date().toISOString(), // KOTUsedDate
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
          s.Batch || null, // Correctly sets Batch to null if not provided
          s.Name || null,
          s.OrderNo || bill.TxnNo, // Correctly assigns the bill's TxnNo to OrderNo
          s.HotelID ?? bill.HotelID ?? null,
          s.Name2 || null,
          s.Name3 || null
        )
      }

      db.prepare(`
        UPDATE TAxnTrnbill 
        SET isSetteled = 1, isBilled = 1, BilledDate = CURRENT_TIMESTAMP, orderNo = TxnNo
        WHERE TxnID = ?
      `).run(Number(id))

      db.prepare(`UPDATE TAxnTrnbilldetails SET isSetteled = 1 WHERE TxnID = ?`).run(Number(id))

      // Set table status to vacant (0) after settlement
      db.prepare(`UPDATE msttablemanagement SET status = 0 WHERE tableid = ?`).run(bill.TableID)
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

    // Also update the bill header to mark it as billed
    db.prepare(`
      UPDATE TAxnTrnbill
      SET isBilled = 1, BilledDate = CURRENT_TIMESTAMP
      WHERE TxnID = ?
    `).run(Number(id))

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
    // The frontend sends some keys in PascalCase (e.g., TableID), so we destructure them directly.
    const { outletid, TableID, UserId, HotelID, NCName, NCPurpose, DiscPer, Discount, DiscountType, details = [] } = req.body;

    console.log("Received Discount Data for KOT:", { DiscPer, Discount, DiscountType });

    if (!TableID) {
      return res.status(400).json({ success: false, message: "TableID is required" });
    }
    if (!Array.isArray(details) || details.length === 0) {
      return res.status(400).json({ success: false, message: "details array is required" });
    }

    const trx = db.transaction(() => {
      let txnId;
      // 1. Find or create the bill header for the table

      let finalDiscPer = Number(DiscPer) || 0;
      let finalDiscount = Number(Discount) || 0;
      let finalDiscountType = Number(DiscountType) || 0;

      let existingBill = db.prepare(`
        SELECT TxnID, DiscPer, Discount, DiscountType FROM TAxnTrnbill
        WHERE TableID = ? AND isCancelled = 0 AND isSetteled = 0 ORDER BY TxnID DESC LIMIT 1
      `).get(Number(TableID));

      if (existingBill) {
        txnId = existingBill.TxnID;
        console.log(`Using existing unbilled transaction. TxnID: ${txnId} for TableID: ${TableID}`);
        
        // If new discount is provided with KOT, update the main bill. Otherwise, use existing discount.
        if (Number(DiscPer) > 0 || Number(Discount) > 0) {
            db.prepare(`
                UPDATE TAxnTrnbill 
                SET DiscPer = ?, Discount = ?, DiscountType = ?
                WHERE TxnID = ?
            `).run(finalDiscPer, finalDiscount, finalDiscountType, txnId);
        } else {
            finalDiscPer = existingBill.DiscPer;
            finalDiscount = existingBill.Discount;
            finalDiscountType = existingBill.DiscountType;
        }
      } else {
        console.log(`No existing bill for table ${TableID}. Creating a new one.`);
        const isHeaderNCKOT = details.some(item => toBool(item.isNCKOT));
        let txnNo = null;
        if (outletid) {
          txnNo = generateTxnNo(outletid);
        }
        const insertHeaderStmt = db.prepare(`
          INSERT INTO TAxnTrnbill (
            outletid, TxnNo, TableID, UserId, HotelID, TxnDatetime,
            isBilled, isCancelled, isSetteled, status, AutoKOT,
            NCName, NCPurpose, DiscPer, Discount, DiscountType, isNCKOT
          ) VALUES (?, ?, ?, ?, ?, datetime('now'), 0, 0, 0, 1, 1, ?, ?, ?, ?, ?, ?)
        `);
        const result = insertHeaderStmt.run(outletid, txnNo, Number(TableID), UserId, HotelID, NCName || null, NCPurpose || null, finalDiscPer, finalDiscount, finalDiscountType, toBool(isHeaderNCKOT));
        txnId = result.lastInsertRowid;
        db.prepare('UPDATE msttablemanagement SET status = 1 WHERE tableid = ?').run(Number(TableID));
        console.log(`Created new bill. TxnID: ${txnId}. Updated table ${TableID} status.`);
      }

      // 2. Generate a new KOT number by finding the max KOT for the current day for that outlet.
      const maxKOTResult = db.prepare(`
        SELECT MAX(KOTNo) as maxKOT 
        FROM TAxnTrnbilldetails
        WHERE outletid = ? AND date(KOTUsedDate) = date('now')
      `).get(outletid);
      
      const kotNo = (maxKOTResult?.maxKOT || 0) + 1;
      console.log(`Generated KOT number: ${kotNo} (maxKOT was ${maxKOTResult?.maxKOT || 0})`);

      const insertDetailStmt = db.prepare(`
        INSERT INTO TAxnTrnbilldetails (
          TxnID, outletid, ItemID, TableID, Qty, RuntimeRate, DeptID, HotelID,
          isKOTGenerate, AutoKOT, KOTUsedDate, isBilled, isCancelled, isSetteled, isNCKOT,
          CGST, CGST_AMOUNT, SGST, SGST_AMOUNT, IGST, IGST_AMOUNT, CESS, CESS_AMOUNT, Discount_Amount, KOTNo
        ) VALUES (
          @TxnID, @outletid, @ItemID, @TableID, @Qty, @RuntimeRate, @DeptID, @HotelID,
          1, 1, datetime('now'), 0, 0, 0, @isNCKOT,
          @CGST, @CGST_AMOUNT, @SGST, @SGST_AMOUNT, @IGST, @IGST_AMOUNT, @CESS, @CESS_AMOUNT, @Discount_Amount, @KOTNo
        )
      `);

      for (const item of details) {
        const qty = Number(item.Qty) || 0;

        // If quantity is negative, it's a reversal for Re-KOT printing.
        // The actual DB update was already handled by the /reverse-quantity endpoint.
        // We skip it here to prevent inserting a new row with a negative quantity.
        if (qty < 0) {
          continue;
        }
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

        let itemDiscountAmount = 0;
        if (finalDiscountType === 1) { // Percentage
          itemDiscountAmount = (lineSubtotal * finalDiscPer) / 100;
        } else { // Fixed amount
          itemDiscountAmount = finalDiscount;
        }

        insertDetailStmt.run({
            TxnID: txnId,
            outletid: outletid,
            ItemID: item.ItemID,
            TableID: TableID,
            Qty: qty,
            RuntimeRate: rate,
            DeptID: item.DeptID,
            HotelID: HotelID,
            isNCKOT: isNCKOT,
            CGST: cgstPer,
            CGST_AMOUNT: cgstAmt,
            SGST: sgstPer,
            SGST_AMOUNT: sgstAmt,
            IGST: igstPer,
            IGST_AMOUNT: igstAmt,
            CESS: cessPer,
            CESS_AMOUNT: cessAmt,
            Discount_Amount: itemDiscountAmount,
            KOTNo: kotNo
        });
      }

      // Manually recalculate and update bill totals to ensure accuracy,
      // as relying on triggers can be inconsistent.
      const allDetails = db.prepare('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? AND isCancelled = 0').all(txnId);
      
      let totalGross = 0, totalCgst = 0, totalSgst = 0, totalIgst = 0, totalCess = 0, totalDiscount = 0;
      for (const d of allDetails) {
          const qty = Number(d.Qty) || 0;
          const rate = Number(d.RuntimeRate) || 0;
          totalGross += qty * rate;
          totalCgst += Number(d.CGST_AMOUNT) || 0;
          totalSgst += Number(d.SGST_AMOUNT) || 0;
          totalIgst += Number(d.IGST_AMOUNT) || 0;
          totalCess += Number(d.CESS_AMOUNT) || 0;
          totalDiscount += Number(d.Discount_Amount) || 0;
      }

      const billHeader = db.prepare('SELECT RoundOFF FROM TAxnTrnbill WHERE TxnID = ?').get(txnId);
      const roundOff = Number(billHeader?.RoundOFF) || 0;

      const totalAmount = totalGross - totalDiscount + totalCgst + totalSgst + totalIgst + totalCess + roundOff;

      db.prepare(`
          UPDATE TAxnTrnbill
          SET GrossAmt = ?, Discount = ?, CGST = ?, SGST = ?, IGST = ?, CESS = ?, Amount = ?
          WHERE TxnID = ?
      `).run(totalGross, totalDiscount, totalCgst, totalSgst, totalIgst, totalCess, totalAmount, txnId);
      return { txnId, kotNo };
    })(); // Immediately invoke the transaction

    const { txnId, kotNo } = trx;
    const header = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(txnId); // Fetch header
    const items = db.prepare(`
      SELECT d.*, m.item_name as ItemName
      FROM TAxnTrnbilldetails d
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE d.TxnID = ? AND d.isCancelled = 0 ORDER BY d.TXnDetailID
    `).all(txnId); // Fetch details with item_name

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
        b.TxnDatetime
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
    
    // Find the single unbilled bill for the table
    const bill = db.prepare(`
      SELECT TxnID
      FROM TAxnTrnbill
      WHERE TableID = ? AND isBilled = 0 AND isCancelled = 0 AND isSetteled = 0
    `).get(Number(tableId));

    let kotNo = null;
    if (bill) {
        // Get the latest KOTNo for that bill from the details table
        const latestKOTDetail = db.prepare(`
            SELECT MAX(KOTNo) as maxKotNo
            FROM TAxnTrnbilldetails
            WHERE TxnID = ?
        `).get(bill.TxnID);
        kotNo = latestKOTDetail ? latestKOTDetail.maxKotNo : null;
    }

    // Fetch all unbilled items for the table (not aggregated)
    const rows = db.prepare(`
      SELECT
        b.TxnID,
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

    // Fetch discount from the latest unbilled bill for the table
    const latestBill = db.prepare(`
      SELECT Discount, DiscPer, DiscountType
      FROM TAxnTrnbill
      WHERE TableID = ? AND isBilled = 0 AND isCancelled = 0
      ORDER BY TxnID DESC
      LIMIT 1
    `).get(Number(tableId));

    // Map to add isNew flag
    const items = rows.map(r => ({
      txnId: r.TxnID,
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

    res.json({ success: true, message: 'Fetched unbilled items', data: { kotNo: kotNo, items: items, discount: latestBill || { Discount: 0, DiscPer: 0, DiscountType: 0 } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch unbilled items', data: null, error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* F8 Key Press Handler - Reverse Quantity Mode                              */
/* -------------------------------------------------------------------------- */
exports.handleF8KeyPress = async (req, res) => {
  try {
    const { tableId, userId, txnDetailId, approvedByAdminId, reversalReason } = req.body;

    if (!tableId) {
      return res.status(400).json({ success: false, message: 'tableId is required', data: null });
    }

    // Note: ReverseQtyMode check is handled in the frontend
    // Backend assumes the request is valid when called

    // Get the latest KOT for the table (billed or unbilled)
    const latestKOT = db.prepare(`
      SELECT TxnID, KOTNo
      FROM TAxnTrnbill
      WHERE TableID = ? AND isCancelled = 0
      ORDER BY TxnID DESC
      LIMIT 1
    `).get(Number(tableId));

    if (!latestKOT) {
      return res.status(404).json({
        success: false,
        message: 'No active KOT found for this table',
        data: null
      });
    }

    // If txnDetailId is provided, handle individual item
    if (txnDetailId) {
      const item = db.prepare(`
        SELECT
          d.TXnDetailID,
          d.ItemID,
          d.Qty,
          d.RevQty,
          d.TxnID,
          d.KOTNo,
          d.RuntimeRate,
          COALESCE(m.item_name, 'Unknown Item') AS ItemName
        FROM TAxnTrnbilldetails d
        JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
        LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
        WHERE b.TableID = ? AND d.TXnDetailID = ? AND d.isCancelled = 0
      `).get(Number(tableId), Number(txnDetailId));

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found',
          data: null
        });
      }

      const currentQty = Number(item.Qty) || 0;
      const currentRevQty = Number(item.RevQty) || 0;
      const availableQty = currentQty - currentRevQty;

      if (availableQty <= 0) {
        return res.status(400).json({
          success: false,
          message: 'No quantity available to reverse for this item',
          data: null
        });
      }

      // Generate new KOT number for reversal
      const maxRevKOTResult = db.prepare(`
        SELECT MAX(d.RevKOTNo) as maxRevKOT
        FROM TAxnTrnbilldetails d
        JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
        WHERE b.TableID = ?
      `).get(Number(tableId));
      const newRevKOTNo = (maxRevKOTResult?.maxRevKOT || 0) + 1;

      // Update RevQty and KOTNo in database
      const newRevQty = currentRevQty + 1;
      const reverseAmount = Number(item.RuntimeRate) || 0;

      db.transaction(() => {
        db.prepare(`
          UPDATE TAxnTrnbilldetails
          SET RevQty = ?, RevKOTNo = ?
          WHERE TXnDetailID = ?
        `).run(newRevQty, newRevKOTNo, item.TXnDetailID);

        db.prepare(`
          UPDATE TAxnTrnbill
          SET RevKOT = COALESCE(RevKOT, 0) + ?
          WHERE TxnID = ?
        `).run(reverseAmount, item.TxnID);

        // Log the reversal

        // Update table status to occupied if it's not already
        db.prepare(`
          UPDATE msttablemanagement SET status = 1 WHERE tableid = ? AND status = 0
        `).run(tableId);

      })();

      return res.json({
        success: true,
        message: 'Item quantity reversed successfully',
        data: {
          txnDetailId: item.TXnDetailID,
          itemId: item.ItemID,
          itemName: item.ItemName,
          originalQty: currentQty,
          newRevQty: newRevQty,
          availableQty: availableQty - 1
        }
      });
    }

    // Get all unbilled items for the table (original F8 functionality)
    const unbilledItems = db.prepare(`
      SELECT
        d.TXnDetailID,
        d.TxnID,
        d.ItemID,
        d.Qty,
        d.RevQty,
        d.KOTNo,
        d.RuntimeRate,
        COALESCE(m.item_name, 'Unknown Item') AS ItemName
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE b.TableID = ? AND b.isBilled = 0 AND d.isCancelled = 0
    `).all(Number(tableId));

    if (!unbilledItems || unbilledItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No unbilled items found for this table',
        data: null
      });
    }

    // Process reverse quantity for items that have quantity > RevQty
    const updatedItems = [];
    const transaction = db.transaction(() => {
      let totalReverseAmount = 0;
      let billTxnId = null;

      for (const item of unbilledItems) {
        const currentQty = Number(item.Qty) || 0;
        const currentRevQty = Number(item.RevQty) || 0;
        const availableQty = currentQty - currentRevQty;

        if (availableQty > 0) {
          const newRevQty = currentRevQty + 1;
          db.prepare(`
            UPDATE TAxnTrnbilldetails
            SET RevQty = ?
            WHERE TXnDetailID = ?
          `).run(newRevQty, item.TXnDetailID);

          totalReverseAmount += Number(item.RuntimeRate) || 0;
          if (!billTxnId) {
            billTxnId = item.TxnID;
          }

          // Log the reversal
          db.prepare(`
            INSERT INTO TAxnTrnReversalLog ( 
              TxnDetailID, TxnID, KOTNo, RevKOTNo, ItemID,
              ActualQty, ReversedQty, RemainingQty, IsBeforeBill, IsAfterBill,
              ReversedByUserID, ApprovedByAdmin, HotelID, ReversalReason 
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            item.TXnDetailID, item.TxnID, item.KOTNo, null,
            item.ItemID, currentQty, 1,
            availableQty - 1, 1, 0,
            userId, approvedByAdminId || null, item.HotelID, reversalReason || null 
          );

          db.prepare(`
            UPDATE msttablemanagement SET status = 1 WHERE tableid = ? AND status = 0
          `).run(tableId);

          updatedItems.push({
            txnDetailId: item.TXnDetailID,
            itemId: item.ItemID,
            itemName: item.ItemName,
            originalQty: currentQty,
            newRevQty: newRevQty,
            availableQty: availableQty - 1
          });
        }
      }

      if (billTxnId && totalReverseAmount > 0) {
        db.prepare(`
          UPDATE TAxnTrnbill
          SET RevKOT = COALESCE(RevKOT, 0) + ?
          WHERE TxnID = ?
        `).run(totalReverseAmount, billTxnId);
      }
    });

    transaction();

    // Get updated items after transaction
    const finalItems = db.prepare(`
      SELECT
        d.TXnDetailID,
        d.ItemID,
        d.Qty,
        d.RevQty,
        (d.Qty - d.RevQty) as NetQty,
        d.RuntimeRate,
        COALESCE(m.item_name, 'Unknown Item') AS ItemName
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE b.TableID = ? AND b.isBilled = 0 AND d.isCancelled = 0
    `).all(Number(tableId));

    res.json({
      success: true,
      message: 'F8 key press processed successfully',
      data: {
        tableId: tableId,
        kotNo: latestKOT.KOTNo,
        updatedItems: updatedItems,
        allItems: finalItems,
        reverseQtyMode: true
      }
    });

  } catch (error) {
    console.error('Error in handleF8KeyPress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process F8 key press',
      data: null,
      error: error.message
    });
  }
}


// Simple reverse quantity function
exports.reverseQuantity = async (req, res) => {
  try {
    const { txnDetailId, userId, approvedByAdminId, reversalReason } = req.body;

    if (!txnDetailId) {
      return res.status(400).json({
        success: false,
        message: 'txnDetailId is required',
        data: null
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
        data: null
      });
    }

    // Get current item details
    const item = db.prepare(`
      SELECT TXnDetailID, Qty, RevQty, ItemID, TxnID, RuntimeRate, TableID, KOTNo, HotelID
      FROM TAxnTrnbilldetails
      WHERE TXnDetailID = ?
    `).get(Number(txnDetailId));

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
        data: null
      });
    }

    const currentQty = Number(item.Qty) || 0;
    const currentRevQty = Number(item.RevQty) || 0;
    const availableQty = currentQty - currentRevQty;

    if (availableQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No quantity available to reverse',
        data: null
      });
    }

    // Generate new KOT number for reversal
    const maxRevKOTResult = db.prepare(`
      SELECT MAX(d.RevKOTNo) as maxRevKOT
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
      WHERE b.TableID = ?
    `).get(item.TableID);
    const newRevKOTNo = (maxRevKOTResult?.maxRevKOT || 0) + 1;

    // Update RevQty and KOTNo
    const newRevQty = currentRevQty + 1;
    const reverseAmount = Number(item.RuntimeRate) || 0;

    db.transaction(() => {
      db.prepare(`
        UPDATE TAxnTrnbilldetails
        SET RevQty = ?, RevKOTNo = ?
        WHERE TXnDetailID = ?
      `).run(newRevQty, newRevKOTNo, item.TXnDetailID);

      db.prepare(`
        UPDATE TAxnTrnbill
        SET RevKOT = COALESCE(RevKOT, 0) + ?
        WHERE TxnID = ?
      `).run(reverseAmount, item.TxnID);

      // Log the reversal
      const bill = db.prepare('SELECT isBilled FROM TAxnTrnbill WHERE TxnID = ?').get(item.TxnID);
      const reverseType = bill && bill.isBilled ? 'AfterBill' : 'BeforeBill';

      const isBeforeBill = reverseType === 'BeforeBill' ? 1 : 0;
      const isAfterBill = reverseType === 'AfterBill' ? 1 : 0;

      db.prepare(`
        INSERT INTO TAxnTrnReversalLog ( 
          TxnDetailID, TxnID, KOTNo, RevKOTNo, ItemID, ActualQty, ReversedQty, RemainingQty, 
          IsBeforeBill, IsAfterBill, ReversedByUserID, ApprovedByAdmin, HotelID, ReversalReason 
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        item.TXnDetailID, item.TxnID, item.KOTNo, newRevKOTNo, item.ItemID, currentQty, 1, 
        availableQty - 1, isBeforeBill, isAfterBill, userId, approvedByAdminId || null, item.HotelID, reversalReason || null
      );

    })();

    res.json({
      success: true,
      message: 'Quantity reversed successfully',
      data: {
        txnDetailId: item.TXnDetailID,
        originalQty: currentQty,
        newRevQty: newRevQty,
        availableQty: availableQty
      }
    });

  } catch (error) {
    console.error('Error in reverseQuantity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reverse quantity',
      data: null,
      error: error.message
    });
  }
}

exports.getLatestBilledBillForTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    if (!tableId) {
      return res.status(400).json({ success: false, message: 'tableId is required', data: null });
    }

    // Step 1: Fetch the latest billed and unsettled transaction for the table
    const bill = db.prepare(`
      SELECT * 
      FROM TAxnTrnbill 
      WHERE TableID = ? AND isBilled = 1 AND isSetteled = 0
      ORDER BY TxnID DESC 
      LIMIT 1
    `).get(Number(tableId));

    if (!bill) {
      return res.status(404).json({ success: false, message: 'No billed and unsettled transaction found for this table.', data: null });
    }

    // Step 2: Load all items (billed and unbilled) associated with that transaction
    const allDetailsForBill = db.prepare(`
      SELECT d.*, m.item_name as ItemName
      FROM TAxnTrnbilldetails d
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE d.TxnID = ? AND d.isCancelled = 0
      ORDER BY d.TXnDetailID ASC
    `).all(bill.TxnID);

    // Step 3: Check for any *other* unbilled transactions for the same table that might have been created after the bill was printed.
    // This is a fallback and might not be the primary logic path if new items are added to the *same* bill.
    const otherUnbilledItems = db.prepare(`
      SELECT d.*, m.item_name as ItemName
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE b.TableID = ? AND b.isBilled = 0 AND b.isCancelled = 0 AND d.isCancelled = 0
    `).all(Number(tableId));

    // Combine the details. The primary details are from the billed transaction.
    // The frontend will handle displaying them correctly.
    const combinedDetails = [...allDetailsForBill, ...otherUnbilledItems];

    // Respond with the main billed transaction header and all associated items (billed and new)
    res.json(ok('Fetched billed and unbilled items for the table', { ...bill, details: combinedDetails }));

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch latest billed bill', data: null, error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* 10) printBill → update isBilled = 1 for all items in a bill when printed  */
/* -------------------------------------------------------------------------- */
exports.printBill = async (req, res) => {
  try {
    const { id } = req.params

    const bill = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(Number(id))
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found', data: null })

    // Update isBilled = 1 for all items in the bill
    const updateStmt = db.prepare('UPDATE TAxnTrnbilldetails SET isBilled = 1 WHERE TxnID = ?')
    updateStmt.run(Number(id))

    // Also update the bill header to mark it as billed
    db.prepare(`
      UPDATE TAxnTrnbill
      SET isBilled = 1, BilledDate = CURRENT_TIMESTAMP
      WHERE TxnID = ?
    `).run(Number(id))

    const header = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(Number(id))
    const items = db.prepare('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? ORDER BY TXnDetailID').all(Number(id))

    res.json(ok('Bill marked as printed and billed', { ...header, details: items }))
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark bill as printed', data: null, error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* 11) markBillAsBilled → update isBilled = 1 for a bill and its items        */
/* -------------------------------------------------------------------------- */
exports.markBillAsBilled = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(Number(id));
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found', data: null });
    }

    // Update isBilled = 1 for all items in the bill
    db.prepare('UPDATE TAxnTrnbilldetails SET isBilled = 1 WHERE TxnID = ?').run(Number(id));

    // Update the bill header to mark it as billed and set the date
    db.prepare(`
      UPDATE TAxnTrnbill
      SET isBilled = 1, BilledDate = CURRENT_TIMESTAMP
      WHERE TxnID = ?
    `).run(Number(id));

    const header = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(Number(id));
    const items = db.prepare('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? ORDER BY TXnDetailID').all(Number(id));

    res.json(ok('Bill marked as billed', { ...header, details: items }));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark bill as billed', data: null, error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* generateTxnNo → generate transaction number and create bill record       */
/* -------------------------------------------------------------------------- */
exports.generateTxnNo = async (req, res) => {
  try {
    const { outletid, tableId, userId } = req.body;

    if (!outletid || !tableId) {
      return res.status(400).json({ success: false, message: 'outletid and tableId are required', data: null })
    }

    const trx = db.transaction(() => {
      const txnNo = generateTxnNo(outletid);

      const insertStmt = db.prepare(`
        INSERT INTO TAxnTrnbill (
          outletid, TxnNo, TableID, UserId, TxnDatetime, isBilled, isCancelled, isSetteled
        ) VALUES (?, ?, ?, ?, datetime('now'), 0, 0, 0)
      `);

      const insertResult = insertStmt.run(outletid, txnNo, tableId, userId);
      const txnId = insertResult.lastInsertRowid;

      return { txnNo, txnId };
    });

    const { txnNo, txnId } = trx();

    res.json(ok('TxnNo generated and bill created', { txnNo, txnId }));
  } catch (error) {
    console.error('Error generating TxnNo:', error);
    res.status(500).json({ success: false, message: 'Failed to generate TxnNo: ' + error.message, data: null });
  }
};


module.exports = exports
