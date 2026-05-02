const db = require('../config/db')

// Utility: standard success response
function ok(message, data) {
  return { success: true, message, data } 
}
function toBool(value) { 
  return value ? 1 : 0
}
async function generateTxnNo(outletid) {
  console.log(`🔍 generateTxnNo called for outletid: ${outletid}`);
  // 1. Fetch bill_prefix from settings
  const [settingsRows] = await db.query('SELECT bill_prefix FROM mstbill_preview_settings WHERE outletid = ?', [outletid]);
  const settings = settingsRows[0] || {};
  const billPrefix = settings.bill_prefix || 'BILL-';

  // 2. Construct a date-based prefix for searching to ensure daily unique sequence
  const prefix = `${billPrefix}`;
  const prefixLen = prefix.length + 1;
  const likePattern = prefix + '%';

  // 3. Find the maximum sequence number for the current day for the entire outlet
  const [resultRows] = await db.query(`
    SELECT MAX(CAST(SUBSTRING(TxnNo, ?) AS UNSIGNED)) as maxSeq
    FROM TAxnTrnbill
    WHERE outletid = ? AND TxnNo LIKE ?
  `, [prefixLen, outletid, likePattern]);
  const result = resultRows[0] || {};
  const newSeq = (result.maxSeq || 0) + 1;

  // 4. Construct the final TxnNo, e.g., "BILL-20240521-0001"
  return `${prefix}${String(newSeq).padStart(4, '0')}`;
}

// Generate a new OrderNo
async function generateOrderNo(outletid) {
  console.log(`🔍 generateOrderNo called for outletid: ${outletid}`);
  // For simplicity, we'll generate a unique order number across all outlets for now.
  // You could add a prefix based on outlet if needed.
  const [resultRows] = await db.query(
    `SELECT MAX(CAST(orderNo AS UNSIGNED)) as maxOrderNo FROM TAxnTrnbill`
  );
  const result = resultRows[0] || {};
  const newOrderNo = (result.maxOrderNo || 0) + 1;
  return String(newOrderNo).padStart(4, '0');
}

// Convert to India Standard Time (UTC+5:30)
function toIST(date) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000
  const istOffset = 5.5 * 60 * 60000
  return new Date(utc + istOffset)
}

/* -------------------------------------------------------------------------- */
/* 1) getAllBills → fetch all bills with details (no settlement)              */
/* -------------------------------------------------------------------------- */
exports.getAllBills = async (req, res) => {
  try {
    const { isBilled, tableId } = req.query

    let whereClauses = ['b.isCancelled = 0']
    const params = []

    if (isBilled !== undefined) {
      whereClauses.push('b.isBilled = ?')
      params.push(Number(isBilled))
    }

    if (tableId !== undefined) {
      whereClauses.push('b.TableID = ?')
      params.push(Number(tableId))
    }

    const sql = `
SELECT 
        b.*,
        b.isHomeDelivery,
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
            'isBilled', d.isBilled
          )
        ) as _details
      FROM TAxnTrnbill b
      LEFT JOIN TAxnTrnbilldetails d 
        ON d.TxnID = b.TxnID AND d.isCancelled = 0
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY b.TxnID
      ORDER BY b.TxnDatetime DESC
    `

    const rows = await db.query(sql, params)
    
    // Convert rows to expected format (db.query returns [rows, fields])
    const dataRows = Array.isArray(rows) && rows[0] ? rows[0] : rows

    const data = (Array.isArray(dataRows) ? dataRows : []).map((r) => ({
      ...r,
      details: r._details ? JSON.parse(`[${r._details}]`) : [],
    }))
    res.json(ok('Fetched all bills', data))
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch bills', data: null, error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* 2) getBillById → header + details + settlements                            */
/* -------------------------------------------------------------------------- */
exports.getBillById = async (req, res) => {
  try {
    const { id } = req.params
    const [billRows] = await db.query(`SELECT * FROM TAxnTrnbill WHERE TxnID = ?`, [Number(id)])
    const bill = billRows[0]
    if (!bill)
      return res.status(404).json({ success: false, message: 'Bill not found', data: null })

    const [detailsRows] = await db.query(
      `
      SELECT d.*, m.item_name as ItemName
      FROM TAxnTrnbilldetails d
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE d.TxnID = ? AND d.isCancelled = 0
      ORDER BY d.TXnDetailID ASC
    `, [Number(id)])
    const details = detailsRows

    const [settlementsRows] = await db.query(
      `
      SELECT * FROM TrnSettlement
      WHERE OrderNo = ? AND HotelID = ?
      ORDER BY SettlementID
    `, [bill.orderNo || null, bill.HotelID || null])
    const settlements = settlementsRows

    const [kotResultRows] = await db.query(
      `
      SELECT MAX(KOTNo) as maxKOT
      FROM TAxnTrnbilldetails
      WHERE TxnID = ?
    `, [Number(id)])
    const kotResult = kotResultRows[0]

    const kotNo = kotResult?.maxKOT || bill.orderNo || null

    res.json(ok('Fetched bill', { header: { ...bill, customerid: bill.customerid }, details, settlement: settlements, kotNo }))
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch bill', data: null, error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* 3) createBill → insert new bill + details                                  */
/* -------------------------------------------------------------------------- */
exports.createBill = async (req, res) => {
  try {
    const {
      outletid,
      TxnNo,
      TableID,
      Steward,
      PAX,
      AutoKOT,
      ManualKOT,
      TxnDatetime,
      GrossAmt,
      RevKOT,
      Discount,
      CGST,
      SGST,
      IGST,
      CESS,
      RoundOFF,
      Amount,
      TaxableValue,
      isHomeDelivery,
      DriverID,
      CustomerName,
      MobileNo,
      Address,
      Landmark,
      orderNo,
      isPickup,
      HotelID,
      customerid,
      DiscRefID,
      DiscPer,
      DiscountType,
      UserId,
      table_name,
      BatchNo,
      PrevTableID,
      PrevDeptId,
      isTrnsfered,
      isChangeTrfAmt,
      ServiceCharge,
      ServiceCharge_Amount,
      Extra1,
      Extra2,
      Extra3,
      NCName,
      NCPurpose,
      details = [],
    } = req.body

    const DeptID = details.length > 0 ? details[0].DeptID : null

    const isHeaderNCKOT = details.some((item) => toBool(item.isNCKOT))

    const finalGross = Number(GrossAmt) || 0
    const finalRevKOT = Number(RevKOT) || 0
    const finalCgst = Number(CGST) || 0
    const finalSgst = Number(SGST) || 0
    const finalIgst = Number(IGST) || 0
    const finalCess = Number(CESS) || 0
    const finalDiscount = Number(Discount) || 0
    const finalRoundOff = Number(RoundOFF) || 0
    const finalAmount = Number(Amount) || 0
    const finalTaxableValue = Number(TaxableValue) || 0

    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
let txnNo = TxnNo
      if (!txnNo && outletid) {
        txnNo = await generateTxnNo(outletid)
      }

      const [result] = await db.query(`
        INSERT INTO TAxnTrnbill (
          outletid, TxnNo, TableID, Steward, PAX, AutoKOT, ManualKOT, TxnDatetime,
          GrossAmt, RevKOT, Discount, CGST, SGST, IGST, CESS, RoundOFF, Amount, TaxableValue, table_name,
          isHomeDelivery, DriverID, CustomerName, MobileNo, Address, Landmark,
          orderNo, isPickup, HotelID, customerid, DiscRefID, DiscPer, DiscountType, UserId,
          BatchNo, PrevTableID, PrevDeptId, isTrnsfered, isChangeTrfAmt,
          ServiceCharge, ServiceCharge_Amount, Extra1, Extra2, Extra3, NCName, NCPurpose, isNCKOT, DeptID
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `, [
        outletid ?? null,
        txnNo || null,
        TableID ?? null,
        table_name || null,
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
        finalTaxableValue,
        toBool(isHomeDelivery),
        DriverID ?? null,
        CustomerName || null,
        MobileNo || null,
        Address || null,
        Landmark || null,
        orderNo || null,
        toBool(isPickup),
        HotelID ?? null,
        customerid ?? null,
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
        toBool(isHeaderNCKOT),
        DeptID,
      ])

      const txnId = result.insertId

      const isArray = Array.isArray(details) && details.length > 0
      if (isArray) {
        for (const d of details) {
          const cgstPer = Number(d.CGST) || 0
          const cgstAmt = Number(d.CGST_AMOUNT) || 0
          const sgstPer = Number(d.SGST) || 0
          const sgstAmt = Number(d.SGST_AMOUNT) || 0
          const igstPer = Number(d.IGST) || 0
          const igstAmt = Number(d.IGST_AMOUNT) || 0
          const cessPer = Number(d.CESS) || 0
          const cessAmt = Number(d.CESS_AMOUNT) || 0
          
          const itemDiscountAmount = Number(d.Discount_Amount) || 0
          const isNCKOT = toBool(d.isNCKOT)

          await db.query(`
            INSERT INTO TAxnTrnbilldetails (
              TxnID, outletid, ItemID, TableID, table_name,
              CGST, CGST_AMOUNT, SGST, SGST_AMOUNT, IGST, IGST_AMOUNT,
              CESS, CESS_AMOUNT, Discount_Amount, Qty, KOTNo, AutoKOT, ManualKOT, SpecialInst,
              isKOTGenerate, isSetteled, isNCKOT, isCancelled,
              DeptID, HotelID, RuntimeRate, RevQty, KOTUsedDate,
              isBilled, item_no, item_name
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          `, [
            txnId,
            d.outletid ?? null,
            d.ItemID ?? null,
            d.TableID ?? null,
            table_name || null,
            cgstPer,
            cgstAmt,
            sgstPer,
            sgstAmt,
            igstPer,
            igstAmt,
            cessPer,
            cessAmt,
            itemDiscountAmount,
            Number(d.Qty) || 0,
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
            Number(d.RuntimeRate) || 0,
            Number(d.RevQty) || 0,
            d.KOTUsedDate || null,
            0,
            d.item_no ?? null,
            d.item_name || null,
          ])
        }
      }

      await db.query('COMMIT')
      
      const [header] = await db.query('SELECT * FROM TAxnTrnbill WHERE TxnID = ?', [txnId])
      const [items] = await db.query('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? ORDER BY TXnDetailID', [txnId])
      
      res.json(ok('Bill created', { ...header[0], customerid: header[0].customerid, details: items }))
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to create bill', data: null, error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* 4) updateBill → update bill + replace details                              */
/* -------------------------------------------------------------------------- */
exports.updateBill = async (req, res) => {
  try {
    const { id } = req.params
    const {
      outletid,
      TxnNo,
      TableID,
      Steward,
      PAX,
      AutoKOT,
      ManualKOT,
      TxnDatetime,
      GrossAmt,
      RevKOT,
      Discount,
      CGST,
      SGST,
      IGST,
      CESS,
      RoundOFF,
      Amount,
      TaxableValue,
      isHomeDelivery,
      DriverID,
      CustomerName,
      MobileNo,
      Address,
      Landmark,
      table_name,
      orderNo,
      isPickup,
      HotelID,
      customerid,
      DiscRefID,
      DiscPer,
      DiscountType,
      UserId,
      BatchNo,
      PrevTableID,
      PrevDeptId,
      isTrnsfered,
      isChangeTrfAmt,
      ServiceCharge,
      ServiceCharge_Amount,
      Extra1,
      Extra2,
      Extra3,
      details = [],
    } = req.body

    // Use frontend calculated values directly
    const finalGross = Number(GrossAmt) || 0
    const finalRevKOT = Number(RevKOT) || 0
    const finalCgst = Number(CGST) || 0
    const finalSgst = Number(SGST) || 0
    const finalIgst = Number(IGST) || 0
    const finalCess = Number(CESS) || 0
    const finalDiscount = Number(Discount) || 0
    const finalRoundOff = Number(RoundOFF) || 0
    const finalAmount = Number(Amount) || 0
    const finalTaxableValue = Number(TaxableValue) || 0
// 
    // console.log('Using frontend values for updateBill - Gross:', finalGross, 'Amount:', finalAmount)

    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
      const [updateResult] = await db.query(`
        UPDATE TAxnTrnbill SET
          outletid=?, TxnNo=?, TableID=?, table_name=?, Steward=?, PAX=?, AutoKOT=?, ManualKOT=?, TxnDatetime=?,
          GrossAmt=?, RevKOT=?, Discount=?, CGST=?, SGST=?, IGST=?, CESS=?, RoundOFF=?, Amount=?, TaxableValue=?,
          isHomeDelivery=?, DriverID=?, CustomerName=?, MobileNo=?, Address=?, Landmark=?,
          orderNo=?, isPickup=?, HotelID=?, customerid=?, DiscRefID=?, DiscPer=?, DiscountType=?, UserId=?,
          BatchNo=?, PrevTableID=?, PrevDeptId=?, isTrnsfered=?, isChangeTrfAmt=?,
          ServiceCharge=?, ServiceCharge_Amount=?, Extra1=?, Extra2=?, Extra3=?
        WHERE TxnID=?
      `, [
        outletid ?? null,
        TxnNo || null,
        TableID ?? null,
        table_name || null,
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
        finalTaxableValue,
        toBool(isHomeDelivery),
        DriverID ?? null,
        CustomerName || null,
        MobileNo || null,
        Address || null,
        Landmark || null,
        orderNo || null,
        toBool(isPickup),
        HotelID ?? null,
        customerid ?? null,
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
        Number(id),
      ])

      await db.query('DELETE FROM TAxnTrnbilldetails WHERE TxnID = ?', [Number(id)])

      const isArray = Array.isArray(details) && details.length > 0
      if (isArray) {
        for (const d of details) {
          // Use frontend calculated values directly
          const cgstPer = Number(d.CGST) || 0
          const cgstAmt = Number(d.CGST_AMOUNT) || 0
          const sgstPer = Number(d.SGST) || 0
          const sgstAmt = Number(d.SGST_AMOUNT) || 0
          const igstPer = Number(d.IGST) || 0
          const igstAmt = Number(d.IGST_AMOUNT) || 0
          const cessPer = Number(d.CESS) || 0
          const cessAmt = Number(d.CESS_AMOUNT) || 0

          // Use frontend calculated discount amount
          const itemDiscountAmount = Number(d.Discount_Amount) || 0

          const isNCKOT = toBool(d.isNCKOT)
          
          await db.query(`
            INSERT INTO TAxnTrnbilldetails (
              TxnID, outletid, ItemID, TableID, table_name,
              CGST, CGST_AMOUNT, SGST, SGST_AMOUNT, IGST, IGST_AMOUNT, CESS, CESS_AMOUNT,
              Discount_Amount, Qty, KOTNo, AutoKOT, ManualKOT, SpecialInst,
              isKOTGenerate, isSetteled, isNCKOT, isCancelled,
              DeptID, HotelID, RuntimeRate, RevQty, KOTUsedDate,
              isBilled
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          `, [
            Number(id),
            d.outletid ?? null,
            d.ItemID ?? null,
            d.TableID ?? null,
            table_name || null,
            cgstPer,
            cgstAmt,
            sgstPer,
            sgstAmt,
            igstPer,
            igstAmt,
            cessPer,
            cessAmt,
            itemDiscountAmount,
            Number(d.Qty) || 0,
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
            Number(d.RuntimeRate) || 0,
            Number(d.RevQty) || 0,
            d.KOTUsedDate || null, // KOTUsedDate
            0, // isBilled default to 0
          ])
        }
      }
      
      await db.query('COMMIT')
      
      const [header] = await db.query('SELECT * FROM TAxnTrnbill WHERE TxnID = ?', [Number(id)])
      const [items] = await db.query('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? ORDER BY TXnDetailID', [Number(id)])
      
      res.json(ok('Bill updated', { ...header[0], details: items }))
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to update bill', data: null, error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* 5) deleteBill → delete bill + details                                      */
/* -------------------------------------------------------------------------- */
exports.deleteBill = async (req, res) => {
  try {
    const { id } = req.params
    
    await db.query('START TRANSACTION')
    
    try {
      await db.query('DELETE FROM TAxnTrnbilldetails WHERE TxnID = ?', [Number(id)])
      const [result] = await db.query('DELETE FROM TAxnTrnbill WHERE TxnID = ?', [Number(id)])
      const success = result.affectedRows > 0
      
      await db.query('COMMIT')
      
      res.json(
        success
          ? ok('Bill deleted', { id: Number(id) })
          : { success: false, message: 'Bill not found', data: null },
      )
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to delete bill', data: null, error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* 6) settleBill → insert settlement + mark settled                           */
/* -------------------------------------------------------------------------- */
exports.settleBill = async (req, res) => {
  try {
    const { id } = req.params
    const { settlements = [], curr_date, TipAmount } = req.body

    if (!Array.isArray(settlements) || settlements.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'settlements array is required', data: null })
    }

    const [billRows] = await db.query('SELECT * FROM TAxnTrnbill WHERE TxnID = ?', [Number(id)])
    const bill = billRows[0]
    if (!bill)
      return res.status(404).json({ success: false, message: 'Bill not found', data: null })

    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
      for (const s of settlements) {
        // Use InsertDate from request body if provided, otherwise use current datetime
        const insertDate = s.InsertDate ? s.InsertDate : new Date().toISOString().replace('T', ' ').substring(0, 19);
        
        // Get TipAmount - default to 0 if not provided
        const tipAmount = TipAmount != null ? Number(TipAmount) : 0;
        
        // 🔥 FIX: For Credit payments, use customer data from settlement object
        // For non-credit payments, fallback to bill's customer data
        const isCredit = s.PaymentType && s.PaymentType.toLowerCase() === 'credit';
        
        let customerId = bill.customerid;
        let customerName = bill.CustomerName;
        let mobileNo = bill.MobileNo;
        
        if (isCredit && s.customerid) {
          // Use credit-specific customer data from settlement
          customerId = s.customerid;
          customerName = s.customerName || customerName;
          mobileNo = s.mobile || mobileNo;
        }
        
        await db.query(`
          INSERT INTO TrnSettlement (
            PaymentTypeID, PaymentType, Amount, Batch, Name, OrderNo, HotelID, 
            TxnID, TxnNo, UserId, customerid, CustomerName, MobileNo, 
            Receive, Refund, TipAmount, table_name, isSettled, InsertDate
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        `, [
          s.PaymentTypeID ?? 1,
          s.PaymentType || null,
          Number(s.Amount) || 0,
          s.Batch || null,
          s.Name || null,
          bill.orderNo || bill.TxnNo,
          bill.HotelID,
          Number(id),
          bill.TxnNo,
          bill.UserId,
          customerId,           // 🔥 Use customer ID from settlement for credit
          customerName,         // 🔥 Use customer name from settlement for credit
          mobileNo,             // 🔥 Use mobile from settlement for credit
          Number(s.received_amount) || 0,
          Number(s.refund_amount) || 0,
          tipAmount,
          bill.table_name || null,
          insertDate
        ])
      }

      await db.query(`
        UPDATE TAxnTrnbill 
        SET isSetteled = 1, isBilled = 1, BilledDate = CURRENT_TIMESTAMP, orderNo = COALESCE(orderNo, TxnNo)
        WHERE TxnID = ?
      `, [Number(id)])

      await db.query(`UPDATE TAxnTrnbilldetails SET isSetteled = 1 WHERE TxnID = ?`, [Number(id)])

      // Set table status to vacant (0) after settlement
      if (bill.TableID) {
        const [tableInfoRows] = await db.query(`SELECT * FROM msttablemanagement WHERE tableid = ?`, [bill.TableID]);
        const tableInfo = tableInfoRows[0];
        await db.query(`UPDATE msttablemanagement SET status = 0 WHERE tableid = ?`, [bill.TableID])
        await db.query(`DELETE FROM msttablemanagement WHERE tableid = ? AND isTemporary = 1`, [bill.TableID])
      }
      
      await db.query('COMMIT')
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

    const [headerRows] = await db.query('SELECT * FROM TAxnTrnbill WHERE TxnID = ?', [Number(id)])
    const header = headerRows[0]
    const [items] = await db.query('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? ORDER BY TXnDetailID', [Number(id)])
    const [stl] = await db.query(`
      SELECT * FROM TrnSettlement 
      WHERE OrderNo = ? AND HotelID = ?
      ORDER BY SettlementID
    `, [header.orderNo || null, header.HotelID || null])

    res.json(ok('Bill settled', { ...header, customerid: header.customerid, details: items, settlement: stl }))
  } catch (error) {
    console.error('--- ERROR in settleBill ---')
    console.error(error)
    res
      .status(500)
      .json({ success: false, message: 'Failed to settle bill', data: null, error: error.message })
  }
}

exports.addItemToBill = async (req, res) => {
  try {
    const { id } = req.params
    const { details = [] } = req.body

    if (!Array.isArray(details) || details.length === 0) {
      return res.status(400).json({ success: false, message: 'details array required', data: null })
    }

    const [billRows] = await db.query('SELECT * FROM TAxnTrnbill WHERE TxnID = ?', [Number(id)])
    const bill = billRows[0]
    if (!bill)
      return res.status(404).json({ success: false, message: 'Bill not found', data: null })

    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
      for (const it of details) {
        const isNCKOT = toBool(it.isNCKOT)
        await db.query(`
          INSERT INTO TAxnTrnbilldetails (
            TxnID, ItemID, Qty, RuntimeRate, AutoKOT, ManualKOT, SpecialInst, DeptID, HotelID,
            isBilled, isNCKOT, NCName, NCPurpose
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        `, [
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
          isNCKOT, // isNCKOT as provided or 0
          isNCKOT ? it.NCName || null : null,
          isNCKOT ? it.NCPurpose || null : null,
        ])
      }
      
      await db.query('COMMIT')
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }
    
    const [headerRows] = await db.query('SELECT * FROM TAxnTrnbill WHERE TxnID = ?', [Number(id)])
    const header = headerRows[0]
    const [items] = await db.query('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? ORDER BY TXnDetailID', [Number(id)])

    res.json({ success: true, message: 'Items added', data: { ...header, details: items } })
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to add items', data: null, error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* 7) updateBillItemsIsBilled → update isBilled = 1 for all items in a bill   */
/* -------------------------------------------------------------------------- */
exports.updateBillItemsIsBilled = async (req, res) => {
  try {
    const { id } = req.params

    const [billRows] = await db.query('SELECT * FROM TAxnTrnbill WHERE TxnID = ?', [Number(id)])
    const bill = billRows[0]
    if (!bill)
      return res.status(404).json({ success: false, message: 'Bill not found', data: null })

    await db.query('UPDATE TAxnTrnbilldetails SET isBilled = 1 WHERE TxnID = ?', [Number(id)])

    // Also update the bill header to mark it as billed
    await db.query(`
      UPDATE TAxnTrnbill
      SET isBilled = 1, BilledDate = CURRENT_TIMESTAMP
      WHERE TxnID = ?
    `, [Number(id)])

    const [headerRows] = await db.query('SELECT * FROM TAxnTrnbill WHERE TxnID = ?', [Number(id)])
    const header = headerRows[0]
    const [items] = await db.query('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? ORDER BY TXnDetailID', [Number(id)])

    res.json(ok('Bill items marked as billed', { ...header, details: items }))
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to update bill items isBilled',
        data: null,
        error: error.message,
      })
  }
}

/* -------------------------------------------------------------------------- */
/* 8) createKOT → insert new KOT + details (only new/extra items)             */
/* -------------------------------------------------------------------------- */
exports.createKOT = async (req, res) => {
  try {
     console.log('Received createKOT body:', JSON.stringify(req.body, null, 2))
// Correctly destructure from the frontend payload which uses camelCase (e.g., tableId, userId)
    const {
    outletid,
    tableId: TableID,
    table_name,
    userId: UserId,
    hotelId: HotelID,
    NCName,
    NCPurpose,
    DiscPer,
    Discount,
    DiscountType,
    CustomerName,
    MobileNo,
    customerid,
    Order_Type,
    PAX,
    Steward,
    TxnDatetime,
    KOTUsedDate,
    curr_date,
    device_name,

    // Frontend calculated values - use directly
    GrossAmt,
    TaxableValue,
    CGST,
    SGST,
    IGST,
    CESS,
    RoundOFF,
    Amount,

    items: details = [],
  } = req.body

     console.log('Received Discount Data for KOT:', { DiscPer, Discount, DiscountType })
    // console.log('Received Calculated Values from Frontend:', { GrossAmt, TaxableValue, CGST, SGST, IGST, CESS, RoundOFF, Amount })
    let order_tag = req.body.order_tag

    if (!Array.isArray(details) || details.length === 0) {
      // console.log('Details array is empty or not an array')
      return res.status(400).json({ success: false, message: 'details array is required' })
    }

    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
      let txnId
      // 1. Find or create the bill header for the table

      let finalDiscPer = Number(DiscPer) || 0
      let finalDiscount = Number(Discount) || 0
      let finalDiscountType = Number(DiscountType) || 0
      const isHeaderNCKOT = details.some((item) => toBool(item.isNCKOT))

      // Use the provided txnId from the payload if it exists
      const { txnId: payloadTxnId } = req.body

      let existingBill = null
      // Search for an existing bill by TableID (for Dine-in) or by TxnID (for Pickup/Delivery)
      // ✅ Modified to find billed but unsettled bills as well
      if (payloadTxnId) {
        // This check is now first
        // For Pickup/Delivery or subsequent KOTs for Dine-in, find the bill by its TxnID
        const [existingBillRows] = await db.query(
          'SELECT TxnID, DiscPer, Discount, DiscountType, isNCKOT, isBilled, GrossAmt, TaxableValue, CGST, SGST, IGST, CESS, RoundOFF, Amount FROM TAxnTrnbill WHERE TxnID = ?',
          [payloadTxnId]
        )
        existingBill = existingBillRows[0]
        // console.log('Existing bill found by TxnID:', existingBill)
      } else if (TableID && TableID > 0) {
        const [existingBillRows] = await db.query(
          `
          SELECT TxnID, DiscPer, Discount, DiscountType, isNCKOT, isBilled, GrossAmt, TaxableValue, CGST, SGST, IGST, CESS, RoundOFF, Amount FROM TAxnTrnbill
          WHERE TableID = ? AND isCancelled = 0 AND isSetteled = 0 ORDER BY TxnID DESC LIMIT 1
        `,
          [Number(TableID)]
        )
        existingBill = existingBillRows[0]
        // console.log('Existing bill found by TableID:', existingBill)
      }

      // Use frontend calculated values or fall back to existing/0
      let finalGrossAmt = Number(GrossAmt) || (existingBill ? Number(existingBill.GrossAmt) : 0) || 0
      let finalTaxableValue = Number(TaxableValue) || (existingBill ? Number(existingBill.TaxableValue) : 0) || 0
      let finalCgst = Number(CGST) || (existingBill ? Number(existingBill.CGST) : 0) || 0
      let finalSgst = Number(SGST) || (existingBill ? Number(existingBill.SGST) : 0) || 0
      let finalIgst = Number(IGST) || (existingBill ? Number(existingBill.IGST) : 0) || 0
      let finalCess = Number(CESS) || (existingBill ? Number(existingBill.CESS) : 0) || 0
      let finalRoundOff = Number(RoundOFF) || (existingBill ? Number(existingBill.RoundOFF) : 0) || 0
      let finalAmount = Number(Amount) || (existingBill ? Number(existingBill.Amount) : 0) || 0

      if (existingBill) {
        txnId = existingBill.TxnID
        // console.log(`Using existing unbilled transaction. TxnID: ${txnId} for TableID: ${TableID}`)

        // ✅ If the existing bill was already billed, reset its status to allow for re-billing.
        if (existingBill.isBilled === 1) {
          await db.query('UPDATE TAxnTrnbill SET isBilled = 0 WHERE TxnID = ?', [txnId])
        }
        // Always update the bill header with the latest information, including table_name.
        // Use new discount/NC info if provided, otherwise fall back to existing values.
        // Also update with frontend calculated values
        const isHomeDeliveryUpdateFlag = toBool(req.body.isHomeDelivery ?? (Order_Type === 'Delivery' ? 1 : 0));
        await db.query(
          `
            UPDATE TAxnTrnbill
            SET
              table_name = ?,
              Steward = ?,
              PAX = ?,
              DiscPer = ?,
              Discount = ?,
              DiscountType = ?,
              Order_Type = ?,
              NCName = ?,
              NCPurpose = ?,
              isNCKOT = ?,
              CustomerName = COALESCE(?, CustomerName),
              MobileNo = COALESCE(?, MobileNo),
              customerid = CASE WHEN ? IS NOT NULL THEN ? ELSE customerid END,
              GrossAmt = ?,
              TaxableValue = ?,
              CGST = ?,
              SGST = ?,
              IGST = ?,
              CESS = ?,
              RoundOFF = ?,
              Amount = ?,
              isHomeDelivery = ?
            WHERE TxnID = ?
        `,
          [
            table_name,
            Steward || null,
            PAX ?? null,
            finalDiscPer,
            finalDiscount,
            finalDiscountType,
            Order_Type,
            NCName || null,
            NCPurpose || null,
            toBool(isHeaderNCKOT || existingBill.isNCKOT),
            CustomerName,
            MobileNo,
            customerid,
            customerid,
            finalGrossAmt,
            finalTaxableValue,
            finalCgst,
            finalSgst,
            finalIgst,
            finalCess,
            finalRoundOff,
            finalAmount,
            isHomeDeliveryUpdateFlag,
            txnId,
          ]
        )
      } else {
        // console.log(`No existing bill for table ${TableID}. Creating a new one.`)
        // For Pickup/Delivery, outletid comes from the payload, not a table.
        const headerOutletId = outletid || (details.length > 0 ? details[0].outletid : null)
        let txnNo = null
      if (headerOutletId) {
          console.log(`⏳ Calling generateTxnNo for headerOutletId: ${headerOutletId}`);
          txnNo = await generateTxnNo(headerOutletId);
          console.log(`✅ Generated txnNo: ${txnNo}`);
        }
        // Generate OrderNo only for Pickup, Delivery, Quick Bill, or Take Away
        let newOrderNo = null
        const orderTypesToGenerateNo = ['Pickup', 'Delivery', 'Quick Bill', 'Take Away', 'TAKEAWAY']
        if (Order_Type && orderTypesToGenerateNo.includes(Order_Type)) {
          console.log(`⏳ Calling generateOrderNo for headerOutletId: ${headerOutletId}, Order_Type: ${Order_Type}`);
          newOrderNo = await generateOrderNo(headerOutletId);
          console.log(`✅ Generated newOrderNo: ${newOrderNo}`);
        }

        const DeptID = details.length > 0 ? details[0].DeptID : null

        const isHomeDeliveryFlag = toBool(req.body.isHomeDelivery ?? (Order_Type === 'Delivery' ? 1 : 0));
        
        const [result] = await db.query(`
          INSERT INTO TAxnTrnbill (
            outletid, TxnNo, TableID, table_name, Steward, PAX, UserId, HotelID, TxnDatetime,
            isBilled, isCancelled, isSetteled, status, AutoKOT, CustomerName, MobileNo, customerid, Order_Type, orderNo,
            NCName, NCPurpose, DiscPer, Discount, DiscountType, isNCKOT, DeptID,
            GrossAmt, TaxableValue, CGST, SGST, IGST, CESS, RoundOFF, Amount, isHomeDelivery
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 1, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          headerOutletId,
          null,
          Number(TableID),
          table_name,
          Steward || null,
          PAX ?? null,
          UserId,
          HotelID,
          TxnDatetime,
          CustomerName,
          MobileNo,
          customerid,
          Order_Type,
          newOrderNo,
          NCName || null,
          NCPurpose || null,
          finalDiscPer,
          finalDiscount,
          finalDiscountType,
          toBool(isHeaderNCKOT),
          DeptID,
          finalGrossAmt,
          finalTaxableValue,
          finalCgst,
          finalSgst,
          finalIgst,
          finalCess,
          finalRoundOff,
          finalAmount,
          isHomeDeliveryFlag
        ])
        txnId = result.insertId
        await db.query('UPDATE msttablemanagement SET status = 1 WHERE tableid = ?', [Number(TableID)])
        console.log(`Created new bill. TxnID: ${txnId}. Updated table ${TableID} status.`)
      }

      // 2. Generate a new KOT number by finding the max KOT for the current day for that outlet.
       // Use curr_date from request body if provided, otherwise use system date
      const kotDate = curr_date || new Date().toISOString().split('T')[0];
      const [maxKOTResultRows] = await db.query(
        `
        SELECT MAX(KOTNo) as maxKOT 
        FROM TAxnTrnbilldetails
        WHERE outletid = ? AND date(KOTUsedDate) = date(?)
      `,
        [outletid, kotDate]
      )
      const maxKOTResult = maxKOTResultRows[0]
      const kotNo = (maxKOTResult?.maxKOT || 0) + 1
       console.log(`Generated KOT number: ${kotNo} (maxKOT was ${maxKOTResult?.maxKOT || 0})`)

      for (const item of details) {
        const qty = Number(item.Qty) || 0

        // If quantity is negative, it's a reversal for Re-KOT printing.
        // The actual DB update was already handled by the /reverse-quantity endpoint.
        // We skip it here to prevent inserting a new row with a negative quantity.
        if (qty < 0) {
          continue
        }
        const rate = Number(item.RuntimeRate) || 0
        
        // Use frontend calculated values directly
        const cgstPer = Number(item.CGST) || 0
        const cgstAmt = Number(item.CGST_AMOUNT) || 0
        const sgstPer = Number(item.SGST) || 0
        const sgstAmt = Number(item.SGST_AMOUNT) || 0
        const igstPer = Number(item.IGST) || 0
        const igstAmt = Number(item.IGST_AMOUNT) || 0
        const cessPer = Number(item.CESS) || 0
        const cessAmt = Number(item.CESS_AMOUNT) || 0
        const isNCKOT = toBool(item.isNCKOT)
        const order_tag = item.order_tag || ''

        // Use frontend calculated discount amount directly
        let itemDiscountAmount = Number(item.Discount_Amount) || 0

        let itemNo = item.item_no

        // console.log('Inserting item with order_tag:', order_tag)
// console.log('🚀 Saving KOT Item with Variant:', {
//             ItemID: item.ItemID,
//             item_name: item.item_name,
//             VariantID: item.VariantID || item.variantId,
//             VariantName: item.VariantName || item.variantName
//           });
          
        await db.query(`
          INSERT INTO TAxnTrnbilldetails (
            TxnID, outletid, ItemID, TableID, table_name, Qty, RuntimeRate, DeptID, HotelID,
            isKOTGenerate, AutoKOT, KOTUsedDate, isBilled, isCancelled, isSetteled, isNCKOT,
            CGST, CGST_AMOUNT, SGST, SGST_AMOUNT, IGST, IGST_AMOUNT, CESS, CESS_AMOUNT, Discount_Amount, KOTNo,
            item_no, item_name, order_tag, VariantID, VariantName
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, 0, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          txnId,
          outletid,
          item.ItemID,
          TableID,
          table_name,
          qty,
          rate,
          item.DeptID,
          HotelID,
          KOTUsedDate || null,
          isNCKOT,
          cgstPer,
          cgstAmt,
          sgstPer,
          sgstAmt,
          igstPer,
          igstAmt,
          cessPer,
          cessAmt,
          itemDiscountAmount,
          kotNo,
          itemNo,
          item.item_name,
          order_tag,
          item.VariantID || item.variantId || null,
          item.VariantName || item.variantName || null,
        ])
      }

      // No backend recalculation - use frontend values directly
      
      await db.query('COMMIT')
      
      const [headerRows] = await db.query('SELECT * FROM TAxnTrnbill WHERE TxnID = ?', [txnId])
      const header = headerRows[0]
      const [items] = await db.query(
        `
        SELECT d.*, m.item_name as ItemName, m.item_no as MenuItemNo
        FROM TAxnTrnbilldetails d 
        LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
        WHERE d.TxnID = ? AND d.isCancelled = 0 ORDER BY d.TXnDetailID
      `,
        [txnId]
      )

      const mappedItems = items.map((i) => ({
        ...i,
        item_no: i.item_no || i.MenuItemNo,
        isNewItem: i.KOTNo === kotNo  // 🔥 ONLY NEW ITEMS FOR SOCKET PRINT
      }));

      // 🔥 Emit real-time KOT event to all desktops connected to this outlet
      try {
        const io = req.app.get('io')
        if (io) {
          const room = `outlet_${outletid}`
          io.to(room).emit('new_kot', {
            kotNo,
            outletid,
            tableId: TableID,
            table_name,
            items: mappedItems.filter(i => i.isNewItem),  // 🔥 ONLY NEW ITEMS
            header,
            steward: Steward,
            orderType: Order_Type,
            kotNote: req.body.kotNote || '',
            pax: PAX,
            customerName: CustomerName,
            mobileNo: MobileNo,
            txnId,
          });
          console.log(`📡 Delta KOT emit: ${mappedItems.filter(i => i.isNewItem).length}/${mappedItems.length} new items`);
          console.log(`📡 Emitted new_kot to room ${room} for KOT #${kotNo}`)
        }
      } catch (socketErr) {
        console.warn('Socket emit failed (non-critical):', socketErr.message)
      }

      res.json(ok('KOT processed successfully', { ...header, customerid: header.customerid, details: mappedItems, KOTNo: kotNo }))
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }
  } catch (error) {
     console.error('Error in createKOT:', error)
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to create/update KOT',
        data: null,
        error: error.message,
      })
  }
}
/* -------------------------------------------------------------------------- */
/* 22) createReverseKOT → Log reversed items and generate a reverse KOT       */
/* -------------------------------------------------------------------------- */
exports.createReverseKOT = async (req, res) => {
  try {
    const { txnId, tableId, reversedItems, userId, reversalReason, ReversalDate, curr_date } = req.body

    if (!txnId || !Array.isArray(reversedItems) || reversedItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing transaction ID or items for reversal.' })
    }

    // Get outletid from the transaction to generate a daily sequential RevKOTNo
    const [billRows] = await db.query('SELECT outletid FROM TAxnTrnbill WHERE TxnID = ?', [txnId])
    const bill = billRows[0]
    if (!bill || !bill.outletid) {
      return res.status(404).json({ success: false, message: 'Transaction or outlet not found.' })
    }
    const outletid = bill.outletid

    // Use curr_date from request if provided, otherwise use system date
    const kotDate = curr_date || new Date().toISOString().split('T')[0];

    // Find the maximum existing RevKOTNo for the current day for the outlet to generate a new one
    const [maxRevKOTResultRows] = await db.query(
      `
      SELECT MAX(RevKOTNo) as maxRevKOT 
      FROM TAxnTrnbilldetails
      WHERE outletid = ? AND date(KOTUsedDate) = date(?)
    `,
      [outletid, kotDate]
    )
    const maxRevKOTResult = maxRevKOTResultRows[0]

    const newRevKOTNo = (maxRevKOTResult?.maxRevKOT || 0) + 1
    // console.log(`Generated RevKOT number: ${newRevKOTNo} for outlet ${outletid}`)

    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
      let isFullReverse = false
      let totalReverseAmount = 0

      for (const item of reversedItems) {
        if (!item.txnDetailId || !item.qty) continue

        const [detailRows] = await db.query(
          'SELECT d.*, m.item_name as itemName FROM TAxnTrnbilldetails d LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid WHERE d.TXnDetailID = ?',
          [item.txnDetailId]
        )
        const detail = detailRows[0]
        if (detail) {
          const newRevQty = (detail.RevQty || 0) + item.qty
          await db.query(
            'UPDATE TAxnTrnbilldetails SET RevQty = COALESCE(RevQty, 0) + ?, RevKOTNo = ?, KOTUsedDate = ? WHERE TXnDetailID = ?',
            [item.qty, newRevKOTNo, kotDate, item.txnDetailId]
          )

          const remainingQty = detail.Qty - newRevQty
          await db.query(`
            INSERT INTO TAxnTrnReversalLog (
              TxnDetailID, TxnID, KOTNo, RevKOTNo, ItemID, ItemName, ActualQty, ReversedQty, RemainingQty,
              IsBeforeBill, IsAfterBill, ReversedByUserID, ApprovedByAdmin, HotelID, ReversalReason, ReversalDate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            item.txnDetailId,
            detail.TxnID,
            detail.KOTNo,
            newRevKOTNo, // RevKOTNo
            detail.ItemID,
            detail.itemName || 'Unknown Item', // ItemName
            detail.Qty, // ActualQty
            item.qty, // ReversedQty
            remainingQty, // RemainingQty
            detail.isBilled ? 0 : 1, // IsBeforeBill
            detail.isBilled ? 1 : 0, // IsAfterBill
            userId, // ReversedByUserID
            null, // ApprovedByAdmin
            detail.HotelID, // HotelID
            reversalReason || 'Item Reversed', // ReversalReason
            ReversalDate || null, // ReversalDate
          ])

          totalReverseAmount += (Number(detail.RuntimeRate) || 0) * item.qty
        }
      }

      // Update the RevKOT amount on the main bill header
      if (totalReverseAmount > 0) {
        await db.query(
          `
          UPDATE TAxnTrnbill
          SET RevKOT = COALESCE(RevKOT, 0) + ?
          WHERE TxnID = ?
        `,
          [totalReverseAmount, txnId]
        )
      }

      // --- Recalculate Bill Totals After Reversal ---
      // Fetch all details for this transaction
      const [allDetails] = await db.query(
        'SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? AND isCancelled = 0',
        [txnId]
      )
      
      // Get the original gross (before any reversal) for discount proportional calculation
      let originalGross = 0
      let totalGross = 0
      for (const d of allDetails) {
        const originalQty = Number(d.Qty) || 0
        const netQty = originalQty - (Number(d.RevQty) || 0)
        originalGross += originalQty * (Number(d.RuntimeRate) || 0)
        totalGross += netQty * (Number(d.RuntimeRate) || 0)
      }

      const [billHeaderRows] = await db.query(
        'SELECT Discount, DiscPer, DiscountType, outletid FROM TAxnTrnbill WHERE TxnID = ?',
        [txnId]
      )
      const billHeader = billHeaderRows[0]
      const [outletSettingsRows] = await db.query(
        'SELECT include_tax_in_invoice, bill_round_off, bill_round_off_to FROM mstoutlet_settings WHERE outletid = ?',
        [billHeader.outletid]
      )
      const outletSettings = outletSettingsRows[0]
      const includeTaxInInvoice = outletSettings ? outletSettings.include_tax_in_invoice : 0

      let totalCgst = 0,
        totalSgst = 0,
        totalIgst = 0,
        totalCess = 0

      // Get discount info
      const discountType = Number(billHeader.DiscountType) || 0
      const discPer = Number(billHeader.DiscPer) || 0
      const originalDiscount = Number(billHeader.Discount) || 0

      // Calculate discount proportionally based on the remaining gross vs original gross
      // This ensures that when items are reversed, the discount is also proportionally reduced
      let discountAmount = 0
      if (originalGross > 0 && originalDiscount > 0) {
        const grossRatio = totalGross / originalGross
        if (discountType === 1) {
          // Percentage discount - apply same percentage to new gross
          discountAmount = (totalGross * discPer) / 100
        } else {
          // Fixed amount discount - distribute proportionally
          discountAmount = originalDiscount * grossRatio
        }
      }

      const firstDetail = allDetails[0] || {}
      const cgstPer = Number(firstDetail.CGST) || 0
      const sgstPer = Number(firstDetail.SGST) || 0
      const igstPer = Number(firstDetail.IGST) || 0
      const cessPer = Number(firstDetail.CESS) || 0
      let totalBeforeRoundOff = 0
      let finalTaxableValue = 0

      const round2 = (val) => Number(val.toFixed(2)); 
      if (includeTaxInInvoice === 1) {
        const combinedPer = cgstPer + sgstPer + igstPer + cessPer
        // FIX: Apply discount BEFORE extracting pre-tax base (matching frontend logic)
        const discountedGross = round2(totalGross - discountAmount);
        const preTaxBase = combinedPer > 0 ? discountedGross / (1 + combinedPer / 100) : discountedGross
        finalTaxableValue = round2(preTaxBase > 0 ? preTaxBase : 0);

       totalCgst = round2((finalTaxableValue * cgstPer) / 100);
       totalSgst = round2((finalTaxableValue * sgstPer) / 100);
       totalIgst = round2((finalTaxableValue * igstPer) / 100);
       totalCess = round2((finalTaxableValue * cessPer) / 100);
       totalBeforeRoundOff = round2(finalTaxableValue + totalCgst + totalSgst + totalIgst + totalCess );
      } else {
        const taxableValue = round2(totalGross - discountAmount);
        finalTaxableValue = taxableValue;
        totalCgst = round2((taxableValue * cgstPer) / 100);
        totalSgst = round2((taxableValue * sgstPer) / 100);
        totalIgst = round2((taxableValue * igstPer) / 100);
        totalCess = round2((taxableValue * cessPer) / 100);
        totalBeforeRoundOff = round2(taxableValue + totalCgst + totalSgst + totalIgst + totalCess );
      }

      let finalAmount = round2(totalBeforeRoundOff);
      let finalRoundOff = 0
      if (outletSettings && outletSettings.bill_round_off && outletSettings.bill_round_off_to > 0) {
        finalAmount =
          Math.round(totalBeforeRoundOff / outletSettings.bill_round_off_to) *
          outletSettings.bill_round_off_to
        finalRoundOff = finalAmount - totalBeforeRoundOff
      }

      // After a reversal, the bill is no longer considered fully billed or settled.
      // Reset these flags to allow for re-billing or further modifications.
      await db.query(
        `
        UPDATE TAxnTrnbill
        SET isBilled = 0, isSetteled = 0
        WHERE TxnID = ?
      `,
        [txnId]
      )

      // Update the bill header with recalculated totals
      await db.query(
        `
        UPDATE TAxnTrnbill
        SET GrossAmt = ?, Discount = ?, CGST = ?, SGST = ?, IGST = ?, CESS = ?, Amount = ?, RoundOFF = ?, TaxableValue = ?
        WHERE TxnID = ?
      `,
        [
          totalGross,
          discountAmount,
          totalCgst,
          totalSgst,
          totalIgst,
          totalCess,
          finalAmount,
          finalRoundOff,
          finalTaxableValue,
          txnId,
        ]
      )

      // Check if all items are now fully reversed and cancel the bill if so
      const [remainingItemsCheckRows] = await db.query(
        `
        SELECT SUM(Qty - COALESCE(RevQty, 0)) as netQty
        FROM TAxnTrnbilldetails
        WHERE TxnID = ? AND isCancelled = 0
      `,
        [txnId]
      )
      const remainingItemsCheck = remainingItemsCheckRows[0]

      if (remainingItemsCheck && remainingItemsCheck.netQty <= 0) {
        await db.query(
          `
          UPDATE TAxnTrnbill
          SET isreversebill = 0, isCancelled = 1, status = 0, isSetteled = 1
          WHERE TxnID = ?
        `,
          [txnId]
        )
        
        // Only update table status and delete temporary table if a tableId was provided (for Dine-in)
        if (tableId) {
          // Check if there are any other pending items for the same table from other transactions
          const [otherPendingItemsCheckRows] = await db.query(
            `
            SELECT SUM(d.Qty - COALESCE(d.RevQty, 0)) as netQty
            FROM TAxnTrnbilldetails d
            JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
            WHERE b.TableID = ? AND b.isCancelled = 0 AND b.TxnID != ?
          `,
            [tableId, txnId]
          )
          const otherPendingItemsCheck = otherPendingItemsCheckRows[0]

          // Only delete temporary table if there are NO other pending items from other transactions
          if (!otherPendingItemsCheck || !otherPendingItemsCheck.netQty || otherPendingItemsCheck.netQty <= 0) {
            await db.query(`DELETE FROM msttablemanagement WHERE tableid = ? AND isTemporary = 1`, [tableId])
          }
          
          // Update table status to vacant
          await db.query(
            `
            UPDATE msttablemanagement
            SET status = 0
            WHERE tableid = ?
          `,
            [tableId]
          )
        }
        
        isFullReverse = true
      }

      // After a partial reversal, the bill is no longer considered fully billed or settled.
      // Reset these flags to allow for re-billing or further modifications.
      if (!isFullReverse) {
        await db.query(
          `
        UPDATE TAxnTrnbill
        SET isBilled = 0, isSetteled = 0
        WHERE TxnID = ?
      `,
          [txnId]
        )
      }
      
      await db.query('COMMIT')
      
      res.json({
        success: true,
        message: isFullReverse
          ? 'Full bill reversed and table cleared successfully.'
          : 'Reversed items processed successfully.',
        fullReverse: isFullReverse,
        data: {
          revKotNo: newRevKOTNo
        }
      })
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    // console.error('Error in createReverseKOT:', error)
    res
      .status(500)
      .json({ success: false, message: 'Failed to process reversed items.', error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* 9) getSavedKOTs → fetch all unbilled KOTs for table, merged                */
/* -------------------------------------------------------------------------- */
exports.getSavedKOTs = async (req, res) => {
  try {
    const { tableId, isBilled } = req.query // get filters from query

    let whereClauses = ['b.isCancelled = 0']
    const params = []

    if (isBilled !== undefined) {
      whereClauses.push('b.isBilled = ?')
      params.push(Number(isBilled))
    }

    // This makes tableId optional. If provided, it filters.
    if (tableId !== undefined) {
      whereClauses.push('b.TableID = ?')
      params.push(Number(tableId))
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
    `

    const [rows] = await db.query(sql, params)

    res.json(ok('Fetched saved KOTs', rows))
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to fetch saved KOTs',
        data: null,
        error: error.message,
      })
  }
}

exports.getLatestKOTForTable = async (req, res) => {
  try {
    const { tableId } = req.query
    if (!tableId)
      return res.status(400).json({ success: false, message: 'tableId required', data: null })

    const [billRows] = await db.query(
      `SELECT * FROM TAxnTrnbill WHERE TableID = ? AND isBilled = 0 AND isCancelled = 0 ORDER BY TxnID DESC LIMIT 1`,
      [tableId])
    const bill = billRows[0]
    if (!bill) return res.status(404).json({ success: false, message: 'No KOT found', data: null })

    const [details] = await db.query(
      `
      SELECT * FROM TAxnTrnbilldetails 
      WHERE TxnID = ? AND isCancelled = 0 
      ORDER BY TXnDetailID ASC
    `, [bill.TxnID])

    res.json(ok('Latest KOT fetched', { ...bill, details }))
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch KOT', data: null, error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* Updated getUnbilledItemsByTable to fetch all unbilled items with isNew flag */
/* -------------------------------------------------------------------------- */
exports.getUnbilledItemsByTable = async (req, res) => {
  try {
    const { tableId } = req.params

    // Find the single unbilled or billed but unsettled bill for the table
    const [billRows] = await db.query(
      `
      SELECT TxnID, outletid
      FROM TAxnTrnbill
      WHERE TableID = ? AND isBilled = 0 AND isCancelled = 0 AND isSetteled = 0
      ORDER BY TxnID DESC LIMIT 1
    `,
      [Number(tableId)]
    )
    const bill = billRows[0]

    let kotNo = null
    if (bill) {
      // Get the latest KOTNo for that bill from the details table
      const [latestKOTDetailRows] = await db.query(
        `
          SELECT MAX(KOTNo) as maxKotNo
          FROM TAxnTrnbilldetails
          WHERE TxnID = ?
        `,
        [bill.TxnID]
      )
      const latestKOTDetail = latestKOTDetailRows[0]
      kotNo = latestKOTDetail ? latestKOTDetail.maxKotNo : null
    }

    // Fetch all unbilled items for the table (not aggregated)
    const [rows] = await db.query(
      `
      SELECT
        b.TxnID,
        d.TXnDetailID,
        d.ItemID,
        d.item_no,
        COALESCE(m.item_name, 'Unknown Item') AS ItemName,
        COALESCE(t.table_name, 'N/A') as tableName,
        d.Qty,
        COALESCE(d.RevQty, 0) as RevQty,
        (d.Qty - COALESCE(d.RevQty, 0)) as NetQty,
        d.RuntimeRate as price,
        d.KOTNo,
        d.RevKOTNo,
        m.item_no as MenuItemNo,
        m.item_group_id,
        d.order_tag,
        d.VariantID,
        d.VariantName
      FROM TAxnTrnbilldetails d
      LEFT JOIN msttablemanagement t ON d.TableID = t.tableid
      JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE b.TableID = ? AND b.isBilled = 0 AND b.issetteled = 0 AND b.isNCKOT = 0 AND d.isCancelled = 0
      `,
      [Number(tableId)]
    )

    // Get the max RevKOTNo for the outlet to set as revKotNo for unbilled
    let maxRevKOT = 0
    if (bill && bill.outletid) {
      const [maxRevKOTResultRows] = await db.query(
        `
        SELECT MAX(RevKOTNo) as maxRevKOT
        FROM TAxnTrnbilldetails
        WHERE outletid = ? AND date(KOTUsedDate) = CURDATE()
      `,
        [bill.outletid]
      )
      const maxRevKOTResult = maxRevKOTResultRows[0]
      maxRevKOT = maxRevKOTResult?.maxRevKOT || 0
    }

    // Fetch reversed items from the log for this transaction
    let reversedItemsRows = []
    if (bill) {
      const [reversedRows] = await db.query(
        `
        SELECT
          l.ReversalID as reversalLogId,
          l.ItemID,
          d.item_no,
          COALESCE(m.item_name, 'Unknown Item') AS ItemName,
          l.ReversedQty as reversedQty,
          d.RuntimeRate as price,
          'Reversed' as status,
          l.RevKOTNo as kotNo,
          d.TXnDetailID as txnDetailId,
          l.ReversalDate as reversalTime
        FROM TAxnTrnReversalLog l
        JOIN TAxnTrnbilldetails d ON l.TxnDetailID = d.TXnDetailID
        LEFT JOIN mstrestmenu m ON l.ItemID = m.restitemid
        WHERE l.TxnID = ?
      `,
        [bill.TxnID]
      )
      reversedItemsRows = reversedRows
    }

    // Fetch discount from the latest unbilled bill for the table
    const [latestBillHeaderRows] = await db.query(
      `
      SELECT TxnID, GrossAmt, RevKOT, Discount, DiscPer, DiscountType, CGST, SGST, IGST, CESS, RoundOFF, Amount, PAX, CustomerName, MobileNo, Steward
      FROM TAxnTrnbill
      WHERE TableID = ? AND isBilled = 0 AND isCancelled = 0 AND isNCKOT = 0
      ORDER BY TxnID DESC
      LIMIT 1
    `,
      [Number(tableId)]
    )
    const latestBillHeader = latestBillHeaderRows[0] || {}

    // Map to add isNew flag
    const items = rows.map((r) => ({
      txnId: r.TxnID,
      txnDetailId: r.TXnDetailID,
      itemId: r.ItemID,
      itemName: r.ItemName,
      item_no: r.item_no || r.MenuItemNo,
      tableName: r.tableName,
      qty: r.Qty,
      revQty: r.RevQty,
      netQty: r.NetQty,
      price: r.price,
      isNew: r.KOTNo === kotNo,
      kotNo: r.KOTNo,
      itemgroupid: r.item_group_id,
      order_tag: r.order_tag || '',
      VariantID: r.VariantID || null,
      VariantName: r.VariantName || null,
    }))

    // console.log('Unbilled items for tableId', tableId, ':', items)

    res.json({
      success: true,
      message: 'Fetched unbilled items',
      data: {
        kotNo,
        items,
        reversedItems: reversedItemsRows,
        header: latestBillHeader,
      },
    })
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to fetch unbilled items',
        data: null,
        error: error.message,
      })
  }
}

/* -------------------------------------------------------------------------- */
/* F8 Key Press Handler - Reverse Quantity Mode                              */
/* -------------------------------------------------------------------------- */
exports.handleF8KeyPress = async (req, res) => {
  try {
    const { tableId, userId, txnDetailId, approvedByAdminId, reversalReason } = req.body

    if (!tableId) {
      return res.status(400).json({ success: false, message: 'tableId is required', data: null })
    }

    // Note: ReverseQtyMode check is handled in the frontend
    // Backend assumes the request is valid when called

    // Get the latest KOT for the table (billed or unbilled)
    const [latestKOTRows] = await db.query(
      `
      SELECT TxnID, KOTNo
      FROM TAxnTrnbill
      WHERE TableID = ? AND isCancelled = 0
      ORDER BY TxnID DESC
      LIMIT 1
    `,
      [Number(tableId)]
    )
    const latestKOT = latestKOTRows[0]

    if (!latestKOT) {
      return res.status(404).json({
        success: false,
        message: 'No active KOT found for this table',
        data: null,
      })
    }

    // If txnDetailId is provided, handle individual item
    if (txnDetailId) {
      const [itemRows] = await db.query(
        `
        SELECT
          d.TXnDetailID,
          d.ItemID,
          d.Qty,
          d.RevQty,
          d.TxnID,
          d.KOTNo,
          d.RuntimeRate,
          d.HotelID,
          COALESCE(m.item_name, 'Unknown Item') AS ItemName
        FROM TAxnTrnbilldetails d
        JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
        LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
        WHERE b.TableID = ? AND d.TXnDetailID = ? AND d.isCancelled = 0
      `,
        [Number(tableId), Number(txnDetailId)]
      )
      const item = itemRows[0]

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found',
          data: null,
        })
      }

      const currentQty = Number(item.Qty) || 0
      const currentRevQty = Number(item.RevQty) || 0
      const availableQty = currentQty - currentRevQty

      if (availableQty <= 0) {
        return res.status(400).json({
          success: false,
          message: 'No quantity available to reverse for this item',
          data: null,
        })
      }

      // Generate new KOT number for reversal
      const [maxRevKOTResultRows] = await db.query(
        `
        SELECT MAX(d.RevKOTNo) as maxRevKOT
        FROM TAxnTrnbilldetails d
      `
      )
      const maxRevKOTResult = maxRevKOTResultRows[0]
      const newRevKOTNo = (maxRevKOTResult?.maxRevKOT || 0) + 1

      // Update RevQty and KOTNo in database
      const newRevQty = currentRevQty + 1
      const reverseAmount = Number(item.RuntimeRate) || 0

      // Determine reversal type based on bill status
      const [billRows] = await db.query('SELECT isBilled FROM TAxnTrnbill WHERE TxnID = ?', [item.TxnID])
      const bill = billRows[0]
      const reverseType = bill && bill.isBilled ? 'AfterBill' : 'BeforeBill'
      const isBeforeBill = reverseType === 'BeforeBill' ? 1 : 0
      const isAfterBill = reverseType === 'AfterBill' ? 1 : 0

      // Start transaction
      await db.query('START TRANSACTION')
      
      try {
        await db.query(
          `
          UPDATE TAxnTrnbilldetails
          SET RevQty = ?, RevKOTNo = ?
          WHERE TXnDetailID = ?
        `,
          [newRevQty, newRevKOTNo, item.TXnDetailID]
        )

        await db.query(
          `
          UPDATE TAxnTrnbill
          SET RevKOT = COALESCE(RevKOT, 0) + ?
          WHERE TxnID = ?
        `,
          [reverseAmount, item.TxnID]
        )

        // Log the reversal
        await db.query(
          `
          INSERT INTO TAxnTrnReversalLog (
            TxnDetailID, TxnID, KOTNo, RevKOTNo, ItemID, ItemName,
            ActualQty, ReversedQty, RemainingQty, IsBeforeBill, IsAfterBill,
            ReversedByUserID, ApprovedByAdmin, HotelID, ReversalReason
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            item.TXnDetailID,
            item.TxnID,
            item.KOTNo,
            newRevKOTNo,
            item.ItemID,
            item.ItemName,
            currentQty,
            1,
            availableQty - 1,
            isBeforeBill,
            isAfterBill,
            userId,
            approvedByAdminId || null,
            item.HotelID,
            reversalReason || null,
          ]
        )

        // Update table status to occupied if it's not already
        await db.query(
          `
          UPDATE msttablemanagement SET status = 1 WHERE tableid = ? AND status = 0
        `,
          [tableId]
        )
        
        await db.query('COMMIT')
      } catch (error) {
        await db.query('ROLLBACK')
        throw error
      }

      return res.json({
        success: true,
        message: 'Item quantity reversed successfully',
        data: {
          txnDetailId: item.TXnDetailID,
          itemId: item.ItemID,
          itemName: item.ItemName,
          originalQty: currentQty,
          newRevQty: newRevQty,
          availableQty: availableQty - 1,
        },
      })
    }

    // Get all unbilled items for the table (original F8 functionality)
    const [unbilledItems] = await db.query(
      `
      SELECT
        d.TXnDetailID,
        d.TxnID,
        d.ItemID,
        d.Qty,
        d.RevQty,
        d.KOTNo,
        d.RuntimeRate,
        d.HotelID,
        COALESCE(m.item_name, 'Unknown Item') AS ItemName
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE b.TableID = ? AND b.isBilled = 0 AND d.isCancelled = 0
    `,
      [Number(tableId)]
    )

    if (!unbilledItems || unbilledItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No unbilled items found for this table',
        data: null,
      })
    }

    // Process reverse quantity for items that have quantity > RevQty
    const updatedItems = []
    let totalReverseAmount = 0
    let billTxnId = null

    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
      for (const item of unbilledItems) {
        const currentQty = Number(item.Qty) || 0
        const currentRevQty = Number(item.RevQty) || 0
        const availableQty = currentQty - currentRevQty

        if (availableQty > 0) {
          const newRevQty = currentRevQty + 1
          await db.query(
            `
            UPDATE TAxnTrnbilldetails
            SET RevQty = ?
            WHERE TXnDetailID = ?
          `,
            [newRevQty, item.TXnDetailID]
          )

          totalReverseAmount += Number(item.RuntimeRate) || 0
          if (!billTxnId) {
            billTxnId = item.TxnID
          }

          // Log the reversal
          await db.query(
            `
            INSERT INTO TAxnTrnReversalLog ( 
              TxnDetailID, TxnID, KOTNo, RevKOTNo, ItemID, ItemName,
              ActualQty, ReversedQty, RemainingQty, IsBeforeBill, IsAfterBill,
              ReversedByUserID, ApprovedByAdmin, HotelID, ReversalReason 
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
            [
              item.TXnDetailID,
              item.TxnID,
              item.KOTNo,
              null,
              item.ItemID,
              item.ItemName,
              currentQty,
              1,
              availableQty - 1,
              1,
              0,
              userId,
              approvedByAdminId || null,
              item.HotelID,
              reversalReason || null,
            ]
          )

          await db.query(
            `
            UPDATE msttablemanagement SET status = 1 WHERE tableid = ? AND status = 0
          `,
            [tableId]
          )

          updatedItems.push({
            txnDetailId: item.TXnDetailID,
            itemId: item.ItemID,
            itemName: item.ItemName,
            originalQty: currentQty,
            newRevQty: newRevQty,
            availableQty: availableQty - 1,
          })
        }
      }

      if (billTxnId && totalReverseAmount > 0) {
        await db.query(
          `
          UPDATE TAxnTrnbill
          SET RevKOT = COALESCE(RevKOT, 0) + ?
          WHERE TxnID = ?
        `,
          [totalReverseAmount, billTxnId]
        )
      }
      
      await db.query('COMMIT')
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

    // Get updated items after transaction
    const [finalItems] = await db.query(
      `
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
    `,
      [Number(tableId)]
    )

    res.json({
      success: true,
      message: 'F8 key press processed successfully',
      data: {
        tableId: tableId,
        kotNo: latestKOT.KOTNo,
        updatedItems: updatedItems,
        allItems: finalItems,
        reverseQtyMode: true,
      },
    })
  } catch (error) {
    // console.error('Error in handleF8KeyPress:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process F8 key press',
      data: null,
      error: error.message,
    })
  }
}

// Simple reverse quantity function
exports.reverseQuantity = async (req, res) => {
  try {
    const { txnDetailId, userId, approvedByAdminId, reversalReason } = req.body

    if (!txnDetailId) {
      return res.status(400).json({
        success: false,
        message: 'txnDetailId is required',
        data: null,
      })
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
        data: null,
      })
    }
    

    // Get current item details
    const [itemRows] = await db.query(
      `
      SELECT TXnDetailID, Qty, RevQty, ItemID, TxnID, RuntimeRate, TableID, KOTNo, HotelID, 
             COALESCE(m.item_name, 'Unknown Item') AS ItemName
      FROM TAxnTrnbilldetails d
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE d.TXnDetailID = ?
    `,
      [Number(txnDetailId)]
    )
    const item = itemRows[0]

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
        data: null,
      })
    }

    const currentQty = Number(item.Qty) || 0
    const currentRevQty = Number(item.RevQty) || 0
    const availableQty = currentQty - currentRevQty

    if (availableQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No quantity available to reverse',
        data: null,
      })
    }

    // Generate new KOT number for reversal
    const [maxRevKOTResultRows] = await db.query(
      `
      SELECT MAX(d.RevKOTNo) as maxRevKOT
      FROM TAxnTrnbilldetails d
    `
    )
    const maxRevKOTResult = maxRevKOTResultRows[0]
    const newRevKOTNo = (maxRevKOTResult?.maxRevKOT || 0) + 1

    // Update RevQty and KOTNo
    const newRevQty = currentRevQty + 1
    const reverseAmount = Number(item.RuntimeRate) || 0

    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
      await db.query(
        `
        UPDATE TAxnTrnbilldetails
        SET RevQty = ?, RevKOTNo = ?
        WHERE TXnDetailID = ?
      `,
        [newRevQty, newRevKOTNo, item.TXnDetailID]
      )

      await db.query(
        `
        UPDATE TAxnTrnbill
        SET RevKOT = COALESCE(RevKOT, 0) + ?
        WHERE TxnID = ?
      `,
        [reverseAmount, item.TxnID]
      )

      // Log the reversal
      const [billRows] = await db.query('SELECT isBilled FROM TAxnTrnbill WHERE TxnID = ?', [item.TxnID])
      const bill = billRows[0]
      const reverseType = bill && bill.isBilled ? 'AfterBill' : 'BeforeBill'

      const isBeforeBill = reverseType === 'BeforeBill' ? 1 : 0
      const isAfterBill = reverseType === 'AfterBill' ? 1 : 0

      await db.query(
        `
        INSERT INTO TAxnTrnReversalLog ( 
          TxnDetailID, TxnID, KOTNo, RevKOTNo, ItemID, ItemName, ActualQty, ReversedQty, RemainingQty, 
          IsBeforeBill, IsAfterBill, ReversedByUserID, ApprovedByAdmin, HotelID, ReversalReason 
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          item.TXnDetailID,
          item.TxnID,
          item.KOTNo,
          newRevKOTNo,
          item.ItemID,
          item.ItemName,
          currentQty,
          1,
          availableQty - 1,
          isBeforeBill,
          isAfterBill,
          userId,
          approvedByAdminId || null,
          item.HotelID,
          reversalReason || null,
        ]
      )
      
      await db.query('COMMIT')
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

    res.json({
      success: true,
      message: 'Quantity reversed successfully',
      data: {
        txnDetailId: item.TXnDetailID,
        originalQty: currentQty,
        newRevQty: newRevQty,
        availableQty: availableQty,
      },
    })
  } catch (error) {
    // console.error('Error in reverseQuantity:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to reverse quantity',
      data: null,
      error: error.message,
    })
  }
}
exports.getLatestBilledBillForTable = async (req, res) => {
  try {
    const { tableId } = req.params
    if (!tableId) {
      return res.status(400).json({ success: false, message: 'tableId is required', data: null })
    }

    // Step 1: Fetch the latest billed and unsettled transaction for the table
    const [billRows] = await db.query(
      `
      SELECT * 
      FROM TAxnTrnbill 
      WHERE TableID = ? AND isBilled = 1 AND isSetteled = 0 AND isreversebill = 0
      ORDER BY TxnID DESC 
      LIMIT 1
    `,
      [Number(tableId)]
    )
    const bill = billRows[0]

    if (!bill) {
      return res.json({
        success: true,
        message: 'No billed and unsettled transaction found for this table.',
        data: null,
      })
    }

    // Step 2: Load all items (billed and unbilled) associated with that transaction
    const [allDetailsForBill] = await db.query(
      `
      SELECT d.*, m.item_name as ItemName, m.item_no, m.item_group_id
      FROM TAxnTrnbilldetails d
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE d.TxnID = ? AND d.isCancelled = 0
      ORDER BY d.TXnDetailID ASC
    `,
      [bill.TxnID]
    )

    // Step 3: Check for any *other* unbilled transactions for the same table that might have been created after the bill was printed.
    // This is a fallback and might not be the primary logic path if new items are added to the *same* bill.
    const [otherUnbilledItems] = await db.query(
      `
      SELECT d.*, m.item_name as ItemName
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE b.TableID = ? 
      AND b.isBilled = 0 
      AND b.isCancelled = 0 
      AND d.isCancelled = 0
      AND IFNULL(d.isNCKOT, 0) = 0   -- ✅ IMPORTANT
    `,
      [Number(tableId)]
    )

    // Step 4: Fetch reversed items from the log for this specific billed transaction
    const [reversedItemsRows] = await db.query(
      `
      SELECT
        l.ReversalID,
        l.ItemID,
        COALESCE(m.item_name, 'Unknown Item') AS ItemName,
        l.ReversedQty as Qty,
        d.RuntimeRate as price,
        'Reversed' as status,
        1 as isReversed
      FROM TAxnTrnReversalLog l
      JOIN TAxnTrnbilldetails d ON l.TxnDetailID = d.TXnDetailID
      LEFT JOIN mstrestmenu m ON l.ItemID = m.restitemid
      WHERE l.TxnID = ?
    `,
      [bill.TxnID]
    )

    // Combine the details. The primary details are from the billed transaction.
    // The frontend will handle displaying them correctly.
    const combinedDetails = [...allDetailsForBill, ...otherUnbilledItems]

    // Respond with the main billed transaction header, all items, and the reversed items
    res.json(
      ok('Fetched billed items for the table', {
        ...bill,
        details: combinedDetails,
        reversedItems: reversedItemsRows,
      }),
    )
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to fetch latest billed bill',
        data: null,
        error: error.message,
      })
  }
}

/* -------------------------------------------------------------------------- */
/* 10) printBill → update isBilled = 1 for all items in a bill when printed  */
/* -------------------------------------------------------------------------- */
exports.printBill = async (req, res) => {
  try {
    const { id } = req.params

    const [billRows] = await db.query('SELECT * FROM TAxnTrnbill WHERE TxnID = ?', [Number(id)])
    const bill = billRows[0]
    if (!bill)
      return res.status(404).json({ success: false, message: 'Bill not found', data: null })

    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
      // Update isBilled = 1 for all items in the bill
      await db.query('UPDATE TAxnTrnbilldetails SET isBilled = 1 WHERE TxnID = ?', [Number(id)])

      // Also update the bill header to mark it as billed
      await db.query(
        `
        UPDATE TAxnTrnbill
        SET isBilled = 1, BilledDate = CURRENT_TIMESTAMP
        WHERE TxnID = ?
      `,
        [Number(id)]
      )

      // ✅ Update table status to 'billed' (2)
      if (bill.TableID) {
        await db.query('UPDATE msttablemanagement SET status = 2 WHERE tableid = ?', [bill.TableID])
      }
      
      await db.query('COMMIT')
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

    const [headerRows] = await db.query('SELECT * FROM TAxnTrnbill WHERE TxnID = ?', [Number(id)])
    const header = headerRows[0]
    const [items] = await db.query('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? ORDER BY TXnDetailID', [Number(id)])

    res.json(ok('Bill marked as printed and billed', { ...header, details: items }))
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to mark bill as printed',
        data: null,
        error: error.message,
      })
  }
}

/* -------------------------------------------------------------------------- */
/* 11) markBillAsBilled → update isBilled = 1 for a bill and its items        */
/* -------------------------------------------------------------------------- */
exports.markBillAsBilled = async (req, res) => {
  try {
    const { id } = req.params
    const { outletId, customerName, mobileNo, customerid } = req.body // ✅ Get outletId from body

    const [billRows] = await db.query('SELECT * FROM TAxnTrnbill WHERE TxnID = ?', [Number(id)])
    const bill = billRows[0]
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found', data: null })
    }

    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
      // Update isBilled = 1 for all items in the bill
      await db.query('UPDATE TAxnTrnbilldetails SET isBilled = 1 WHERE TxnID = ?', [Number(id)])

      // Update the bill header to mark it as billed and set the date
      // ✅ Also generate the TxnNo here if it doesn't exist
      let txnNo = bill.TxnNo
      if (!txnNo && outletId) {
        console.log(`⏳ Calling generateTxnNo for outletId: ${outletId}`);
        txnNo = await generateTxnNo(outletId);
        console.log(`✅ Generated txnNo: ${txnNo}`);
      }

      await db.query(
        `
        UPDATE TAxnTrnbill
        SET isBilled = 1, BilledDate = CURRENT_TIMESTAMP, TxnNo = ?, CustomerName = COALESCE(?, CustomerName), MobileNo = COALESCE(?, MobileNo), customerid = COALESCE(?, customerid)
        WHERE TxnID = ?
      `,
        [txnNo, customerName || null, mobileNo || null, customerid || null, Number(id)]
      )
      
      await db.query('COMMIT')
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

    const [headerRows] = await db.query('SELECT * FROM TAxnTrnbill WHERE TxnID = ?', [Number(id)])
    const header = headerRows[0]
    const [items] = await db.query('SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? ORDER BY TXnDetailID', [Number(id)])

    res.json(ok('Bill marked as billed', { ...header, customerid: header.customerid, details: items }))
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to mark bill as billed',
        data: null,
        error: error.message,
      })
  }
}

/* -------------------------------------------------------------------------- */
/* generateTxnNo → generate transaction number and create bill record       */
/* -------------------------------------------------------------------------- */
exports.generateTxnNo = async (req, res) => {
  try {
    const { outletid, tableId, userId } = req.body

    if (!outletid || !tableId) {
      return res
        .status(400)
        .json({ success: false, message: 'outletid and tableId are required', data: null })
    }

    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
      console.log(`🔍 About to call generateTxnNo for outletid: ${outletid}`);
      const txnNo = await generateTxnNo(outletid);
      console.log(`✅ generateTxnNo returned: "${txnNo}" (type: ${typeof txnNo})`);

      const [insertResult] = await db.query(`
        INSERT INTO TAxnTrnbill (
          outletid, TxnNo, TableID, UserId, TxnDatetime, isBilled, isCancelled, isSetteled
        ) VALUES (?, ?, ?, ?, NOW(), 0, 0, 0)
      `, [outletid, txnNo, tableId, userId])

      const txnId = insertResult.insertId
      
      await db.query('COMMIT')

      res.json(ok('TxnNo generated and bill created', { txnNo, txnId }))
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    // console.error('Error generating TxnNo:', error)
    res
      .status(500)
      .json({ success: false, message: 'Failed to generate TxnNo: ' + error.message, data: null })
  }
}

exports.saveDayEnd = async (req, res) => {
  try {
    const { total_amount, outlet_id, hotel_id, user_id, system_datetime } = req.body

    if (!total_amount || !outlet_id || !hotel_id || !user_id || !system_datetime) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            'Missing required fields: total_amount, outlet_id, hotel_id, user_id, system_datetime',
        })
    }

    // Parse system_datetime from request
    const sysDateTime = new Date(system_datetime)
    if (isNaN(sysDateTime.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid system_datetime format' })
    }

    // Calculate business date based on system_datetime in IST
    const istDateTime = toIST(sysDateTime)
    const currentHour = istDateTime.getHours()
    let dayend_date = new Date(istDateTime)
    if (currentHour < 6) {
      dayend_date.setDate(dayend_date.getDate() - 1)
    }

    // Format date as YYYY-MM-DD for dayend_date
    const pad = (n) => n.toString().padStart(2, '0')
    const dayend_dateStr = `${dayend_date.getFullYear()}-${pad(dayend_date.getMonth() + 1)}-${pad(dayend_date.getDate())}`

    // Prevent duplicate entries
    const [existsRows] = await db.query(
      `SELECT id FROM trn_dayend WHERE dayend_date = ? AND outlet_id = ?`,
      [dayend_dateStr, outlet_id]
    )
    const exists = existsRows[0]
    if (exists) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Day end has already been completed for this date and outlet.',
        })
    }

    // Calculate lock_datetime as business_date + 23:59:00 in IST
    const lockDateTime = new Date(dayend_dateStr + 'T23:59:00')
    const lockDateTimeIST = toIST(lockDateTime)

    // Format lock_datetime as YYYY-MM-DDTHH:mm:ss (no Z)
    const lockDateTimeStr = `${lockDateTimeIST.getFullYear()}-${pad(lockDateTimeIST.getMonth() + 1)}-${pad(lockDateTimeIST.getDate())}T${pad(lockDateTimeIST.getHours())}:${pad(lockDateTimeIST.getMinutes())}:${pad(lockDateTimeIST.getSeconds())}`

    // Format system_datetime as YYYY-MM-DDTHH:mm:ss (no Z)
    const systemDateTimeStr = `${istDateTime.getFullYear()}-${pad(istDateTime.getMonth() + 1)}-${pad(istDateTime.getDate())}T${pad(istDateTime.getHours())}:${pad(istDateTime.getMinutes())}:${pad(istDateTime.getSeconds())}`

    // Insert into trn_dayend with system_datetime and lock_datetime in IST format
    const [result] = await db.query(`
      INSERT INTO trn_dayend (dayend_date, lock_datetime, dayend_total_amt, outlet_id, hotel_id, created_by_id, system_datetime)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      dayend_dateStr, // dayend_date as YYYY-MM-DD IST
      lockDateTimeStr, // lock_datetime as YYYY-MM-DDTHH:mm:ss IST
      total_amount,
      outlet_id,
      hotel_id,
      user_id,
      systemDateTimeStr, // system_datetime as YYYY-MM-DDTHH:mm:ss IST
    ])

    res.json(
      ok('Day end saved successfully', {
        lock_datetime: lockDateTimeStr,
        id: result.insertId,
      }),
    )
  } catch (error) {
    // console.error('Error saving day end:', error)
    res
      .status(500)
      .json({ success: false, message: 'Failed to save day end', error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* 12) applyNCKOT → update isNCKOT = 1 for a bill and all its items         */
/* -------------------------------------------------------------------------- */
exports.applyNCKOT = async (req, res) => {
  try {
    const { id } = req.params
    const { NCName, NCPurpose } = req.body

    if (!NCName || !NCPurpose) {
      return res.status(400).json({ success: false, message: 'NCName and NCPurpose are required.' })
    }

    const [billRows] = await db.query('SELECT * FROM TAxnTrnbill WHERE TxnID = ?', [Number(id)])
    const bill = billRows[0]
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found', data: null })
    }

    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
      // Update the bill header
      await db.query(
        `
        UPDATE TAxnTrnbill
        SET isNCKOT = 1, NCName = ?, NCPurpose = ?, isSetteled = 1
        WHERE TxnID = ?
      `,
        [NCName, NCPurpose, Number(id)]
      )

      // Update all associated detail items
      await db.query('UPDATE TAxnTrnbilldetails SET isNCKOT = 1 WHERE TxnID = ?', [Number(id)])

      // Show the UPDATE statement for table status
      // console.log(`UPDATE msttablemanagement SET Status = 0 WHERE TableID = ${bill.TableID}`)
      await db.query(`UPDATE msttablemanagement SET status = 0 WHERE tableid = ?`, [bill.TableID])
      await db.query(`DELETE FROM msttablemanagement WHERE tableid = ? AND isTemporary = 1`, [bill.TableID])
      
      await db.query('COMMIT')
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

    res.json(ok('NCKOT applied to the entire bill successfully.'))
  } catch (error) {
    // console.error('Error in applyNCKOT:', error)
    res
      .status(500)
      .json({ success: false, message: 'Failed to apply NCKOT', data: null, error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* 13) applyDiscountToBill → update discount on existing bill and its items   */
/* -------------------------------------------------------------------------- */
exports.applyDiscountToBill = async (req, res) => {
  try {
    const { id } = req.params // This is the TxnID (KOT ID)
    const { discount, discPer, discountType, tableId, items } = req.body

    if (!id) {
      return res.status(400).json({ success: false, message: 'KOT ID (TxnID) is required.' })
    }
    if (items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'No items in the KOT to apply discount to.' })
    }
    if (discount === undefined || discPer === undefined || discountType === undefined) {
      return res
        .status(400)
        .json({ success: false, message: 'Discount value, percentage, and type are required.' })
    }

    const [billRows] = await db.query('SELECT * FROM TAxnTrnbill WHERE TxnID = ?', [Number(id)])
    const bill = billRows[0]
    if (!bill) {
      return res.status(404).json({ success: false, message: 'KOT not found.' })
    }

    const finalDiscount = Number(discount) || 0
    const finalDiscPer = Number(discPer) || 0
    const finalDiscountType = Number(discountType)

    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
      // 2. Recalculate and update Discount_Amount for each item in TAxnTrnbilldetails
      let totalDiscountOnItems = 0

      for (const item of items) {
        const lineSubtotal = (Number(item.qty) || 0) * (Number(item.price) || 0)
        let itemDiscountAmount = 0

        if (finalDiscountType === 1) {
          // Percentage
          // Use the percentage from the request to calculate discount per item
          itemDiscountAmount = parseFloat(((lineSubtotal * finalDiscPer) / 100).toFixed(2))
        } else {
          // Fixed amount - distribute proportionally
          const subtotalOfAllItems = items.reduce(
            (sum, i) => sum + (Number(i.qty) || 0) * (Number(i.price) || 0),
            0,
          )
          if (subtotalOfAllItems > 0) {
            itemDiscountAmount = parseFloat(((lineSubtotal / subtotalOfAllItems) * finalDiscount).toFixed(2))
          }
        }

        await db.query(
          'UPDATE TAxnTrnbilldetails SET Discount_Amount = ? WHERE TXnDetailID = ?',
          [itemDiscountAmount, item.txnDetailId]
        )
        totalDiscountOnItems += itemDiscountAmount
      }

      // 3. Recalculate the total amount for the bill header based on the new discount
      const [allDetails] = await db.query(
        'SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? AND isCancelled = 0',
        [Number(id)]
      )
      const [outletSettingsRows] = await db.query(
        'SELECT include_tax_in_invoice FROM mstoutlet_settings WHERE outletid = ?',
        [bill.outletid]
      )
      const outletSettings = outletSettingsRows[0]
      const includeTaxInInvoice = outletSettings ? outletSettings.include_tax_in_invoice : 0

      let totalGross = 0,
        totalCgst = 0,
        totalSgst = 0,
        totalIgst = 0,
        totalCess = 0

      for (const d of allDetails) {
        totalGross +=
          ((Number(d.Qty) || 0) - (Number(d.RevQty) || 0)) * (Number(d.RuntimeRate) || 0)
      }

      const firstDetail = allDetails[0] || {}
      const cgstPer = Number(firstDetail.CGST) || 0
      const sgstPer = Number(firstDetail.SGST) || 0
      const igstPer = Number(firstDetail.IGST) || 0
      const cessPer = Number(firstDetail.CESS) || 0
      let totalBeforeRoundOff = 0
      let finalTaxableValue = 0

      if (includeTaxInInvoice === 1) {
        const combinedPer = cgstPer + sgstPer + igstPer + cessPer
        // FIX: Apply discount BEFORE extracting pre-tax base (matching frontend logic)
        const discountedGross = totalGross - finalDiscount
        const preTaxBase = combinedPer > 0 ? discountedGross / (1 + combinedPer / 100) : discountedGross
        finalTaxableValue = preTaxBase > 0 ? parseFloat(preTaxBase.toFixed(2)) : 0

        totalCgst = parseFloat(((finalTaxableValue * cgstPer) / 100).toFixed(2))
        totalSgst = parseFloat(((finalTaxableValue * sgstPer) / 100).toFixed(2))
        totalIgst = parseFloat(((finalTaxableValue * igstPer) / 100).toFixed(2))
        totalCess = parseFloat(((finalTaxableValue * cessPer) / 100).toFixed(2))
        totalBeforeRoundOff = parseFloat((finalTaxableValue + totalCgst + totalSgst + totalIgst + totalCess).toFixed(2))
      } else {
        const taxableValue = totalGross - finalDiscount
        finalTaxableValue = parseFloat(taxableValue.toFixed(2))
        totalCgst = parseFloat(((taxableValue * cgstPer) / 100).toFixed(2))
        totalSgst = parseFloat(((taxableValue * sgstPer) / 100).toFixed(2))
        totalIgst = parseFloat(((taxableValue * igstPer) / 100).toFixed(2))
        totalCess = parseFloat(((taxableValue * cessPer) / 100).toFixed(2))
        totalBeforeRoundOff = parseFloat((taxableValue + totalCgst + totalSgst + totalIgst + totalCess).toFixed(2))
      }

      // Apply rounding on the backend to ensure consistency
      const [settingsRows] = await db.query(
        'SELECT bill_round_off, bill_round_off_to FROM mstoutlet_settings WHERE outletid = ?',
        [bill.outletid]
      )
      const settings = settingsRows[0] || {}
      const { bill_round_off, bill_round_off_to } = settings
      let finalAmount = totalBeforeRoundOff
      let finalRoundOff = 0

      if (bill_round_off && bill_round_off_to > 0) {
        finalAmount = Math.round(totalBeforeRoundOff / bill_round_off_to) * bill_round_off_to
        finalRoundOff = finalAmount - totalBeforeRoundOff
      }

      // 4. Update the bill header with all correct values in one go
      await db.query(
        `
        UPDATE TAxnTrnbill
        SET Amount = ?, Discount = ?, DiscPer = ?, DiscountType = ?, CGST = ?, SGST = ?, IGST = ?, CESS = ?, RoundOFF = ?, isBilled = 0, TaxableValue = ?
        WHERE TxnID = ?
      `,
        [
          finalAmount,
          finalDiscount,
          finalDiscPer,
          finalDiscountType,
          totalCgst,
          totalSgst,
          totalIgst,
          totalCess,
          finalRoundOff,
          finalTaxableValue,
          Number(id),
        ]
      )

      // If the bill was previously billed (printed), set table status to occupied (1)
      if (bill.isBilled === 1 && bill.TableID) {
        await db.query('UPDATE msttablemanagement SET status = 1 WHERE tableid = ?', [bill.TableID])
      }
      
      await db.query('COMMIT')
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

    res.json(ok('Discount applied successfully to the existing KOT.'))
  } catch (error) {
    // console.error('Error in applyDiscountToBill:', error)
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to apply discount',
        data: null,
        error: error.message,
      })
  }
}

/* -------------------------------------------------------------------------- */
/* 14) getPendingOrders → fetch pending orders for pickup or delivery        */
/* -------------------------------------------------------------------------- */
exports.getPendingOrders = async (req, res) => {
  try {
    const { type } = req.query
    let whereClauses = ['b.isCancelled = 0', 'b.isSetteled = 0']
    const params = []

    // Filter by Order_Type which will be 'Pickup', 'Delivery', or 'TAKEAWAY'
    if (type === 'pickup') {
      whereClauses.push('b.Order_Type = ?')
      params.push('Pickup')
    } else if (type === 'delivery') {
      whereClauses.push('b.Order_Type = ?')
      params.push('Delivery')
    } else if (type === 'takeaway') {
      whereClauses.push('b.Order_Type IN (?, ?)')
      params.push('Pickup')
      params.push('Delivery')
    }

    const sql = `
      SELECT
        b.*,
        b.CustomerName,
        b.orderNo,
        b.isBilled,  -- ✅ ADD THIS LINE
        (SELECT MAX(d2.KOTNo) FROM TAxnTrnbilldetails d2 WHERE d2.TxnID = b.TxnID) as KOTNo,
        b.outletid,
        b.MobileNo,
        GROUP_CONCAT(
          DISTINCT json_object(
            'TXnDetailID', d.TXnDetailID,
            'ItemID', d.ItemID,
            -- ✅ Show remaining quantity after reversal
            'Qty', (d.Qty - COALESCE(d.RevQty, 0)),
            'RuntimeRate', d.RuntimeRate,
            'item_name', m.item_name,
            'isBilled', d.isBilled  
          )
        ) as _details
      FROM TAxnTrnbill b
      LEFT JOIN TAxnTrnbilldetails d ON d.TxnID = b.TxnID AND d.isCancelled = 0
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY b.TxnID, b.TxnNo
      ORDER BY b.TxnDatetime DESC
    `

    const [rows] = await db.query(sql, params)

    const orders = (Array.isArray(rows) ? rows : []).map((r) => ({
      id: r.TxnID,
      txnId: r.TxnID,
      kotNo: r.KOTNo,
      orderNo: r.orderNo,
      isBilled: r.isBilled,
      outletid: r.outletid,
      customer: {
        name: r.CustomerName || '',
        mobile: r.MobileNo || '',
      },
      items: r._details
        ? JSON.parse(`[${r._details}]`)
            .filter((d) => d && d.Qty > 0) // ✅ Hide fully reversed items
            .map((d) => ({
              name: d.item_name || '',
              qty: d.Qty || 0,
              price: d.RuntimeRate || 0,
              ItemID: d.ItemID,
              TXnDetailID: d.TXnDetailID,
            }))
        : [],
      total: r.Amount || 0,
      type: r.Order_Type || r.table_name,
    }))

    res.json(ok('Fetched pending orders', orders))
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending orders',
      data: null,
      error: error.message,
    })
  }
}

/* -------------------------------------------------------------------------- */
/* 15) updatePendingOrder → update a pending order with notes and items      */
/* -------------------------------------------------------------------------- */
exports.updatePendingOrder = async (req, res) => {
  try {
    const { id } = req.params
    const { notes, items, linkedItems } = req.body

    if (!id) {
      return res.status(400).json({ success: false, message: 'Order ID is required', data: null })
    }

    const [billRows] = await db.query(
      'SELECT * FROM TAxnTrnbill WHERE TxnID = ? AND isBilled = 0 AND isCancelled = 0',
      [Number(id)]
    )
    const bill = billRows[0]
    if (!bill) {
      return res
        .status(404)
        .json({ success: false, message: 'Pending order not found', data: null })
    }

    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
      // Update header with notes (using SpecialInst field or similar)
      await db.query(
        `
        UPDATE TAxnTrnbill 
        SET SpecialInst = ?, 
            CustomerName = COALESCE(?, CustomerName),
            MobileNo = COALESCE(?, MobileNo)
        WHERE TxnID = ?
      `,
        [notes || null, req.body.CustomerName || null, req.body.MobileNo || null, Number(id)]
      )

      // Handle linked items if provided (simple merge or update - assuming linking by updating items)
      if (linkedItems && Array.isArray(linkedItems) && linkedItems.length > 0) {
        // For simplicity, add linked items to the current order's details
        // In a real scenario, this might involve moving from another order
        for (const item of linkedItems) {
          await db.query(
            `
            INSERT INTO TAxnTrnbilldetails (
              TxnID, ItemID, Qty, RuntimeRate, SpecialInst, isBilled
            ) VALUES (?, ?, ?, ?, ?, 0)
          `,
            [Number(id), item.ItemID, item.Qty || 0, item.RuntimeRate || 0, item.SpecialInst || null]
          )
        }
      }

      // Delete existing details and insert new items
      await db.query('DELETE FROM TAxnTrnbilldetails WHERE TxnID = ?', [Number(id)])

      if (Array.isArray(items) && items.length > 0) {
        let totalGross = 0
        for (const item of items) {
          const qty = Number(item.Qty) || 0
          const rate = Number(item.RuntimeRate) || 0
          const lineTotal = qty * rate
          totalGross += lineTotal
          await db.query(
            `
            INSERT INTO TAxnTrnbilldetails (
              TxnID, ItemID, Qty, RuntimeRate, SpecialInst, isBilled
            ) VALUES (?, ?, ?, ?, ?, 0)
          `,
            [Number(id), item.ItemID, qty, rate, item.SpecialInst || null]
          )
        }
        // Update header totals
        await db.query('UPDATE TAxnTrnbill SET GrossAmt = ?, Amount = ? WHERE TxnID = ?', [
          totalGross,
          totalGross,
          Number(id),
        ])
      }
      
      await db.query('COMMIT')
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

    // Fetch updated order
    const [headerRows] = await db.query('SELECT * FROM TAxnTrnbill WHERE TxnID = ?', [Number(id)])
    const header = headerRows[0]
    const [details] = await db.query(
      'SELECT * FROM TAxnTrnbilldetails WHERE TxnID = ? AND isCancelled = 0 ORDER BY TXnDetailID',
      [Number(id)]
    )

    res.json(ok('Pending order updated', { ...header, details }))
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to update pending order',
        data: null,
        error: error.message,
      })
  }
}

/* -------------------------------------------------------------------------- */
/* 16) getLinkedPendingItems → fetch linked pending items for an order       */
/* -------------------------------------------------------------------------- */
exports.getLinkedPendingItems = async (req, res) => {
  try {
    const { id } = req.params // orderId is TxnID

    if (!id) {
      return res.status(400).json({ success: false, message: 'Order ID is required', data: null })
    }

    const [billRows] = await db.query(
      'SELECT * FROM TAxnTrnbill WHERE TxnID = ? AND isBilled = 0 AND isCancelled = 0',
      [Number(id)]
    )
    const bill = billRows[0]
    if (!bill) {
      return res
        .status(404)
        .json({ success: false, message: 'Pending order not found', data: null })
    }

    // Fetch details for this order (assuming linked means associated items)
    // If there's a separate linking table, query that; here assuming direct details
    const [details] = await db.query(
      `
      SELECT d.*, COALESCE(m.item_name, 'Unknown Item') AS ItemName
      FROM TAxnTrnbilldetails d
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE d.TxnID = ? AND d.isCancelled = 0 AND d.isBilled = 0
      ORDER BY d.TXnDetailID
    `,
      [Number(id)]
    )

    // If linked items are from other orders, this would need adjustment
    // For now, return the order's pending items as "linked"

    res.json(ok('Fetched linked pending items', details))
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to fetch linked pending items',
        data: null,
        error: error.message,
      })
  }
}

/* -------------------------------------------------------------------------- */
/* 17) getBillsByType → fetch bills by a specific order type (e.g., Quick Bill) */
/* -------------------------------------------------------------------------- */
exports.getBillsByType = async (req, res) => {
  const { type } = req.params
  try {
    if (!type) {
      return res.status(400).json({ success: false, message: 'Order type is required.' })
    }

    // Use a parameterized query to prevent SQL injection
    const sql = `
      SELECT 
        b.TxnID,
        b.TxnNo,
        b.CustomerName,
        b.MobileNo,
        b.isreversebill,
        b.Amount,
        (SELECT GROUP_CONCAT(s.PaymentType) FROM TrnSettlement s WHERE s.OrderNo = b.TxnNo) as PaymentMode
      FROM TAxnTrnbill b
WHERE b.Order_Type = ? AND b.isCancelled = 0 AND b.isSetteled = 0
      ORDER BY b.TxnDatetime DESC
    `

    const [rows] = await db.query(sql, [type])

    const data = rows.map((r) => ({
      ...r,
      GrandTotal: r.Amount, // Alias Amount to GrandTotal for frontend consistency
    }))

    res.json(ok(`Fetched ${type} bills`, data))
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: `Failed to fetch ${type} bills`,
        data: null,
        error: error.message,
      })
  }
}

/* -------------------------------------------------------------------------- */
/* 18) getAllBillsForBillingTab → fetch all bills for the billing tab view    */
/* -------------------------------------------------------------------------- */
exports.getAllBillsForBillingTab = async (req, res) => {
  try {

    const { curr_date } = req.query;

    const sql = `
      SELECT 
        b.TxnID,
        b.TxnNo,
        COALESCE(t.table_name, b.table_name, b.Order_Type, 'Dine-in') as table_name,
        COALESCE(b.Order_Type, 'Dine-in') as OrderType,
        b.CustomerName,
        b.MobileNo as Mobile,
        (
          SELECT GROUP_CONCAT(s.PaymentType) 
          FROM TrnSettlement s 
          WHERE s.OrderNo = b.TxnNo
        ) as PaymentMode,
        b.Amount as GrandTotal,
        b.TxnDatetime as CreatedDate
      FROM TAxnTrnbill b
      LEFT JOIN msttablemanagement t ON b.TableID = t.tableid
      WHERE 
        b.isCancelled = 0 
        AND (b.isBilled = 1 OR b.isSetteled = 1)
        AND DATE(b.TxnDatetime) = DATE(?)
      ORDER BY b.TxnDatetime DESC
    `;

    const [rows] = await db.query(sql, [curr_date]);

    res.json(ok('Fetched bills for selected date', rows));

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bills',
      data: null,
      error: error.message,
    });
  }
};

/* -------------------------------------------------------------------------- */
/* 19) reverseBill → Mark a bill as reversed (for F9 action)                  */
/* -------------------------------------------------------------------------- */
exports.reverseBill = async (req, res) => {
  try {
    const { id: txnId } = req.params

    if (!txnId) {
      return res.status(400).json({ success: false, message: 'Transaction ID is required.' })
    }

    // ✅ Check if bill exists and get its TableID
    const [billRows] = await db.query(
      'SELECT TxnID, TableID, Amount FROM TAxnTrnbill WHERE TxnID = ?',
      [txnId]
    )
    const bill = billRows[0]
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found.' })
    }

    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
      // ✅ Reverse the bill:
      // 1. Mark it as reversed (isreversebill = 1) and cancelled (isCancelled = 1).
      // 2. Reset billing and settlement flags.
      // 3. Store the original total amount in RevKOT (revAmt).
      // 4. Zero out financial fields.
      await db.query(`
        UPDATE TAxnTrnbill
        SET 
          isreversebill = 1, 
          isCancelled = 1, 
          isBilled = 1,
          isSetteled = 1,
          RevKOT = ?,
          -- Zero out financial fields to reflect reversal
          Amount = 0,
          GrossAmt = 0,
          CGST = 0, SGST = 0, IGST = 0, CESS = 0
        WHERE TxnID = ?
      `, [bill.Amount, txnId])

      // ✅ If the bill had a table, update its status to vacant (0)
      if (bill.TableID) {
        // Get the table info to check if it's a sub-table
        const [tableInfoRows] = await db.query(`SELECT * FROM msttablemanagement WHERE tableid = ?`, [bill.TableID]);
        const tableInfo = tableInfoRows[0];
        
        // Determine the parent table ID - if this table is a sub-table, use its parentTableId, otherwise use its own tableid
        const parentTableIdToUse = tableInfo && tableInfo.parentTableId ? tableInfo.parentTableId : bill.TableID;
        
        // console.log(`ReverseBill - Using parentTableId: ${parentTableIdToUse} for deleting sub-tables`);
        
        // Update the main table status to vacant
        await db.query(`
          UPDATE msttablemanagement 
          SET status = 0 
          WHERE tableid = ?`, [bill.TableID])
        await db.query(`DELETE FROM msttablemanagement WHERE tableid = ? AND isTemporary = 1`, [bill.TableID])

        // Delete all sub-tables (temporary tables) associated with this parent table
        // console.log(`ReverseBill - Deleting sub-tables for parent table ${parentTableIdToUse}`)
        
      }
      
      await db.query('COMMIT')
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

    res.json({ success: true, message: 'Bill has been reversed successfully.' })
  } catch (error) {
    // console.error('Error reversing bill:', error)
    res
      .status(500)
      .json({ success: false, message: 'Internal server error while reversing the bill.' })
  }
}
/* -------------------------------------------------------------------------- */
/* 20) getBillStatusByTable → fetch isBilled/isSetteled for a table          */
/* -------------------------------------------------------------------------- */
exports.getBillStatusByTable = async (req, res) => {
  try {
    const { tableId } = req.params
    const [billRows] = await db.query(
      `
      SELECT isBilled, isSetteled, TxnNo, Amount, BilledDate
      FROM TAxnTrnbill
      WHERE TableID = ?
      ORDER BY TxnID DESC LIMIT 1
    `,
      [Number(tableId)]
    )
    const bill = billRows[0]

    if (!bill) {
      return res.json({ success: true, data: { isBilled: 0, isSetteled: 0 } })
    }

    res.json({ success: true, data: bill })
  } catch (error) {
    // console.error('Error fetching bill status:', error)
    res.status(500).json({ success: false, message: 'Error fetching bill status' })
  }
}

/* -------------------------------------------------------------------------- */
/* 21) saveFullReverse → Save a full table reversal                           */
/* -------------------------------------------------------------------------- */
exports.saveFullReverse = async (req, res) => {
  try {
    const { txnId, tableId, reversedItems, userId, reversalReason } = req.body

    if (!txnId || !Array.isArray(reversedItems) || reversedItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required data for reversal.' })
    }

    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
      // Mark the bill header as reversed and cancelled
      await db.query(
        `
        UPDATE TAxnTrnbill
        SET isreversebill = 1, isCancelled = 1, status = 0
        WHERE TxnID = ?
      `,
        [txnId]
      )

      // Mark all detail items as cancelled
      await db.query(
        `
        UPDATE TAxnTrnbilldetails
        SET isCancelled = 1, RevQty = Qty
        WHERE TxnID = ?
      `,
        [txnId]
      )

      // If a tableId is provided (for Dine-in), update its status to vacant
      if (tableId) {
        await db.query(
          `
          UPDATE msttablemanagement
          SET status = 0
          WHERE tableid = ?
        `,
          [tableId]
        )
      }
      
      await db.query('COMMIT')
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

    res.json({ success: true, message: 'Full bill reversed successfully.' })
  } catch (error) {
    // console.error('Error in saveFullReverse:', error)
    res
      .status(500)
      .json({ success: false, message: 'Failed to process full reversal.', error: error.message })
  }
}

/* -------------------------------------------------------------------------- */
/* 22) reverseItem → Reverse quantity for a single item                       */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* 23) transferKOT → Transfer KOT/items between tables (FINAL FIXED VERSION)   */
/* -------------------------------------------------------------------------- */
exports.transferKOT = async (req, res) => {
  const { sourceTableId, proposedTableId, targetTableName, selectedItems } = req.body

  if (!selectedItems || selectedItems.length === 0) {
    return res.json({ success: false, message: 'No items selected' })
  }

  if (sourceTableId === proposedTableId) {
    return res.json({ success: false, message: 'Source and target table cannot be same' })
  }

  try {
    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
      /* ================= SOURCE BILL ================= */
      const [sourceBillRows] = await db.query(`
        SELECT TxnID, outletid, HotelID
        FROM TAxnTrnbill
        WHERE TableID = ? AND isSetteled = 0
      `, [sourceTableId])
      const sourceBill = sourceBillRows[0]

      if (!sourceBill) throw new Error('Source bill not found')

      const sourceTxnId = sourceBill.TxnID

      /* ================= TARGET STATUS ================= */
      const [targetRowRows] = await db.query(`
        SELECT status FROM msttablemanagement
        WHERE tableid = ?
      `, [proposedTableId])
      const targetRow = targetRowRows[0]

      if (!targetRow) throw new Error('Target table not found')

      const targetStatus = targetRow.status

      let targetBill = null
      if (targetStatus === 1) {
        const [targetBillRows] = await db.query(`
          SELECT TxnID FROM TAxnTrnbill
          WHERE TableID = ? AND isSetteled = 0
        `, [proposedTableId])
        targetBill = targetBillRows[0]
      }

      const ids = selectedItems.map(i => i.txnDetailId)
      if (!ids.length) throw new Error('No valid items')

      /* =================================================
         CASE 1: TARGET OCCUPIED → MERGE
      ================================================= */
      if (targetStatus === 1) {
        const placeholders = ids.map(() => '?').join(',')
        await db.query(`
          UPDATE TAxnTrnbilldetails
          SET TxnID=?, TableID=?, table_name=?
          WHERE TXnDetailID IN (${placeholders})
        `, [targetBill.TxnID, proposedTableId, targetTableName, ...ids])

        /* ---- delete source bill if empty ---- */
        const [remainingRows] = await db.query(`
          SELECT COUNT(*) as count
          FROM TAxnTrnbilldetails
          WHERE TxnID = ? AND isCancelled = 0
        `, [sourceTxnId])
        const remaining = remainingRows[0].count

        if (remaining === 0) {
          await db.query(`DELETE FROM TAxnTrnbill WHERE TxnID = ?`, [sourceTxnId])
        }

        await db.query('COMMIT')
        return res.json({ success: true, message: 'KOT transfer completed successfully' })
      }

      /* =================================================
         CASE 2: TARGET VACANT
      ================================================= */

      // Create new bill for target
      const [newBillResult] = await db.query(`
        INSERT INTO TAxnTrnbill (
          TableID, table_name, PrevTableID,
          outletid, HotelID,
          isSetteled, isBilled, isTrnsfered,
          TxnDatetime
        )
        SELECT ?, ?, ?, outletid, HotelID,
               0, 0, 1, CURRENT_TIMESTAMP
        FROM TAxnTrnbill
        WHERE TxnID=?
      `, [proposedTableId, targetTableName, sourceTableId, sourceTxnId])

      const newTxnId = newBillResult.insertId

      const placeholders = ids.map(() => '?').join(',')
      await db.query(`
        UPDATE TAxnTrnbilldetails
        SET TxnID=?, TableID=?, table_name=?
        WHERE TXnDetailID IN (${placeholders})
      `, [newTxnId, proposedTableId, targetTableName, ...ids])

      await db.query(`UPDATE msttablemanagement SET status=1 WHERE tableid=?`, [proposedTableId])

      /* ---- delete source bill if empty ---- */
      const [remainingRows] = await db.query(`
        SELECT COUNT(*) as count
        FROM TAxnTrnbilldetails
        WHERE TxnID = ? AND isCancelled = 0
      `, [sourceTxnId])
      const remaining = remainingRows[0].count

      if (remaining === 0) {
        await db.query(`DELETE FROM TAxnTrnbill WHERE TxnID = ?`, [sourceTxnId])
      }

      await db.query('COMMIT')
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

    /* =================================================
       FINAL CLEANUP FOR SOURCE TABLE
    ================================================= */

    // Get the source table info to check if it's a sub-table
    const [sourceTableInfoRows] = await db.query(`
      SELECT * FROM msttablemanagement
      WHERE tableid = ?
    `, [sourceTableId])
    const sourceTableInfo = sourceTableInfoRows[0]

    // Check if source is a sub-table (has parentTableId)
    const isSubTable = sourceTableInfo && sourceTableInfo.parentTableId

    if (isSubTable) {
      // For sub-tables, check if there are any remaining items on the PARENT table
      const parentTableId = sourceTableInfo.parentTableId
      
      // Check if there are any remaining items/bills for the parent table
      const [remainingParentBillsRows] = await db.query(`
        SELECT COUNT(*) as count
        FROM TAxnTrnbill
        WHERE TableID = ? AND isSetteled = 0 AND isCancelled = 0
      `, [parentTableId])
      const remainingParentBills = remainingParentBillsRows[0].count

      if (remainingParentBills === 0) {
        // Parent table also has no remaining bills, make parent table vacant
        await db.query(`
          UPDATE msttablemanagement
          SET status = 0
          WHERE tableid = ?
        `, [parentTableId])
      }

      // Delete the temporary sub-table (10A)
      await db.query(`
        DELETE FROM msttablemanagement
        WHERE tableid = ? AND isTemporary = 1
      `, [sourceTableId])
      
      // Make the sub-table vacant as well
      await db.query(`
        UPDATE msttablemanagement
        SET status = 0
        WHERE tableid = ?
      `, [sourceTableId])
    } else {
      // For regular tables
      const [remainingBillsRows] = await db.query(`
        SELECT COUNT(*) as count
        FROM TAxnTrnbill
        WHERE TableID = ? AND isSetteled = 0 AND isCancelled = 0
      `, [sourceTableId])
      const remainingBills = remainingBillsRows[0].count

      if (remainingBills === 0) {
        // Make table vacant
        await db.query(`
          UPDATE msttablemanagement
          SET status = 0
          WHERE tableid = ?
        `, [sourceTableId])

        // Delete temporary sub tables (10A,10B,10C type) if any
        await db.query(`
          DELETE FROM msttablemanagement
          WHERE parentTableId = ? AND isTemporary = 1
        `, [sourceTableId])
      }
    }

    res.json({ success: true, message: 'KOT transfer completed successfully' })

  } catch (err) {
    // console.error('KOT Transfer Error:', err)
    res.status(500).json({
      success: false,
      message: 'KOT transfer failed',
      error: err.message,
    })
  }
}
/* -------------------------------------------------------------------------- */
/* 24) transferTable → Transfer all items from source table to target table  */
/* -------------------------------------------------------------------------- */
exports.transferTable = async (req, res) => {
  const { sourceTableId, targetTableId } = req.body

  if (!sourceTableId || !targetTableId) {
    return res.json({ success: false, message: 'Source and target table IDs are required' })
  }

  if (sourceTableId === targetTableId) {
    return res.json({ success: false, message: 'Source and target table cannot be the same' })
  }

  try {
    /* ================= BILL RECALC ================= */
    const recalculateBillTotals = async (txnId) => {
      const [billHeaderRows] = await db.query(
        `
        SELECT Discount, outletid
        FROM TAxnTrnbill
        WHERE TxnID = ?
      `,
        [txnId]
      )
      const billHeader = billHeaderRows[0]
      if (!billHeader) return

      const [details] = await db.query(
        `
        SELECT * FROM TAxnTrnbilldetails
        WHERE TxnID = ? AND isCancelled = 0
      `,
        [txnId]
      )
      if (details.length === 0) return

      const [outletRows] = await db.query(
        `
        SELECT include_tax_in_invoice, bill_round_off, bill_round_off_to
        FROM mstoutlet_settings WHERE outletid = ?
      `,
        [billHeader.outletid]
      )
      const outlet = outletRows[0] || {}

      let gross = 0,
        taxable = 0,
        cgst = 0,
        sgst = 0,
        igst = 0,
        cess = 0
      const includeTax = outlet.include_tax_in_invoice || 0

      for (const d of details) {
        const lineGross = (Number(d.Qty) || 0) * (Number(d.RuntimeRate) || 0)
        gross += lineGross

        const cg = Number(d.CGST) || 0
        const sg = Number(d.SGST) || 0
        const ig = Number(d.IGST) || 0
        const ce = Number(d.CESS) || 0

        if (includeTax === 1) {
          const per = cg + sg + ig + ce
          const base = per > 0 ? lineGross / (1 + per / 100) : lineGross
          taxable += base
          cgst += (base * cg) / 100
          sgst += (base * sg) / 100
          igst += (base * ig) / 100
          cess += (base * ce) / 100
        } else {
          taxable += lineGross
          cgst += (lineGross * cg) / 100
          sgst += (lineGross * sg) / 100
          igst += (lineGross * ig) / 100
          cess += (lineGross * ce) / 100
        }
      }

      const discount = Number(billHeader.Discount) || 0
      const discountedTaxable = Math.max(0, taxable - discount)

      let amount = discountedTaxable + cgst + sgst + igst + cess
      let roundOff = 0

      if (outlet.bill_round_off && outlet.bill_round_off_to > 0) {
        const rounded = Math.round(amount / outlet.bill_round_off_to) * outlet.bill_round_off_to
        roundOff = rounded - amount
        amount = rounded
      }

      await db.query(
        `
        UPDATE TAxnTrnbill
        SET GrossAmt=?, CGST=?, SGST=?, IGST=?, CESS=?, Amount=?, RoundOFF=?
        WHERE TxnID=?
      `,
        [gross, cgst, sgst, igst, cess, amount, roundOff, txnId]
      )
    }

    /* ================= TRANSACTION ================= */
    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
      /* ---------- SOURCE BILL ---------- */
      const [sourceBillRows] = await db.query(
        `
        SELECT TxnID FROM TAxnTrnbill
        WHERE TableID = ? AND isSetteled = 0 AND isCancelled = 0
      `,
        [sourceTableId]
      )
      const sourceBill = sourceBillRows[0]

      if (!sourceBill) throw new Error('No active bill found for source table')
      const sourceTxnId = sourceBill.TxnID

      /* ---------- TARGET STATUS ---------- */
      const [targetRowRows] = await db.query(
        `
        SELECT status FROM msttablemanagement WHERE tableid = ?
      `,
        [targetTableId]
      )
      const targetRow = targetRowRows[0]

      if (!targetRow) throw new Error('Target table not found')
      const targetStatus = targetRow.status // 0 vacant, 1 occupied

      let targetBill = null
      if (targetStatus === 1) {
        const [targetBillRows] = await db.query(
          `
          SELECT TxnID FROM TAxnTrnbill
          WHERE TableID = ? AND isSetteled = 0 AND isCancelled = 0
        `,
          [targetTableId]
        )
        targetBill = targetBillRows[0]
      }

      /* ---------- GET ALL ITEMS FROM SOURCE ---------- */
      const [sourceItems] = await db.query(
        `
        SELECT TXnDetailID FROM TAxnTrnbilldetails
        WHERE TxnID = ? AND isCancelled = 0
      `,
        [sourceTxnId]
      )

      if (sourceItems.length === 0) throw new Error('No items to transfer from source table')

      const ids = sourceItems.map((i) => i.TXnDetailID)

      /* =================================================
         CASE A: TARGET OCCUPIED
         → MERGE ALL ITEMS INTO TARGET BILL
         → DELETE SOURCE BILL
         → SET SOURCE TABLE VACANT
      ================================================= */
      if (targetStatus === 1) {
        if (!targetBill) throw new Error('Target bill not found')

        // Move all items to target Txn
        const placeholders = ids.map(() => '?').join(',')
        await db.query(
          `
          UPDATE TAxnTrnbilldetails
          SET TxnID=?, TableID=?
          WHERE TXnDetailID IN (${placeholders})
        `,
          [targetBill.TxnID, targetTableId, ...ids]
        )

        // Delete source bill completely
        await db.query(
          `
          DELETE FROM TAxnTrnbill WHERE TxnID=?
        `,
          [sourceTxnId]
        )

        // Source table vacant
        await db.query(`UPDATE msttablemanagement SET status=0 WHERE tableid=?`, [sourceTableId])
        
        // Delete temporary tables (sub-tables) associated with source table
        await db.query(`DELETE FROM msttablemanagement WHERE tableid = ? AND isTemporary = 1`, [sourceTableId])

        // Recalculate target bill only
        await recalculateBillTotals(targetBill.TxnID)
        
        await db.query('COMMIT')
        return res.json({ success: true, message: 'Table transfer completed successfully' })
      }

      /* =================================================
         CASE B: TARGET VACANT
         → MOVE ENTIRE BILL TO TARGET TABLE
         → SET TARGET OCCUPIED, SOURCE VACANT
      ================================================= */
      if (targetStatus === 0) {
        // Get target table name
        const [targetTableInfoRows] = await db.query(
          `
          SELECT table_name FROM msttablemanagement WHERE tableid = ?
        `,
          [targetTableId]
        )
        const targetTableInfo = targetTableInfoRows[0]

        if (!targetTableInfo) throw new Error('Target table info not found')

        // Update bill header
        await db.query(
          `
          UPDATE TAxnTrnbill
          SET TableID=?, table_name=?, PrevTableID=?, isTrnsfered=1
          WHERE TxnID=?
        `,
          [targetTableId, targetTableInfo.table_name, sourceTableId, sourceTxnId]
        )

        // Update all details
        await db.query(
          `
          UPDATE TAxnTrnbilldetails
          SET TableID=?, table_name=?
          WHERE TxnID=?
        `,
          [targetTableId, targetTableInfo.table_name, sourceTxnId]
        )

        // Update table statuses
        // Delete temporary tables (sub-tables) associated with source table
        await db.query(`DELETE FROM msttablemanagement WHERE tableid = ? AND isTemporary = 1`, [sourceTableId])
        
        await db.query(`UPDATE msttablemanagement SET status=0 WHERE tableid=?`, [sourceTableId])
        await db.query(`UPDATE msttablemanagement SET status=1 WHERE tableid=?`, [targetTableId])
        
        // Recalculate bill totals
        await recalculateBillTotals(sourceTxnId)
        
        await db.query('COMMIT')
        return res.json({ success: true, message: 'Table transfer completed successfully' })
      }
      
      await db.query('COMMIT')
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

    res.json({ success: true, message: 'Table transfer completed successfully' })
  } catch (err) {
    // console.error('Table Transfer Error:', err)
    res.status(500).json({
      success: false,
      message: 'Table transfer failed',
      error: err.message,
    })
  }
}

/* -------------------------------------------------------------------------- */
/* 25) getGlobalKOTNumber → fetch the next global KOT number for an outlet    */
/* -------------------------------------------------------------------------- */
exports.getGlobalKOTNumber = async (req, res) => {
  try {
    const { outletid, curr_date } = req.query

    if (!outletid) {
      return res.status(400).json({ success: false, message: 'outletid is required', data: null })
    }

    // Use curr_date from request if provided, otherwise use system date
    const kotDate = curr_date || new Date().toISOString().split('T')[0];
    
    const [resultRows] = await db.query(
      `
      SELECT MAX(KOTNo) as maxKOT
      FROM TAxnTrnbilldetails
      WHERE outletid = ? AND date(KOTUsedDate) = date(?)
    `,
      [Number(outletid), kotDate]
    )
    const result = resultRows[0]

    const nextKOT = (result?.maxKOT || 0) + 1

    res.json(ok('Fetched next global KOT number', { nextKOT }))
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to fetch global KOT number',
        data: null,
        error: error.message,
      })
  }
}

/* -------------------------------------------------------------------------- */
/* 26) getGlobalReverseKOTNumber → fetch the next global reverse KOT number for an outlet */
/* -------------------------------------------------------------------------- */
exports.getGlobalReverseKOTNumber = async (req, res) => {
  try {
    const { outletid, curr_date } = req.query

    if (!outletid) {
      return res.status(400).json({ success: false, message: 'outletid is required', data: null })
    }

    // Use curr_date from request if provided, otherwise use system date
    const kotDate = curr_date || new Date().toISOString().split('T')[0];

    const [resultRows] = await db.query(
      `
      SELECT MAX(RevKOTNo) as maxRevKOT
      FROM TAxnTrnbilldetails
      WHERE outletid = ? AND date(KOTUsedDate) = date(?)
    `,
      [Number(outletid), kotDate]
    )
    const result = resultRows[0]

    const nextRevKOT = (result?.maxRevKOT || 0) + 1

    res.json(ok('Fetched next global reverse KOT number', { nextRevKOT }))
    // console.log(nextRevKOT)
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to fetch global reverse KOT number',
        data: null,
        error: error.message,
      })
  }
}
module.exports = exports
