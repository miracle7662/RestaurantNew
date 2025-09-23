-- =====================================================
-- SQL Triggers for TAxnTrnbill Totals Auto-Update
-- =====================================================
-- These triggers automatically update TAxnTrnbill totals
-- when TAxnTrnbilldetails records are inserted, updated, or deleted

-- =====================================================
-- USER'S CUSTOM TRIGGER
-- =====================================================
-- Trigger: trg_update_bill_amount_after_insert
-- Purpose: Updates bill totals when new items are added to TAxnTrnbilldetails
-- Focus: Updates only GrossAmt, Discount, and Amount (simpler than comprehensive triggers)
-- =====================================================

CREATE TRIGGER IF NOT EXISTS trg_update_bill_amount_after_insert
AFTER INSERT ON TAxnTrnbilldetails
FOR EACH ROW
BEGIN
    -- Recalculate total for this TxnID
    UPDATE TAxnTrnbill
    SET GrossAmt = (
            SELECT IFNULL(SUM(Qty * RuntimeRate), 0)
            FROM TAxnTrnbilldetails
            WHERE TxnID = NEW.TxnID
              AND isCancelled = 0
        ),
        Discount = (
            SELECT IFNULL(SUM(Discount_Amount), 0)
            FROM TAxnTrnbilldetails
            WHERE TxnID = NEW.TxnID
              AND isCancelled = 0
        ),
        Amount = (
            SELECT IFNULL(SUM((Qty * RuntimeRate) - IFNULL(Discount_Amount,0)
                   + CGST_AMOUNT + SGST_AMOUNT + IGST_AMOUNT + CESS_AMOUNT), 0)
            FROM TAxnTrnbilldetails
            WHERE TxnID = NEW.TxnID
              AND isCancelled = 0
        )
    WHERE TxnID = NEW.TxnID;
END;

-- =====================================================
-- COMPREHENSIVE TRIGGER SYSTEM
-- =====================================================
-- These triggers provide more detailed tax calculations
-- =====================================================

-- =====================================================
-- 1. AFTER INSERT TRIGGER (COMPREHENSIVE)
-- =====================================================
-- Trigger: tr_update_totals_after_insert
-- Purpose: Updates bill totals when new items are added to TAxnTrnbilldetails
-- =====================================================

CREATE TRIGGER IF NOT EXISTS tr_update_totals_after_insert
AFTER INSERT ON TAxnTrnbilldetails
WHEN NEW.isCancelled = 0
BEGIN
    UPDATE TAxnTrnbill
    SET
        GrossAmt = COALESCE((
            SELECT SUM(RuntimeRate * Qty)
            FROM TAxnTrnbilldetails
            WHERE TxnID = NEW.TxnID AND isCancelled = 0
        ), 0),
        CGST = COALESCE((
            SELECT SUM(CGST_AMOUNT)
            FROM TAxnTrnbilldetails
            WHERE TxnID = NEW.TxnID AND isCancelled = 0
        ), 0),
        SGST = COALESCE((
            SELECT SUM(SGST_AMOUNT)
            FROM TAxnTrnbilldetails
            WHERE TxnID = NEW.TxnID AND isCancelled = 0
        ), 0),
        IGST = COALESCE((
            SELECT SUM(IGST_AMOUNT)
            FROM TAxnTrnbilldetails
            WHERE TxnID = NEW.TxnID AND isCancelled = 0
        ), 0),
        CESS = COALESCE((
            SELECT SUM(CESS_AMOUNT)
            FROM TAxnTrnbilldetails
            WHERE TxnID = NEW.TxnID AND isCancelled = 0
        ), 0),
        Discount = COALESCE((
            SELECT SUM(Discount_Amount)
            FROM TAxnTrnbilldetails
            WHERE TxnID = NEW.TxnID AND isCancelled = 0
        ), 0),
        Amount = COALESCE((
            SELECT SUM(RuntimeRate * Qty + CGST_AMOUNT + SGST_AMOUNT + IGST_AMOUNT + CESS_AMOUNT - Discount_Amount)
            FROM TAxnTrnbilldetails
            WHERE TxnID = NEW.TxnID AND isCancelled = 0
        ), 0)
    WHERE TxnID = NEW.TxnID;
END;

-- =====================================================
-- 2. AFTER UPDATE TRIGGER
-- =====================================================
-- Trigger: tr_update_totals_after_update
-- Purpose: Updates bill totals when items in TAxnTrnbilldetails are modified
-- =====================================================

CREATE TRIGGER IF NOT EXISTS tr_update_totals_after_update
AFTER UPDATE ON TAxnTrnbilldetails
WHEN NEW.isCancelled = 0 OR OLD.isCancelled = 0
BEGIN
    UPDATE TAxnTrnbill
    SET
        GrossAmt = COALESCE((
            SELECT SUM(RuntimeRate * Qty)
            FROM TAxnTrnbilldetails
            WHERE TxnID = NEW.TxnID AND isCancelled = 0
        ), 0),
        CGST = COALESCE((
            SELECT SUM(CGST_AMOUNT)
            FROM TAxnTrnbilldetails
            WHERE TxnID = NEW.TxnID AND isCancelled = 0
        ), 0),
        SGST = COALESCE((
            SELECT SUM(SGST_AMOUNT)
            FROM TAxnTrnbilldetails
            WHERE TxnID = NEW.TxnID AND isCancelled = 0
        ), 0),
        IGST = COALESCE((
            SELECT SUM(IGST_AMOUNT)
            FROM TAxnTrnbilldetails
            WHERE TxnID = NEW.TxnID AND isCancelled = 0
        ), 0),
        CESS = COALESCE((
            SELECT SUM(CESS_AMOUNT)
            FROM TAxnTrnbilldetails
            WHERE TxnID = NEW.TxnID AND isCancelled = 0
        ), 0),
        Discount = COALESCE((
            SELECT SUM(Discount_Amount)
            FROM TAxnTrnbilldetails
            WHERE TxnID = NEW.TxnID AND isCancelled = 0
        ), 0),
        Amount = COALESCE((
            SELECT SUM(RuntimeRate * Qty + CGST_AMOUNT + SGST_AMOUNT + IGST_AMOUNT + CESS_AMOUNT - Discount_Amount)
            FROM TAxnTrnbilldetails
            WHERE TxnID = NEW.TxnID AND isCancelled = 0
        ), 0)
    WHERE TxnID = NEW.TxnID;
END;

-- =====================================================
-- 3. AFTER DELETE TRIGGER
-- =====================================================
-- Trigger: tr_update_totals_after_delete
-- Purpose: Updates bill totals when items are removed from TAxnTrnbilldetails
-- =====================================================

CREATE TRIGGER IF NOT EXISTS tr_update_totals_after_delete
AFTER DELETE ON TAxnTrnbilldetails
WHEN OLD.isCancelled = 0
BEGIN
    UPDATE TAxnTrnbill
    SET
        GrossAmt = COALESCE((
            SELECT SUM(RuntimeRate * Qty)
            FROM TAxnTrnbilldetails
            WHERE TxnID = OLD.TxnID AND isCancelled = 0
        ), 0),
        CGST = COALESCE((
            SELECT SUM(CGST_AMOUNT)
            FROM TAxnTrnbilldetails
            WHERE TxnID = OLD.TxnID AND isCancelled = 0
        ), 0),
        SGST = COALESCE((
            SELECT SUM(SGST_AMOUNT)
            FROM TAxnTrnbilldetails
            WHERE TxnID = OLD.TxnID AND isCancelled = 0
        ), 0),
        IGST = COALESCE((
            SELECT SUM(IGST_AMOUNT)
            FROM TAxnTrnbilldetails
            WHERE TxnID = OLD.TxnID AND isCancelled = 0
        ), 0),
        CESS = COALESCE((
            SELECT SUM(CESS_AMOUNT)
            FROM TAxnTrnbilldetails
            WHERE TxnID = OLD.TxnID AND isCancelled = 0
        ), 0),
        Discount = COALESCE((
            SELECT SUM(Discount_Amount)
            FROM TAxnTrnbilldetails
            WHERE TxnID = OLD.TxnID AND isCancelled = 0
        ), 0),
        Amount = COALESCE((
            SELECT SUM(RuntimeRate * Qty + CGST_AMOUNT + SGST_AMOUNT + IGST_AMOUNT + CESS_AMOUNT - Discount_Amount)
            FROM TAxnTrnbilldetails
            WHERE TxnID = OLD.TxnID AND isCancelled = 0
        ), 0)
    WHERE TxnID = OLD.TxnID;
END;

-- =====================================================
-- TRIGGER EXECUTION VERIFICATION
-- =====================================================
-- After running this script, you can verify the triggers were created by running:
-- SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'tr_update_totals%';

-- =====================================================
-- TESTING THE TRIGGERS
-- =====================================================
-- You can test the triggers by running these sample statements:

-- 1. Create a test bill
-- INSERT INTO TAxnTrnbill (outletid, TxnNo, TableID, TxnDatetime)
-- VALUES (1, 'TEST001', 1, datetime('now'));

-- 2. Add items to test the INSERT trigger
-- INSERT INTO TAxnTrnbilldetails (TxnID, outletid, ItemID, RuntimeRate, Qty, CGST_AMOUNT, SGST_AMOUNT, IGST_AMOUNT, CESS_AMOUNT, Discount_Amount)
-- VALUES (1, 1, 1, 100.00, 2, 18.00, 18.00, 0.00, 0.00, 10.00);

-- 3. Update an item to test the UPDATE trigger
-- UPDATE TAxnTrnbilldetails SET Qty = 3 WHERE TXnDetailID = 1;

-- 4. Delete an item to test the DELETE trigger
-- DELETE FROM TAxnTrnbilldetails WHERE TXnDetailID = 1;

-- 5. Check the updated totals
-- SELECT * FROM TAxnTrnbill WHERE TxnID = 1;
