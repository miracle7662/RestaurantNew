// import { Exclude } from "react-bootstrap-icons"

// DELIMITER $$

// DROP PROCEDURE IF EXISTS sp_RecalculateCashBill_IncludeTax $$

// CREATE PROCEDURE sp_RecalculateCashBill_IncludeTax(
//     IN p_TxnID INT
// )
// BEGIN

//     DECLARE v_GrossAmt DECIMAL(12,2) DEFAULT 0;
//     DECLARE v_TaxableAmt DECIMAL(12,2) DEFAULT 0;

//     DECLARE v_CGST DECIMAL(12,2) DEFAULT 0;
//     DECLARE v_SGST DECIMAL(12,2) DEFAULT 0;
//     DECLARE v_IGST DECIMAL(12,2) DEFAULT 0;
//     DECLARE v_CESS DECIMAL(12,2) DEFAULT 0;

//     DECLARE v_Discount DECIMAL(12,2) DEFAULT 0;
//     DECLARE v_RoundOff DECIMAL(12,2) DEFAULT 0;

//     DECLARE v_ServiceChargePer DECIMAL(12,2) DEFAULT 0;
//     DECLARE v_ServiceChargeAmt DECIMAL(12,2) DEFAULT 0;

//     DECLARE v_FinalAmt DECIMAL(12,2) DEFAULT 0;

//     SELECT 
//         IFNULL(Discount,0),
//         IFNULL(ServiceCharge,0)
//     INTO 
//         v_Discount,
//         v_ServiceChargePer
//     FROM TAxnTrnBill
//     WHERE TxnID = p_TxnID;

//     DELETE FROM TAxnTrnBillDetails
//     WHERE TxnID = p_TxnID
//       AND (IFNULL(Qty,0) - IFNULL(RevQty,0)) <= 0;

//     UPDATE TAxnTrnBillDetails
//     SET

//         CGST_AMOUNT = ROUND(
//             ((((Qty-IFNULL(RevQty,0))*RuntimeRate) -
//             (((Qty-IFNULL(RevQty,0))*RuntimeRate) /
//             (1 + ((IFNULL(CGST,0)+IFNULL(SGST,0)+IFNULL(IGST,0)+IFNULL(CESS,0))/100))))
//             *
//             (IFNULL(CGST,0) /
//             NULLIF((IFNULL(CGST,0)+IFNULL(SGST,0)+IFNULL(IGST,0)+IFNULL(CESS,0)),0)))
//         ,2),

//         SGST_AMOUNT = ROUND(
//             ((((Qty-IFNULL(RevQty,0))*RuntimeRate) -
//             (((Qty-IFNULL(RevQty,0))*RuntimeRate) /
//             (1 + ((IFNULL(CGST,0)+IFNULL(SGST,0)+IFNULL(IGST,0)+IFNULL(CESS,0))/100))))
//             *
//             (IFNULL(SGST,0) /
//             NULLIF((IFNULL(CGST,0)+IFNULL(SGST,0)+IFNULL(IGST,0)+IFNULL(CESS,0)),0)))
//         ,2)

//     WHERE TxnID = p_TxnID
//       AND isCancelled = 0;

//     SELECT

//         IFNULL(SUM((Qty-IFNULL(RevQty,0))*RuntimeRate),0),

//         IFNULL(SUM(CGST_AMOUNT),0),

//         IFNULL(SUM(SGST_AMOUNT),0),

//         IFNULL(SUM(IGST_AMOUNT),0),

//         IFNULL(SUM(CESS_AMOUNT),0)

//     INTO

//         v_GrossAmt,
//         v_CGST,
//         v_SGST,
//         v_IGST,
//         v_CESS

//     FROM TAxnTrnBillDetails
//     WHERE TxnID = p_TxnID
//       AND isCancelled = 0;

//     SET v_TaxableAmt = ROUND(
//         v_GrossAmt -
//         (v_CGST + v_SGST + v_IGST + v_CESS)
//     ,2);

//     SET v_ServiceChargeAmt =
//         ROUND((v_TaxableAmt * v_ServiceChargePer)/100,2);

//     SET v_FinalAmt = ROUND(
//         v_GrossAmt +
//         v_ServiceChargeAmt -
//         v_Discount
//     ,2);

//     SET v_RoundOff = ROUND(
//         ROUND(v_FinalAmt,0) - v_FinalAmt
//     ,2);

//     SET v_FinalAmt = ROUND(
//         v_FinalAmt + v_RoundOff
//     ,2);

//     UPDATE TAxnTrnBill
//     SET
//         TaxableValue = ROUND(v_TaxableAmt,2),
//         GrossAmt = ROUND(v_GrossAmt,2),
//         ServiceCharge_Amount = ROUND(v_ServiceChargeAmt,2),
//         CGST = ROUND(v_CGST,2),
//         SGST = ROUND(v_SGST,2),
//         IGST = ROUND(v_IGST,2),
//         CESS = ROUND(v_CESS,2),
//         RoundOFF = ROUND(v_RoundOff,2),
//         Amount = ROUND(v_FinalAmt,2)

//     WHERE TxnID = p_TxnID;

//     UPDATE trnsettlement
//     SET Amount = ROUND(v_FinalAmt,2)
//     WHERE TxnID = p_TxnID;

// END $$

// DELIMITER ;


// -------Exclude----------------
// DELIMITER $$

// DROP PROCEDURE IF EXISTS sp_RecalculateCashBill_ExcludeTax $$

// CREATE PROCEDURE sp_RecalculateCashBill_ExcludeTax(
//     IN p_TxnID INT
// )
// BEGIN

//     DECLARE v_GrossAmt DECIMAL(12,2) DEFAULT 0;
//     DECLARE v_CGST DECIMAL(12,2) DEFAULT 0;
//     DECLARE v_SGST DECIMAL(12,2) DEFAULT 0;
//     DECLARE v_IGST DECIMAL(12,2) DEFAULT 0;
//     DECLARE v_CESS DECIMAL(12,2) DEFAULT 0;

//     DECLARE v_Discount DECIMAL(12,2) DEFAULT 0;
//     DECLARE v_RoundOff DECIMAL(12,2) DEFAULT 0;

//     DECLARE v_ServiceChargePer DECIMAL(12,2) DEFAULT 0;
//     DECLARE v_ServiceChargeAmt DECIMAL(12,2) DEFAULT 0;

//     DECLARE v_FinalAmt DECIMAL(12,2) DEFAULT 0;

//     SELECT 
//         IFNULL(Discount,0),
//         IFNULL(ServiceCharge,0)
//     INTO 
//         v_Discount,
//         v_ServiceChargePer
//     FROM TAxnTrnBill
//     WHERE TxnID = p_TxnID;

//     DELETE FROM TAxnTrnBillDetails
//     WHERE TxnID = p_TxnID
//       AND (IFNULL(Qty,0)-IFNULL(RevQty,0)) <= 0;

//     UPDATE TAxnTrnBillDetails
//     SET

//         CGST_AMOUNT = ROUND(
//             (((Qty-IFNULL(RevQty,0))*RuntimeRate) * IFNULL(CGST,0))/100
//         ,2),

//         SGST_AMOUNT = ROUND(
//             (((Qty-IFNULL(RevQty,0))*RuntimeRate) * IFNULL(SGST,0))/100
//         ,2),

//         IGST_AMOUNT = ROUND(
//             (((Qty-IFNULL(RevQty,0))*RuntimeRate) * IFNULL(IGST,0))/100
//         ,2),

//         CESS_AMOUNT = ROUND(
//             (((Qty-IFNULL(RevQty,0))*RuntimeRate) * IFNULL(CESS,0))/100
//         ,2)

//     WHERE TxnID = p_TxnID
//       AND isCancelled = 0;

//     SELECT

//         IFNULL(SUM((Qty-IFNULL(RevQty,0))*RuntimeRate),0),

//         IFNULL(SUM(CGST_AMOUNT),0),

//         IFNULL(SUM(SGST_AMOUNT),0),

//         IFNULL(SUM(IGST_AMOUNT),0),

//         IFNULL(SUM(CESS_AMOUNT),0)

//     INTO

//         v_GrossAmt,
//         v_CGST,
//         v_SGST,
//         v_IGST,
//         v_CESS

//     FROM TAxnTrnBillDetails
//     WHERE TxnID = p_TxnID
//       AND isCancelled = 0;

//     SET v_ServiceChargeAmt =
//         ROUND((v_GrossAmt * v_ServiceChargePer)/100,2);

//     SET v_FinalAmt = ROUND(
//         v_GrossAmt +
//         v_ServiceChargeAmt +
//         v_CGST +
//         v_SGST +
//         v_IGST +
//         v_CESS -
//         v_Discount
//     ,2);

//     SET v_RoundOff = ROUND(
//         ROUND(v_FinalAmt,0) - v_FinalAmt
//     ,2);

//     SET v_FinalAmt = ROUND(
//         v_FinalAmt + v_RoundOff
//     ,2);

//     UPDATE TAxnTrnBill
//     SET
//         TaxableValue = ROUND(v_GrossAmt,2),
//         GrossAmt = ROUND(v_GrossAmt,2),
//         ServiceCharge_Amount = ROUND(v_ServiceChargeAmt,2),
//         CGST = ROUND(v_CGST,2),
//         SGST = ROUND(v_SGST,2),
//         IGST = ROUND(v_IGST,2),
//         CESS = ROUND(v_CESS,2),
//         RoundOFF = ROUND(v_RoundOff,2),
//         Amount = ROUND(v_FinalAmt,2)

//     WHERE TxnID = p_TxnID;

//     UPDATE trnsettlement
//     SET Amount = ROUND(v_FinalAmt,2)
//     WHERE TxnID = p_TxnID;

// END $$

// DELIMITER ;