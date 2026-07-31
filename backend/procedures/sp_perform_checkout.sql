CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_perform_checkout`(
    IN p_checkin_id INT,
    IN p_checkout_reason VARCHAR(255),
    IN p_payment_method VARCHAR(50),
    IN p_total_amount DECIMAL(10,2),
    IN p_round_off_amount DECIMAL(10,2),
    IN p_net_payable DECIMAL(10,2),
    IN p_selected_rooms JSON,
    IN p_invoice_no VARCHAR(50),
    IN p_payment_id INT,
    IN p_payment_mode VARCHAR(50),
    IN p_is_settle TINYINT,
    IN p_is_print TINYINT,
    IN p_user_id INT,
    IN p_checkout_datetime DATETIME,
    IN p_is_undo TINYINT,
    IN p_undo_room_ids JSON,
    IN p_total_nights INT,
    -- New parameters for frontend data
    IN p_room_tariff_sum DECIMAL(10,2),
    IN p_ex_pax_charge DECIMAL(10,2),
    IN p_child_paid_amount DECIMAL(10,2),
    IN p_driver_charge DECIMAL(10,2),
    IN p_discount_amount DECIMAL(10,2),
    IN p_cgst_amount DECIMAL(10,2),
    IN p_sgst_amount DECIMAL(10,2),
    IN p_igst_amount DECIMAL(10,2),
    IN p_ex_cgst_amount DECIMAL(10,2),
    IN p_ex_sgst_amount DECIMAL(10,2),
    IN p_ex_igst_amount DECIMAL(10,2),
    IN p_child_cgst_amount DECIMAL(10,2),
    IN p_child_sgst_amount DECIMAL(10,2),
    IN p_child_igst_amount DECIMAL(10,2),
    IN p_driver_cgst_amount DECIMAL(10,2),
    IN p_driver_sgst_amount DECIMAL(10,2),
    IN p_driver_igst_amount DECIMAL(10,2),
    IN p_cess_amount DECIMAL(10,2),
    IN p_service_charge_amount DECIMAL(10,2),
    IN p_advance_amt DECIMAL(10,2),
    IN p_guest_id INT,
    IN p_guest_name VARCHAR(255),
    IN p_address VARCHAR(500),
    IN p_mobile VARCHAR(20),
    IN p_company_id INT,
    IN p_company_name VARCHAR(255),
    IN p_room_details JSON,   -- Room wise details with all data
    IN p_bill_no INT,   -- NEW: bill number (1=Lodging, 2=Restaurant, 3=Bar, 4=Pantry)
    IN p_dummy_pax INT
)
sp_perform_checkout: BEGIN
    DECLARE v_now DATETIME;
    DECLARE v_user_id INT;
    DECLARE v_ldg_bill_no VARCHAR(50);
    DECLARE v_hotel_id INT;
    DECLARE v_error_msg VARCHAR(500);
    DECLARE v_debug_msg VARCHAR(1000);
    DECLARE v_guest_id INT;

    DECLARE v_selected_rooms_str VARCHAR(2000) DEFAULT '';
    DECLARE v_selected_room_ids VARCHAR(2000) DEFAULT '';
    DECLARE v_selected_room_ids_all VARCHAR(2000) DEFAULT '';
    DECLARE v_active_room_ids VARCHAR(2000) DEFAULT '';
    DECLARE v_active_room_count INT DEFAULT 0;
    DECLARE v_all_checked_out_room_ids VARCHAR(2000) DEFAULT '';
    DECLARE v_all_checked_out_room_numbers VARCHAR(2000) DEFAULT '';

    DECLARE v_selected_active_room_ids VARCHAR(2000) DEFAULT '';
    DECLARE v_checked_out_selected_room_ids VARCHAR(2000) DEFAULT '';
    DECLARE v_mixed_mode TINYINT DEFAULT 0;

    DECLARE v_checkout_master_count INT DEFAULT 0;
    DECLARE v_total_rooms_in_checkin INT DEFAULT 0;
    DECLARE v_selected_rooms_count INT DEFAULT 0;
    DECLARE v_case4_merge_required TINYINT DEFAULT 0;
    DECLARE v_case5_merge_required TINYINT DEFAULT 0;

    -- Use input parameters directly (no SELECT from tables)
    DECLARE v_room_tariff_sum DECIMAL(10,2) DEFAULT 0;
    DECLARE v_adults INT DEFAULT 0;
    DECLARE v_pax INT DEFAULT 0;
    DECLARE v_ex_pax INT DEFAULT 0;
    DECLARE v_ex_pax_charge DECIMAL(10,2) DEFAULT 0;
    DECLARE v_child_paid INT DEFAULT 0;
    DECLARE v_child_unpaid INT DEFAULT 0;
    DECLARE v_child_paid_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_driver INT DEFAULT 0;
    DECLARE v_driver_charge DECIMAL(10,2) DEFAULT 0;
    DECLARE v_discount_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_cgst_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_sgst_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_igst_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_ex_cgst_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_ex_sgst_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_ex_igst_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_child_cgst_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_child_sgst_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_child_igst_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_driver_cgst_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_driver_sgst_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_driver_igst_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_cess_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_service_charge_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_total_nights INT DEFAULT 0;

    DECLARE v_advance_amt DECIMAL(10,2) DEFAULT 0;
    DECLARE v_post_changes_amt DECIMAL(10,2) DEFAULT 0;
    DECLARE v_allowances_amt DECIMAL(10,2) DEFAULT 0;

    DECLARE v_processed_rooms_json JSON;
    DECLARE v_processed_room_ids_json JSON;
    DECLARE v_room_ids_to_update VARCHAR(2000) DEFAULT '';

    DECLARE v_i INT DEFAULT 0;
    DECLARE v_room_value VARCHAR(50);
    DECLARE v_total_computed DECIMAL(10,2) DEFAULT 0;
    DECLARE v_remaining_active INT DEFAULT 0;
    DECLARE v_checkout_id INT;

    DECLARE v_merge_mode TINYINT DEFAULT 0;
    DECLARE v_split_mode TINYINT DEFAULT 0;
    DECLARE v_keeper_checkout_id INT DEFAULT 0;
    DECLARE v_source_checkout_id INT DEFAULT 0;
    DECLARE v_new_checkout_id INT DEFAULT 0;
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_cur_checkout_id INT;
    DECLARE v_merge_triggered TINYINT DEFAULT 0;

    DECLARE v_existing_checkout_id INT DEFAULT 0;
    DECLARE v_is_re_checkout TINYINT DEFAULT 0;
    DECLARE v_existing_ldg_bill_no VARCHAR(50) DEFAULT '';

    DECLARE v_final_payment_method VARCHAR(50);
    DECLARE v_checkout_dt DATETIME;

    DECLARE v_undo_checkin_id INT DEFAULT 0;
    DECLARE v_undo_checkout_id INT DEFAULT 0;
    DECLARE v_undo_ldg_bill_no VARCHAR(50) DEFAULT '';
    DECLARE v_undo_room_count INT DEFAULT 0;
    DECLARE v_undo_remaining_rooms INT DEFAULT 0;
    DECLARE v_undo_rooms_str VARCHAR(2000) DEFAULT '';
    DECLARE v_room_count INT DEFAULT 0;

    -- FIX: LDG BILL NUMBER LOGIC (Section 10 - critical room undo rule)
    DECLARE v_rooms_with_other_bills VARCHAR(2000) DEFAULT '';
    DECLARE v_rooms_to_reactivate VARCHAR(2000) DEFAULT '';

    DECLARE merge_cursor CURSOR FOR
        SELECT DISTINCT cm.checkout_id
        FROM Checkout_Master cm
        INNER JOIN Checkout_Detail cd ON cm.checkout_id = cd.checkout_id
        WHERE cm.checkin_id = p_checkin_id
          AND FIND_IN_SET(cd.room_id, v_all_checked_out_room_ids) > 0
        ORDER BY cm.checkout_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;
        ROLLBACK;
        SELECT JSON_OBJECT(
            'success', FALSE,
            'message', CONCAT('Database Error at: ', COALESCE(v_error_msg, 'Unknown location')),
            'sql_error', @text,
            'sql_state', @sqlstate,
            'errno', @errno,
            'debug', COALESCE(v_debug_msg, 'No debug info')
        ) AS result;
    END;

    START TRANSACTION;

    SET v_checkout_dt = IFNULL(p_checkout_datetime, NOW());
    SET v_now = NOW();
    SET v_user_id = COALESCE(p_user_id, 1);
    SET v_error_msg = 'Starting checkout process';
    SET v_debug_msg = 'Initializing';

    SET v_final_payment_method = COALESCE(p_payment_method, p_payment_mode, 'Cash');
    SET v_debug_msg = CONCAT('Payment resolved: method=', v_final_payment_method);

    -- ============================================================================
    -- ✅ FIX: Only validate checkin exists (no data retrieval)
    -- ============================================================================
    SELECT hotelid INTO v_hotel_id 
    FROM CheckIn_Master 
    WHERE checkin_id = p_checkin_id;
    
    IF v_hotel_id IS NULL THEN
        SELECT JSON_OBJECT('success', FALSE, 'message', 'Check-in record not found') AS result;
        ROLLBACK;
        LEAVE sp_perform_checkout;
    END IF;

    -- ============================================================================
    -- ✅ FIX: Use frontend data directly (no SELECT from checkin_detail_master)
    -- ============================================================================
    
    -- Assign input parameters to local variables
    SET v_room_tariff_sum = COALESCE(p_room_tariff_sum, 0);
    SET v_ex_pax_charge = COALESCE(p_ex_pax_charge, 0);
    SET v_child_paid_amount = COALESCE(p_child_paid_amount, 0);
    SET v_driver_charge = COALESCE(p_driver_charge, 0);
    SET v_discount_amount = COALESCE(p_discount_amount, 0);
    SET v_cgst_amount = COALESCE(p_cgst_amount, 0);
    SET v_sgst_amount = COALESCE(p_sgst_amount, 0);
    SET v_igst_amount = COALESCE(p_igst_amount, 0);
    SET v_ex_cgst_amount = COALESCE(p_ex_cgst_amount, 0);
    SET v_ex_sgst_amount = COALESCE(p_ex_sgst_amount, 0);
    SET v_ex_igst_amount = COALESCE(p_ex_igst_amount, 0);
    SET v_child_cgst_amount = COALESCE(p_child_cgst_amount, 0);
    SET v_child_sgst_amount = COALESCE(p_child_sgst_amount, 0);
    SET v_child_igst_amount = COALESCE(p_child_igst_amount, 0);
    SET v_driver_cgst_amount = COALESCE(p_driver_cgst_amount, 0);
    SET v_driver_sgst_amount = COALESCE(p_driver_sgst_amount, 0);
    SET v_driver_igst_amount = COALESCE(p_driver_igst_amount, 0);
    SET v_cess_amount = COALESCE(p_cess_amount, 0);
    SET v_service_charge_amount = COALESCE(p_service_charge_amount, 0);
    SET v_advance_amt = COALESCE(p_advance_amt, 0);
    SET v_total_nights = COALESCE(p_total_nights, 0);
    SET v_guest_id = COALESCE(p_guest_id, 0);

 -- ============================================================================
-- CASE 7: BILL‑WISE CHECKOUT FOR NON‑LODGING BILLS (Bill No > 1)
-- ============================================================================
IF p_bill_no > 1 THEN
    SET v_error_msg = 'Case 7: Bill-wise checkout for non-lodging bill';
    SET v_debug_msg = CONCAT('Processing bill_no = ', p_bill_no);

    -- 1. Check if this bill has any folio transactions
    SELECT COUNT(*) INTO @folio_count
    FROM checkin_guest_folio_master
    WHERE checkin_id = p_checkin_id AND bill_no = p_bill_no;

    IF @folio_count = 0 THEN
        SELECT JSON_OBJECT('success', FALSE, 'message', CONCAT('No transactions found for bill_no ', p_bill_no)) AS result;
        ROLLBACK;
        LEAVE sp_perform_checkout;
    END IF;

    -- 2. Check if a checkout already exists for this bill (re-checkout)
    SELECT checkout_id, ldg_bill_no INTO v_existing_checkout_id, v_existing_ldg_bill_no
    FROM Checkout_Master
    WHERE checkin_id = p_checkin_id AND bill_no = p_bill_no
    ORDER BY checkout_id DESC LIMIT 1;

    IF v_existing_checkout_id > 0 THEN
        -- Re-checkout: delete existing details and reuse same checkout
        DELETE FROM Checkout_Folio_Master WHERE checkout_id = v_existing_checkout_id;
        DELETE FROM Checkout_Detail      WHERE checkout_id = v_existing_checkout_id; -- none for non-lodging
        DELETE FROM Checkout_Room_Charges WHERE checkout_id = v_existing_checkout_id;
        SET v_checkout_id = v_existing_checkout_id;
        SET v_ldg_bill_no = v_existing_ldg_bill_no;
        SET v_is_re_checkout = 1;
    ELSE
        -- New checkout: generate new invoice number
        SET v_ldg_bill_no = generate_next_invoice_no();
        SET v_is_re_checkout = 0;
    END IF;

    -- 3. Compute totals from folio for this bill
    SELECT 
        COALESCE(SUM(debit_amount - credit_amount), 0) INTO v_total_computed
    FROM checkin_guest_folio_master
    WHERE checkin_id = p_checkin_id AND bill_no = p_bill_no;

    -- Use frontend total if provided, else computed
    IF p_total_amount IS NOT NULL AND p_total_amount > 0 THEN
        SET v_total_computed = p_total_amount;
    END IF;

    -- 3.5 Build room list for this non-lodging bill (from folio, since no Checkout_Detail rows exist)
SELECT COALESCE(JSON_ARRAYAGG(room_number), JSON_ARRAY())
INTO v_processed_rooms_json
FROM (
    SELECT DISTINCT cdm.room_number
    FROM checkin_guest_folio_master cgfm
    INNER JOIN checkin_detail_master cdm
        ON cdm.checkin_id = cgfm.checkin_id AND cdm.room_id = cgfm.room_id
    WHERE cgfm.checkin_id = p_checkin_id
      AND cgfm.bill_no = p_bill_no
      AND cgfm.room_id IS NOT NULL
) d;

SELECT COALESCE(JSON_ARRAYAGG(room_id), JSON_ARRAY())
INTO v_processed_room_ids_json
FROM (
    SELECT DISTINCT room_id
    FROM checkin_guest_folio_master
    WHERE checkin_id = p_checkin_id
      AND bill_no = p_bill_no
      AND room_id IS NOT NULL
) d;

    -- 4. Create or update Checkout_Master
    IF v_is_re_checkout = 0 THEN
      INSERT INTO Checkout_Master (
    checkin_id, guest_id, ldg_bill_no, bill_no, reg_no, booking, plan_name,
    checkin_datetime, room_no, hotelid,
    total_amount, total_nights,
    id_type, id_number, department_id, department_name,
    special_instruction, message,
    checkout_date, checkout_by_id, checkout_reason,
    status, is_partial_checkout,
    checked_out_rooms, room_id,
    payment_method,
    dummy_pax,
    created_by_id, created_date, updated_by_id, updated_date
)
SELECT
    cm.checkin_id, cm.guest_id, v_ldg_bill_no, p_bill_no, cm.reg_no, cm.booking, cm.plan_name,
    cm.checkin_datetime, NULL, cm.hotelid,
    v_total_computed, 0,
    cm.id_type, cm.id_number, cm.department_id, cm.department_name,
    cm.special_instruction, cm.message,
    v_checkout_dt, v_user_id, COALESCE(p_checkout_reason, 'Bill checkout'),
    'checked_out', 0,
    v_processed_rooms_json, v_processed_room_ids_json,
    v_final_payment_method,
    p_dummy_pax,
    cm.created_by_id, cm.created_date, v_user_id, v_now
FROM CheckIn_Master cm
WHERE cm.checkin_id = p_checkin_id;

        SET v_checkout_id = LAST_INSERT_ID();
    ELSE
        -- Update existing checkout master
        UPDATE Checkout_Master
        SET total_amount = v_total_computed,
            checkout_date = v_checkout_dt,
            payment_method = v_final_payment_method,
            dummy_pax = p_dummy_pax,
            updated_by_id = v_user_id,
            updated_date = v_now
        WHERE checkout_id = v_existing_checkout_id;
        SET v_checkout_id = v_existing_checkout_id;
    END IF;

    -- 5. Copy folio transactions for this bill
    INSERT INTO Checkout_Folio_Master (
        checkin_id, checkout_id, hotel_id, detail_id, room_id,
        transaction_type, transaction_datetime,
        description, debit_amount, credit_amount,
        reference_number, payment_method,
        created_by_id, created_date, updated_by_id, updated_date
    )
    SELECT
        cgfm.checkin_id, v_checkout_id, cgfm.hotel_id, cgfm.detail_id, cgfm.room_id,
        cgfm.transaction_type, cgfm.transaction_datetime,
        cgfm.description, cgfm.debit_amount, cgfm.credit_amount,
        cgfm.reference_number,
        COALESCE(v_final_payment_method, cgfm.payment_method, 'Cash'),
        cgfm.created_by_id, cgfm.created_date, v_user_id, v_now
    FROM checkin_guest_folio_master cgfm
    WHERE cgfm.checkin_id = p_checkin_id
      AND cgfm.bill_no = p_bill_no;

    -- 6. No room charges or detail copy for non-lodging bills

    -- 7. Commit and return (with consistent keys)
    COMMIT;

    SELECT JSON_OBJECT(
        'success', TRUE,
        'message', CONCAT('Bill ', p_bill_no, ' checkout completed'),
        'checkout_id', v_checkout_id,
        'checkin_id', p_checkin_id,
        'bill_no', p_bill_no,
        'ldg_bill_no', v_ldg_bill_no,                    -- Changed from 'invoice_no'
        'total_amount', v_total_computed,
        'payment_method', v_final_payment_method,
        'checkout_datetime', v_checkout_dt,
        'is_re_checkout', v_is_re_checkout,
        'case_type', 'Case 7 - Bill-wise Checkout',
        'data', JSON_OBJECT(                              -- Added for consistency
            'checkout_id', v_checkout_id,
            'checkin_id', p_checkin_id,
            'is_partial', 0,
            'ldg_bill_no', v_ldg_bill_no,
            'payment_method', v_final_payment_method,
            'aggregated_values', JSON_OBJECT(
                'advance_amt', 0,
                'post_changes_amt', 0,
                'allowances_amt', 0,
                'discount_amount', 0,
                'cgst_amt', 0,
                'sgst_amt', 0,
                'igst_amt', 0,
                'total_amount', v_total_computed,
                'net_payable', v_total_computed
            )
        )
    ) AS result;
    LEAVE sp_perform_checkout;
END IF;
    -- ============================================================================
    -- CASE 6: UNDO CHECKOUT FOR SPECIFIC ROOMS (Full or Partial Undo)
    -- ============================================================================
    IF p_is_undo = 1 AND p_undo_room_ids IS NOT NULL AND JSON_TYPE(p_undo_room_ids) = 'ARRAY' THEN
        
        SET v_error_msg = 'Case 6: Undo Checkout for Specific Rooms';
        SET v_debug_msg = 'Starting undo checkout process';
        
        SET v_i = 0;
        SET v_undo_rooms_str = '';
        WHILE v_i < JSON_LENGTH(p_undo_room_ids) DO
            SET v_room_value = JSON_UNQUOTE(JSON_EXTRACT(p_undo_room_ids, CONCAT('$[', v_i, ']')));
            IF v_undo_rooms_str = '' THEN
                SET v_undo_rooms_str = v_room_value;
            ELSE
                SET v_undo_rooms_str = CONCAT(v_undo_rooms_str, ',', v_room_value);
            END IF;
            SET v_i = v_i + 1;
        END WHILE;
        
        SET v_debug_msg = CONCAT('Rooms to undo: ', v_undo_rooms_str);
        
        SELECT cm.checkin_id, cm.ldg_bill_no, cm.hotelid 
        INTO v_undo_checkin_id, v_undo_ldg_bill_no, v_hotel_id
        FROM Checkout_Master cm
        WHERE cm.checkout_id = p_checkin_id;
        
        IF v_undo_checkin_id IS NULL THEN
            SELECT JSON_OBJECT('success', FALSE, 'message', 'Checkout record not found for undo') AS result;
            ROLLBACK;
            LEAVE sp_perform_checkout;
        END IF;
        
        SET v_debug_msg = CONCAT('Found checkout: checkout_id=', p_checkin_id, ', checkin_id=', v_undo_checkin_id);
        
        SELECT COUNT(*) INTO v_undo_room_count
        FROM Checkout_Detail cd
        INNER JOIN checkin_detail_master cdm ON cd.room_id = cdm.room_id AND cd.checkin_id = cdm.checkin_id
        WHERE cd.checkout_id = p_checkin_id
          AND FIND_IN_SET(cd.room_id, v_undo_rooms_str) > 0
          AND cdm.is_checkout = 1;
        
        IF v_undo_room_count = 0 THEN
            SELECT JSON_OBJECT('success', FALSE, 'message', 'No valid checked-out rooms found to undo') AS result;
            ROLLBACK;
            LEAVE sp_perform_checkout;
        END IF;
        
        SELECT COUNT(*) INTO v_undo_remaining_rooms
        FROM Checkout_Detail
        WHERE checkout_id = p_checkin_id
          AND NOT FIND_IN_SET(room_id, v_undo_rooms_str) > 0;
        
        SET v_debug_msg = CONCAT('Rooms to undo: ', v_undo_room_count, ', Remaining rooms: ', v_undo_remaining_rooms);

        -- ============================================================================
        -- FIX: LDG BILL NUMBER LOGIC / CRITICAL ROOM UNDO RULE (Section 10)
        -- A room must only be pushed back to "active" (is_checkout = 0,
        -- room_status_id = 1) when NO OTHER Checkout_Detail row (i.e. no other
        -- bill / checkout_id) still exists for that room under this checkin.
        -- Previously every undone room was blindly reactivated even if the
        -- room still had another valid bill (e.g. bill-wise checkout where a
        -- Restaurant or Bar bill for the same room is untouched).
        -- ============================================================================
        SELECT GROUP_CONCAT(DISTINCT cd.room_id)
        INTO v_rooms_with_other_bills
        FROM Checkout_Detail cd
        WHERE cd.checkin_id = v_undo_checkin_id
          AND cd.checkout_id <> p_checkin_id
          AND FIND_IN_SET(cd.room_id, v_undo_rooms_str) > 0;

        SET v_rooms_to_reactivate = v_undo_rooms_str;
        IF v_rooms_with_other_bills IS NOT NULL AND v_rooms_with_other_bills != '' THEN
            SELECT GROUP_CONCAT(DISTINCT room_id)
            INTO v_rooms_to_reactivate
            FROM (
                SELECT DISTINCT room_id
                FROM checkin_detail_master
                WHERE checkin_id = v_undo_checkin_id
                  AND FIND_IN_SET(room_id, v_undo_rooms_str) > 0
                  AND NOT FIND_IN_SET(room_id, v_rooms_with_other_bills) > 0
            ) t;
            SET v_debug_msg = CONCAT(v_debug_msg, ' | Rooms kept checked-out (other bill exists): ', v_rooms_with_other_bills);
        END IF;

        IF v_rooms_to_reactivate IS NOT NULL AND v_rooms_to_reactivate != '' THEN
            UPDATE checkin_detail_master
            SET is_checkout = 0, updated_by_id = v_user_id, updated_date = v_now
            WHERE checkin_id = v_undo_checkin_id
              AND FIND_IN_SET(room_id, v_rooms_to_reactivate) > 0;

            UPDATE room_master
            SET room_status_id = 1, updated_by_id = v_user_id, updated_date = v_now
            WHERE FIND_IN_SET(room_id, v_rooms_to_reactivate) > 0;
        END IF;
        
        DELETE FROM Checkout_Folio_Master 
        WHERE checkout_id = p_checkin_id 
          AND FIND_IN_SET(room_id, v_undo_rooms_str) > 0;
        
        DELETE FROM Checkout_Room_Charges 
        WHERE checkout_id = p_checkin_id 
          AND FIND_IN_SET(room_id, v_undo_rooms_str) > 0;
        
        DELETE FROM Checkout_Detail 
        WHERE checkout_id = p_checkin_id 
          AND FIND_IN_SET(room_id, v_undo_rooms_str) > 0;
        
        -- Full Undo (no rooms remain)
        IF v_undo_remaining_rooms = 0 THEN
            DELETE FROM Checkout_Master WHERE checkout_id = p_checkin_id;
            
            UPDATE CheckIn_Master
            SET status = 'checked_in', updated_by_id = v_user_id, updated_date = v_now
            WHERE checkin_id = v_undo_checkin_id;
            
            COMMIT;
            
            SELECT JSON_OBJECT(
                'success', TRUE,
                'message', 'Full undo completed. All rooms undone from checkout.',
                'checkin_id', v_undo_checkin_id,
                'checkout_id', p_checkin_id,
                'is_partial', 0,
                'ldg_bill_no', v_undo_ldg_bill_no,
                'case_type', 'Case 6 - Full Undo',
                'rooms_undone', v_undo_rooms_str,
                'rooms_remaining', 0,
                'new_status', 'checked_in',
                'debug_info', v_debug_msg
            ) AS result;
            LEAVE sp_perform_checkout;
            
        -- Partial Undo (some rooms remain)
        ELSE
            -- Recalculate remaining totals
            SELECT
                COALESCE(SUM(room_tariff), 0),
                COALESCE(SUM(ex_pax_charge), 0),
                COALESCE(SUM(child_paid_amount), 0),
                COALESCE(SUM(driver_charge), 0),
                COALESCE(SUM(discount_amount), 0),
                COALESCE(SUM(cgst_amount), 0),
                COALESCE(SUM(sgst_amount), 0),
                COALESCE(SUM(igst_amount), 0),
                COALESCE(SUM(ex_cgst_amount), 0),
                COALESCE(SUM(ex_sgst_amount), 0),
                COALESCE(SUM(ex_igst_amount), 0),
                COALESCE(SUM(child_cgst_amount), 0),
                COALESCE(SUM(child_sgst_amount), 0),
                COALESCE(SUM(child_igst_amount), 0),
                COALESCE(SUM(driver_cgst_amount), 0),
                COALESCE(SUM(driver_sgst_amount), 0),
                COALESCE(SUM(driver_igst_amount), 0),
                COALESCE(SUM(cess_amount), 0),
                COALESCE(SUM(service_charge_amount), 0),
                COALESCE(MAX(no_of_days), 0)
            INTO
                v_room_tariff_sum,
                v_ex_pax_charge,
                v_child_paid_amount,
                v_driver_charge,
                v_discount_amount,
                v_cgst_amount,
                v_sgst_amount,
                v_igst_amount,
                v_ex_cgst_amount,
                v_ex_sgst_amount,
                v_ex_igst_amount,
                v_child_cgst_amount,
                v_child_sgst_amount,
                v_child_igst_amount,
                v_driver_cgst_amount,
                v_driver_sgst_amount,
                v_driver_igst_amount,
                v_cess_amount,
                v_service_charge_amount,
                v_total_nights
            FROM Checkout_Detail
            WHERE checkout_id = p_checkin_id;

            IF p_total_nights IS NOT NULL THEN
                SET v_total_nights = p_total_nights;
            END IF;
            
            SELECT COALESCE(JSON_ARRAYAGG(room_number), JSON_ARRAY())
            INTO v_processed_rooms_json
            FROM (SELECT DISTINCT room_number FROM Checkout_Detail WHERE checkout_id = p_checkin_id) d;
            
            SELECT COALESCE(JSON_ARRAYAGG(room_id), JSON_ARRAY())
            INTO v_processed_room_ids_json
            FROM (SELECT DISTINCT room_id FROM Checkout_Detail WHERE checkout_id = p_checkin_id) d;
            
            SET v_total_computed = v_room_tariff_sum + v_ex_pax_charge + v_child_paid_amount + v_driver_charge
                                + v_cgst_amount + v_sgst_amount + v_igst_amount
                                + v_ex_cgst_amount + v_ex_sgst_amount + v_ex_igst_amount
                                + v_child_cgst_amount + v_child_sgst_amount + v_child_igst_amount
                                + v_driver_cgst_amount + v_driver_sgst_amount + v_driver_igst_amount
                                + v_cess_amount + v_service_charge_amount
                                - v_discount_amount;
            
            UPDATE Checkout_Master
            SET
                tot_room_tariff = v_room_tariff_sum,
                tot_ex_pax_charge = v_ex_pax_charge,
                tot_child_paid_amount = v_child_paid_amount,
                tot_driver_charge = v_driver_charge,
                tot_discount_amount = v_discount_amount,
                tot_cgst_amount = v_cgst_amount,
                tot_sgst_amount = v_sgst_amount,
                tot_igst_amount = v_igst_amount,
                tot_ex_cgst_amount = v_ex_cgst_amount,
                tot_ex_sgst_amount = v_ex_sgst_amount,
                tot_ex_igst_amount = v_ex_igst_amount,
                tot_child_cgst_amount = v_child_cgst_amount,
                tot_child_sgst_amount = v_child_sgst_amount,
                tot_child_igst_amount = v_child_igst_amount,
                tot_driver_cgst_amount = v_driver_cgst_amount,
                tot_driver_sgst_amount = v_driver_sgst_amount,
                tot_driver_igst_amount = v_driver_igst_amount,
                tot_service_charge_amount = v_service_charge_amount,
                tot_cess_amount = v_cess_amount,
                tot_advance = v_advance_amt,
                total_amount = v_total_computed,
                total_nights = v_total_nights,
                checked_out_rooms = v_processed_rooms_json,
                room_id = v_processed_room_ids_json,
                is_partial_checkout = 1,
                dummy_pax = p_dummy_pax,  
                updated_by_id = v_user_id,
                updated_date = v_now
            WHERE checkout_id = p_checkin_id;
            
            UPDATE CheckIn_Master
            SET status = 'partial_checkout', 
                updated_by_id = v_user_id, 
                updated_date = v_now
            WHERE checkin_id = v_undo_checkin_id;
            
            COMMIT;
            
            SELECT JSON_OBJECT(
                'success', TRUE,
                'message', CONCAT('Partial undo completed. ', v_undo_room_count, ' rooms undone, ', v_undo_remaining_rooms, ' rooms remain.'),
                'checkin_id', v_undo_checkin_id,
                'checkout_id', p_checkin_id,
                'is_partial', 1,
                'ldg_bill_no', v_undo_ldg_bill_no,
                'case_type', 'Case 6 - Partial Undo',
                'rooms_undone', v_undo_rooms_str,
                'rooms_remaining', v_undo_remaining_rooms,
                'remaining_rooms_json', v_processed_rooms_json,
                'remaining_room_ids_json', v_processed_room_ids_json,
                'new_total', v_total_computed,
                'new_status', 'partial_checkout',
                'debug_info', v_debug_msg
            ) AS result;
            LEAVE sp_perform_checkout;
        END IF;
    END IF;

    -- 2. Parse selected rooms JSON
    IF p_selected_rooms IS NOT NULL AND JSON_TYPE(p_selected_rooms) = 'ARRAY' THEN
        SET v_i = 0;
        WHILE v_i < JSON_LENGTH(p_selected_rooms) DO
            SET v_room_value = JSON_UNQUOTE(JSON_EXTRACT(p_selected_rooms, CONCAT('$[', v_i, ']')));
            IF v_selected_rooms_str = '' THEN
                SET v_selected_rooms_str = v_room_value;
            ELSE
                SET v_selected_rooms_str = CONCAT(v_selected_rooms_str, ',', v_room_value);
            END IF;
            SET v_i = v_i + 1;
        END WHILE;
    END IF;

    -- 3. Get room IDs for all selected rooms (only need room_ids)
    IF v_selected_rooms_str != '' THEN
        SELECT GROUP_CONCAT(DISTINCT room_id)
        INTO v_selected_room_ids_all
        FROM checkin_detail_master
        WHERE checkin_id = p_checkin_id
          AND FIND_IN_SET(room_number COLLATE utf8mb4_general_ci, v_selected_rooms_str) > 0;
    END IF;

    IF v_selected_room_ids_all IS NULL OR v_selected_room_ids_all = '' THEN
        SELECT JSON_OBJECT('success', FALSE, 'message', 'No valid rooms selected.') AS result;
        ROLLBACK;
        LEAVE sp_perform_checkout;
    END IF;

    -- 4. Get counts for Case 4 & 5 detection
    SELECT COUNT(*) INTO v_total_rooms_in_checkin
    FROM checkin_detail_master
    WHERE checkin_id = p_checkin_id;

    SELECT COUNT(*) INTO v_selected_rooms_count
    FROM checkin_detail_master
    WHERE checkin_id = p_checkin_id
      AND FIND_IN_SET(room_id, v_selected_room_ids_all) > 0;

    SELECT COUNT(*) INTO v_checkout_master_count
    FROM Checkout_Master
    WHERE checkin_id = p_checkin_id;

    -- 5. Get active and checked-out rooms from selection
    SELECT GROUP_CONCAT(DISTINCT room_id)
    INTO v_selected_active_room_ids
    FROM checkin_detail_master
    WHERE checkin_id = p_checkin_id
      AND is_checkout = 0
      AND FIND_IN_SET(room_id, v_selected_room_ids_all) > 0;

    SELECT GROUP_CONCAT(DISTINCT room_id)
    INTO v_checked_out_selected_room_ids
    FROM checkin_detail_master
    WHERE checkin_id = p_checkin_id
      AND is_checkout = 1
      AND FIND_IN_SET(room_id, v_selected_room_ids_all) > 0;

    -- 6. Get active room count
    SELECT COUNT(*) INTO v_active_room_count
    FROM checkin_detail_master
    WHERE checkin_id = p_checkin_id AND is_checkout = 0;

    -- ============================================================================
    -- CASE 4: Merge Before Checkout (active rooms exist + multiple masters + all rooms selected)
    -- ============================================================================
    IF v_active_room_count > 0 
       AND v_checkout_master_count > 1 
       AND v_selected_rooms_count = v_total_rooms_in_checkin THEN
        
        SET v_case4_merge_required = 1;
        SET v_debug_msg = CONCAT('Case 4 detected: Active Rooms=', v_active_room_count, 
                                 ', Checkout Masters=', v_checkout_master_count,
                                 ', Selected Rooms=', v_selected_rooms_count,
                                 ', Total Rooms=', v_total_rooms_in_checkin);
        
        IF v_selected_active_room_ids IS NOT NULL AND v_selected_active_room_ids != '' THEN
            SET v_active_room_ids = v_selected_active_room_ids;
            SET v_room_ids_to_update = v_selected_active_room_ids;
            
            UPDATE checkin_detail_master
            SET is_checkout = 1, updated_by_id = v_user_id, updated_date = v_now
            WHERE checkin_id = p_checkin_id
              AND FIND_IN_SET(room_id, v_active_room_ids) > 0;
            
            -- FIX: LDG BILL NUMBER LOGIC — keeper's existing ldg_bill_no is reused,
            -- generate_next_invoice_no() is never called in Case 4.
            SELECT checkout_id, ldg_bill_no 
            INTO v_keeper_checkout_id, v_ldg_bill_no
            FROM Checkout_Master
            WHERE checkin_id = p_checkin_id
            ORDER BY checkout_id ASC
            LIMIT 1;
            
            SELECT GROUP_CONCAT(DISTINCT checkout_id) 
            INTO @other_checkout_ids
            FROM Checkout_Master
            WHERE checkin_id = p_checkin_id
              AND checkout_id != v_keeper_checkout_id;
            
            SET v_debug_msg = CONCAT('Case 4 - Keeper: ', v_keeper_checkout_id, 
                                     ', Sources: ', IFNULL(@other_checkout_ids, 'None'));
            
            -- Insert newly checked out rooms using frontend data
            INSERT INTO Checkout_Detail (
                checkin_id, checkout_id, hotelid, room_id, room_number,
                room_category_id, room_category_name,
                converted_category_id, converted_category_name,
                guest_id, guest_name, address, mobile,
                company_id, company_name, emailed,
                checkin_datetime, checkout_datetime, no_of_days,
                adults, pax, ex_pax,
                child_paid, child_unpaid, driver,
                room_tariff,
                ex_pax_charge, child_paid_amount, driver_charge,
                discount_percent, discount_amount,
                tax_percen_room,
                cgst_percent, cgst_amount,
                sgst_percent, sgst_amount,
                igst_percent, igst_amount,
                tax_percen_ex,
                ex_cgst_percent, ex_cgst_amount,
                ex_sgst_percent, ex_sgst_amount,
                ex_igst_percent, ex_igst_amount,
                tax_percen_child,
                child_cgst_percent, child_cgst_amount,
                child_sgst_percent, child_sgst_amount,
                child_igst_percent, child_igst_amount,
                tax_percen_driver,
                driver_cgst_percent, driver_cgst_amount,
                driver_sgst_percent, driver_sgst_amount,
                driver_igst_percent, driver_igst_amount,
                service_charge, service_charge_amount,
                cess_percent, cess_amount,
                parent_detail_id,
                is_checkout,
                merged,
                is_settle,
                tax,
                created_date, updated_date,
                created_by_id, updated_by_id
            )
            SELECT
                p_checkin_id, v_keeper_checkout_id, v_hotel_id, 
                cdm.room_id, cdm.room_number,
                cdm.room_category_id, cdm.room_category_name,
                cdm.converted_category_id, cdm.converted_category_name,
                v_guest_id, p_guest_name, p_address, p_mobile,
                p_company_id, p_company_name, cdm.emailed,
                cdm.checkin_datetime, v_checkout_dt, v_total_nights,
                cdm.adults, cdm.pax, cdm.ex_pax,
                cdm.child_paid, cdm.child_unpaid, cdm.driver,
                cdm.room_tariff,
                cdm.ex_pax_charge, cdm.child_paid_amount, cdm.driver_charge,
                cdm.discount_percent, v_discount_amount,
                cdm.tax_percen_room,
                cdm.cgst_percent, v_cgst_amount,
                cdm.sgst_percent, v_sgst_amount,
                cdm.igst_percent, v_igst_amount,
                cdm.tax_percen_ex,
                cdm.ex_cgst_percent, v_ex_cgst_amount,
                cdm.ex_sgst_percent, v_ex_sgst_amount,
                cdm.ex_igst_percent, v_ex_igst_amount,
                cdm.tax_percen_child,
                cdm.child_cgst_percent, v_child_cgst_amount,
                cdm.child_sgst_percent, v_child_sgst_amount,
                cdm.child_igst_percent, v_child_igst_amount,
                cdm.tax_percen_driver,
                cdm.driver_cgst_percent, v_driver_cgst_amount,
                cdm.driver_sgst_percent, v_driver_sgst_amount,
                cdm.driver_igst_percent, v_driver_igst_amount,
                cdm.service_charge, v_service_charge_amount,
                cdm.cess_percent, v_cess_amount,
                cdm.parent_detail_id,
                1, cdm.merged, cdm.is_settle, cdm.tax,
                cdm.created_date, v_now, cdm.created_by_id, v_user_id
            FROM checkin_detail_master cdm
            WHERE cdm.checkin_id = p_checkin_id
              AND FIND_IN_SET(cdm.room_id, v_active_room_ids) > 0;
            
            -- Move data from other checkouts
            IF @other_checkout_ids IS NOT NULL AND @other_checkout_ids != '' THEN
                
                INSERT INTO Checkout_Detail (
                    checkin_id, checkout_id, hotelid, room_id, room_number,
                    room_category_id, room_category_name,
                    converted_category_id, converted_category_name,
                    guest_id, guest_name, address, mobile,
                    company_id, company_name, emailed,
                    checkin_datetime, checkout_datetime, no_of_days,
                    adults, pax, ex_pax,
                    child_paid, child_unpaid, driver,
                    room_tariff,
                    ex_pax_charge, child_paid_amount, driver_charge,
                    discount_percent, discount_amount,
                    tax_percen_room,
                    cgst_percent, cgst_amount,
                    sgst_percent, sgst_amount,
                    igst_percent, igst_amount,
                    tax_percen_ex,
                    ex_cgst_percent, ex_cgst_amount,
                    ex_sgst_percent, ex_sgst_amount,
                    ex_igst_percent, ex_igst_amount,
                    tax_percen_child,
                    child_cgst_percent, child_cgst_amount,
                    child_sgst_percent, child_sgst_amount,
                    child_igst_percent, child_igst_amount,
                    tax_percen_driver,
                    driver_cgst_percent, driver_cgst_amount,
                    driver_sgst_percent, driver_sgst_amount,
                    driver_igst_percent, driver_igst_amount,
                    service_charge, service_charge_amount,
                    cess_percent, cess_amount,
                    parent_detail_id,
                    is_checkout,
                    merged,
                    is_settle,
                    tax,
                    created_date, updated_date,
                    created_by_id, updated_by_id
                )
                SELECT
                    checkin_id, v_keeper_checkout_id, hotelid, room_id, room_number,
                    room_category_id, room_category_name,
                    converted_category_id, converted_category_name,
                    guest_id, guest_name, address, mobile,
                    company_id, company_name, emailed,
                    checkin_datetime, v_checkout_dt, no_of_days,
                    adults, pax, ex_pax,
                    child_paid, child_unpaid, driver,
                    room_tariff,
                    ex_pax_charge, child_paid_amount, driver_charge,
                    discount_percent, discount_amount,
                    tax_percen_room,
                    cgst_percent, cgst_amount,
                    sgst_percent, sgst_amount,
                    igst_percent, igst_amount,
                    tax_percen_ex,
                    ex_cgst_percent, ex_cgst_amount,
                    ex_sgst_percent, ex_sgst_amount,
                    ex_igst_percent, ex_igst_amount,
                    tax_percen_child,
                    child_cgst_percent, child_cgst_amount,
                    child_sgst_percent, child_sgst_amount,
                    child_igst_percent, child_igst_amount,
                    tax_percen_driver,
                    driver_cgst_percent, driver_cgst_amount,
                    driver_sgst_percent, driver_sgst_amount,
                    driver_igst_percent, driver_igst_amount,
                    service_charge, service_charge_amount,
                    cess_percent, cess_amount,
                    parent_detail_id,
                    1, merged, is_settle, tax,
                    created_date, v_now, created_by_id, v_user_id
                FROM Checkout_Detail
                WHERE FIND_IN_SET(checkout_id, @other_checkout_ids) > 0;
                
                INSERT INTO Checkout_Room_Charges (
                    checkin_id, checkout_id, guest_id, room_id, category_id,
                    pax_count, pax_price, pax_tax,
                    ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
                    child_count, child_price, child_tax, child_tax_percent, child_total,
                    driver_count, driver_price, driver_tax, driver_tax_percent, driver_total,
                    total_amount, checkin_datetime, checkout_datetime,
                    created_at, updated_at
                )
                SELECT
                    checkin_id, v_keeper_checkout_id, guest_id, room_id, category_id,
                    pax_count, pax_price, pax_tax,
                    ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
                    child_count, child_price, child_tax, child_tax_percent, child_total,
                    driver_count, driver_price, driver_tax, driver_tax_percent, driver_total,
                    total_amount, checkin_datetime, v_checkout_dt,
                    NOW(), NOW()
                FROM Checkout_Room_Charges
                WHERE FIND_IN_SET(checkout_id, @other_checkout_ids) > 0;
            END IF;
            
            -- Delete source checkouts
            IF @other_checkout_ids IS NOT NULL AND @other_checkout_ids != '' THEN
                
                SET @delete_query = CONCAT('DELETE FROM Checkout_Folio_Master WHERE checkout_id IN (', @other_checkout_ids, ')');
                PREPARE stmt FROM @delete_query;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                
                SET @delete_query = CONCAT('DELETE FROM Checkout_Room_Charges WHERE checkout_id IN (', @other_checkout_ids, ')');
                PREPARE stmt FROM @delete_query;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                
                SET @delete_query = CONCAT('DELETE FROM Checkout_Detail WHERE checkout_id IN (', @other_checkout_ids, ')');
                PREPARE stmt FROM @delete_query;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                
                SET @delete_query = CONCAT('DELETE FROM Checkout_Master WHERE checkout_id IN (', @other_checkout_ids, ')');
                PREPARE stmt FROM @delete_query;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            END IF;
            
            -- Rebuild folio records using frontend data
            DELETE FROM Checkout_Folio_Master WHERE checkout_id = v_keeper_checkout_id;
            
            -- Insert folio records from frontend data (p_folio_data parameter needed)
            -- OR use existing folio data from checkin_guest_folio_master
            INSERT INTO Checkout_Folio_Master (
                checkin_id, checkout_id, hotel_id, detail_id, room_id,
                transaction_type, transaction_datetime,
                description, debit_amount, credit_amount,
                reference_number, payment_method,
                created_by_id, created_date, updated_by_id, updated_date
            )
            SELECT
                cgfm.checkin_id,
                v_keeper_checkout_id,
                cgfm.hotel_id,
                cgfm.detail_id,
                cgfm.room_id,
                cgfm.transaction_type,
                cgfm.transaction_datetime,
                cgfm.description,
                cgfm.debit_amount,
                cgfm.credit_amount,
                cgfm.reference_number,
                COALESCE(v_final_payment_method, cgfm.payment_method, 'Cash') AS payment_method,
                cgfm.created_by_id,
                cgfm.created_date,
                v_user_id,
                v_now
            FROM checkin_guest_folio_master cgfm
            WHERE cgfm.checkin_id = p_checkin_id;
             
             

            -- Use frontend totals (already set from input parameters)
            -- v_room_tariff_sum, v_ex_pax_charge, etc. are already set
            
            SELECT COALESCE(JSON_ARRAYAGG(room_number), JSON_ARRAY())
            INTO v_processed_rooms_json
            FROM (SELECT DISTINCT room_number FROM Checkout_Detail WHERE checkout_id = v_keeper_checkout_id) d;
            
            SELECT COALESCE(JSON_ARRAYAGG(room_id), JSON_ARRAY())
            INTO v_processed_room_ids_json
            FROM (SELECT DISTINCT room_id FROM Checkout_Detail WHERE checkout_id = v_keeper_checkout_id) d;
            
            SET v_total_computed = COALESCE(p_total_amount, 
                v_room_tariff_sum + v_ex_pax_charge + v_child_paid_amount + v_driver_charge
                + v_cgst_amount + v_sgst_amount + v_igst_amount
                + v_ex_cgst_amount + v_ex_sgst_amount + v_ex_igst_amount
                + v_child_cgst_amount + v_child_sgst_amount + v_child_igst_amount
                + v_driver_cgst_amount + v_driver_sgst_amount + v_driver_igst_amount
                + v_cess_amount + v_service_charge_amount
                - v_discount_amount
            );
            
            UPDATE Checkout_Master
            SET
                tot_room_tariff = v_room_tariff_sum,
                tot_ex_pax_charge = v_ex_pax_charge,
                tot_child_paid_amount = v_child_paid_amount,
                tot_driver_charge = v_driver_charge,
                tot_discount_amount = v_discount_amount,
                tot_cgst_amount = v_cgst_amount,
                tot_sgst_amount = v_sgst_amount,
                tot_igst_amount = v_igst_amount,
                tot_ex_cgst_amount = v_ex_cgst_amount,
                tot_ex_sgst_amount = v_ex_sgst_amount,
                tot_ex_igst_amount = v_ex_igst_amount,
                tot_child_cgst_amount = v_child_cgst_amount,
                tot_child_sgst_amount = v_child_sgst_amount,
                tot_child_igst_amount = v_child_igst_amount,
                tot_driver_cgst_amount = v_driver_cgst_amount,
                tot_driver_sgst_amount = v_driver_sgst_amount,
                tot_driver_igst_amount = v_driver_igst_amount,
                tot_service_charge_amount = v_service_charge_amount,
                tot_cess_amount = v_cess_amount,
                tot_advance = v_advance_amt,
                total_amount = v_total_computed,
                total_nights = v_total_nights,
                checked_out_rooms = v_processed_rooms_json,
                room_id = v_processed_room_ids_json,
                payment_method = v_final_payment_method,
                updated_by_id = v_user_id,
                updated_date = v_now,
                checkout_date = v_checkout_dt,
                is_partial_checkout = 0,
                dummy_pax = p_dummy_pax,  
                status = 'checked_out'
            WHERE checkout_id = v_keeper_checkout_id;
            
            UPDATE CheckIn_Master
            SET status = 'checked_out', updated_by_id = v_user_id, updated_date = v_now
            WHERE checkin_id = p_checkin_id;
            
            IF v_room_ids_to_update IS NOT NULL AND v_room_ids_to_update != '' THEN
                UPDATE room_master
                SET room_status_id = 7, updated_by_id = v_user_id, updated_date = v_now
                WHERE FIND_IN_SET(room_id, v_room_ids_to_update);
            END IF;
            
            COMMIT;
            
            SELECT JSON_OBJECT(
                'success', TRUE,
                'message', CONCAT('Case 4: All rooms merged into one bill. Deleted checkout IDs: ', IFNULL(@other_checkout_ids, 'None')),
                'checkout_id', v_keeper_checkout_id,
                'checkin_id', p_checkin_id,
                'is_partial', 0,
                'ldg_bill_no', v_ldg_bill_no,
                'payment_method', v_final_payment_method,
                'checkout_datetime', v_checkout_dt,
                'checked_out_rooms', v_processed_rooms_json,
                'checked_out_room_ids', v_processed_room_ids_json,
                'merge_performed', 1,
                'case_type', 'Case 4 - Merge Before Checkout',
                'deleted_checkout_ids', IFNULL(@other_checkout_ids, 'None'),
                'folio_records_copied', (SELECT COUNT(*) FROM Checkout_Folio_Master WHERE checkout_id = v_keeper_checkout_id),
                'debug_info', v_debug_msg
            ) AS result;
            LEAVE sp_perform_checkout;
        END IF;
    END IF;

    -- ============================================================================
    -- CASE 5: Merge After Full Checkout (no active rooms + multiple masters + all rooms selected)
    -- ============================================================================
    IF v_active_room_count = 0 
       AND v_checkout_master_count > 1 
       AND v_selected_rooms_count = v_total_rooms_in_checkin THEN
        
        SET v_case5_merge_required = 1;
        SET v_debug_msg = CONCAT('Case 5 detected: All rooms already checked out. Merging all bills.');
        
        -- FIX: LDG BILL NUMBER LOGIC — keeper's existing ldg_bill_no is reused,
        -- generate_next_invoice_no() is never called in Case 5.
        SELECT checkout_id, ldg_bill_no 
        INTO v_keeper_checkout_id, v_ldg_bill_no
        FROM Checkout_Master
        WHERE checkin_id = p_checkin_id
        ORDER BY checkout_id ASC
        LIMIT 1;
        
        SELECT GROUP_CONCAT(DISTINCT checkout_id) 
        INTO @other_checkout_ids
        FROM Checkout_Master
        WHERE checkin_id = p_checkin_id
          AND checkout_id != v_keeper_checkout_id;
        
        SET v_debug_msg = CONCAT('Case 5 - Keeper: ', v_keeper_checkout_id, 
                                 ', Sources: ', IFNULL(@other_checkout_ids, 'None'));
        
        -- Move data from other checkouts
        IF @other_checkout_ids IS NOT NULL AND @other_checkout_ids != '' THEN
            
            INSERT INTO Checkout_Detail (
                checkin_id, checkout_id, hotelid, room_id, room_number,
                room_category_id, room_category_name,
                converted_category_id, converted_category_name,
                guest_id, guest_name, address, mobile,
                company_id, company_name, emailed,
                checkin_datetime, checkout_datetime, no_of_days,
                adults, pax, ex_pax,
                child_paid, child_unpaid, driver,
                room_tariff,
                ex_pax_charge, child_paid_amount, driver_charge,
                discount_percent, discount_amount,
                tax_percen_room,
                cgst_percent, cgst_amount,
                sgst_percent, sgst_amount,
                igst_percent, igst_amount,
                tax_percen_ex,
                ex_cgst_percent, ex_cgst_amount,
                ex_sgst_percent, ex_sgst_amount,
                ex_igst_percent, ex_igst_amount,
                tax_percen_child,
                child_cgst_percent, child_cgst_amount,
                child_sgst_percent, child_sgst_amount,
                child_igst_percent, child_igst_amount,
                tax_percen_driver,
                driver_cgst_percent, driver_cgst_amount,
                driver_sgst_percent, driver_sgst_amount,
                driver_igst_percent, driver_igst_amount,
                service_charge, service_charge_amount,
                cess_percent, cess_amount,
                parent_detail_id,
                is_checkout,
                merged,
                is_settle,
                tax,
                created_date, updated_date,
                created_by_id, updated_by_id
            )
            SELECT
                checkin_id, v_keeper_checkout_id, hotelid, room_id, room_number,
                room_category_id, room_category_name,
                converted_category_id, converted_category_name,
                guest_id, guest_name, address, mobile,
                company_id, company_name, emailed,
                checkin_datetime, v_checkout_dt, no_of_days,
                adults, pax, ex_pax,
                child_paid, child_unpaid, driver,
                room_tariff,
                ex_pax_charge, child_paid_amount, driver_charge,
                discount_percent, discount_amount,
                tax_percen_room,
                cgst_percent, cgst_amount,
                sgst_percent, sgst_amount,
                igst_percent, igst_amount,
                tax_percen_ex,
                ex_cgst_percent, ex_cgst_amount,
                ex_sgst_percent, ex_sgst_amount,
                ex_igst_percent, ex_igst_amount,
                tax_percen_child,
                child_cgst_percent, child_cgst_amount,
                child_sgst_percent, child_sgst_amount,
                child_igst_percent, child_igst_amount,
                tax_percen_driver,
                driver_cgst_percent, driver_cgst_amount,
                driver_sgst_percent, driver_sgst_amount,
                driver_igst_percent, driver_igst_amount,
                service_charge, service_charge_amount,
                cess_percent, cess_amount,
                parent_detail_id,
                1, merged, is_settle, tax,
                created_date, v_now, created_by_id, v_user_id
            FROM Checkout_Detail
            WHERE FIND_IN_SET(checkout_id, @other_checkout_ids) > 0;
            
            INSERT INTO Checkout_Room_Charges (
                checkin_id, checkout_id, guest_id, room_id, category_id,
                pax_count, pax_price, pax_tax,
                ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
                child_count, child_price, child_tax, child_tax_percent, child_total,
                driver_count, driver_price, driver_tax, driver_tax_percent, driver_total,
                total_amount, checkin_datetime, checkout_datetime,
                created_at, updated_at
            )
            SELECT
                checkin_id, v_keeper_checkout_id, guest_id, room_id, category_id,
                pax_count, pax_price, pax_tax,
                ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
                child_count, child_price, child_tax, child_tax_percent, child_total,
                driver_count, driver_price, driver_tax, driver_tax_percent, driver_total,
                total_amount, checkin_datetime, v_checkout_dt,
                NOW(), NOW()
            FROM Checkout_Room_Charges
            WHERE FIND_IN_SET(checkout_id, @other_checkout_ids) > 0;
        END IF;
        
        -- Delete source checkouts
        IF @other_checkout_ids IS NOT NULL AND @other_checkout_ids != '' THEN
            
            SET @delete_query = CONCAT('DELETE FROM Checkout_Folio_Master WHERE checkout_id IN (', @other_checkout_ids, ')');
            PREPARE stmt FROM @delete_query;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            
            SET @delete_query = CONCAT('DELETE FROM Checkout_Room_Charges WHERE checkout_id IN (', @other_checkout_ids, ')');
            PREPARE stmt FROM @delete_query;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            
            SET @delete_query = CONCAT('DELETE FROM Checkout_Detail WHERE checkout_id IN (', @other_checkout_ids, ')');
            PREPARE stmt FROM @delete_query;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            
            SET @delete_query = CONCAT('DELETE FROM Checkout_Master WHERE checkout_id IN (', @other_checkout_ids, ')');
            PREPARE stmt FROM @delete_query;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        END IF;
        
        -- Rebuild folio records
        DELETE FROM Checkout_Folio_Master WHERE checkout_id = v_keeper_checkout_id;
        
        INSERT INTO Checkout_Folio_Master (
            checkin_id, checkout_id, hotel_id, detail_id, room_id,
            transaction_type, transaction_datetime,
            description, debit_amount, credit_amount,
            reference_number, payment_method,
            created_by_id, created_date, updated_by_id, updated_date
        )
        SELECT
            cgfm.checkin_id,
            v_keeper_checkout_id,
            cgfm.hotel_id,
            cgfm.detail_id,
            cgfm.room_id,
            cgfm.transaction_type,
            cgfm.transaction_datetime,
            cgfm.description,
            cgfm.debit_amount,
            cgfm.credit_amount,
            cgfm.reference_number,
            COALESCE(v_final_payment_method, cgfm.payment_method, 'Cash') AS payment_method,
            cgfm.created_by_id,
            cgfm.created_date,
            v_user_id,
            v_now
        FROM checkin_guest_folio_master cgfm
        WHERE cgfm.checkin_id = p_checkin_id;
         
        
        -- Use frontend totals
        SELECT COALESCE(JSON_ARRAYAGG(room_number), JSON_ARRAY())
        INTO v_processed_rooms_json
        FROM (SELECT DISTINCT room_number FROM Checkout_Detail WHERE checkout_id = v_keeper_checkout_id) d;
        
        SELECT COALESCE(JSON_ARRAYAGG(room_id), JSON_ARRAY())
        INTO v_processed_room_ids_json
        FROM (SELECT DISTINCT room_id FROM Checkout_Detail WHERE checkout_id = v_keeper_checkout_id) d;
        
        SET v_total_computed = COALESCE(p_total_amount, 
            v_room_tariff_sum + v_ex_pax_charge + v_child_paid_amount + v_driver_charge
            + v_cgst_amount + v_sgst_amount + v_igst_amount
            + v_ex_cgst_amount + v_ex_sgst_amount + v_ex_igst_amount
            + v_child_cgst_amount + v_child_sgst_amount + v_child_igst_amount
            + v_driver_cgst_amount + v_driver_sgst_amount + v_driver_igst_amount
            + v_cess_amount + v_service_charge_amount
            - v_discount_amount
        );
        
        UPDATE Checkout_Master
        SET
            tot_room_tariff = v_room_tariff_sum,
            tot_ex_pax_charge = v_ex_pax_charge,
            tot_child_paid_amount = v_child_paid_amount,
            tot_driver_charge = v_driver_charge,
            tot_discount_amount = v_discount_amount,
            tot_cgst_amount = v_cgst_amount,
            tot_sgst_amount = v_sgst_amount,
            tot_igst_amount = v_igst_amount,
            tot_ex_cgst_amount = v_ex_cgst_amount,
            tot_ex_sgst_amount = v_ex_sgst_amount,
            tot_ex_igst_amount = v_ex_igst_amount,
            tot_child_cgst_amount = v_child_cgst_amount,
            tot_child_sgst_amount = v_child_sgst_amount,
            tot_child_igst_amount = v_child_igst_amount,
            tot_driver_cgst_amount = v_driver_cgst_amount,
            tot_driver_sgst_amount = v_driver_sgst_amount,
            tot_driver_igst_amount = v_driver_igst_amount,
            tot_service_charge_amount = v_service_charge_amount,
            tot_cess_amount = v_cess_amount,
            tot_advance = v_advance_amt,
            total_amount = v_total_computed,
            total_nights = v_total_nights,
            checked_out_rooms = v_processed_rooms_json,
            room_id = v_processed_room_ids_json,
            payment_method = v_final_payment_method,
            updated_by_id = v_user_id,
            updated_date = v_now,
            checkout_date = v_checkout_dt,
            is_partial_checkout = 0,
            dummy_pax = p_dummy_pax,  
            status = 'checked_out'
        WHERE checkout_id = v_keeper_checkout_id;
        
        UPDATE CheckIn_Master
        SET status = 'checked_out', updated_by_id = v_user_id, updated_date = v_now
        WHERE checkin_id = p_checkin_id;
        
        IF v_room_ids_to_update IS NOT NULL AND v_room_ids_to_update != '' THEN
            UPDATE room_master
            SET room_status_id = 7, updated_by_id = v_user_id, updated_date = v_now
            WHERE FIND_IN_SET(room_id, v_room_ids_to_update);
        END IF;
        
        COMMIT;
        
        SELECT JSON_OBJECT(
            'success', TRUE,
            'message', CONCAT('Case 5: All bills merged into one. Deleted checkout IDs: ', IFNULL(@other_checkout_ids, 'None')),
            'checkout_id', v_keeper_checkout_id,
            'checkin_id', p_checkin_id,
            'is_partial', 0,
            'ldg_bill_no', v_ldg_bill_no,
            'payment_method', v_final_payment_method,
            'checkout_datetime', v_checkout_dt,
            'checked_out_rooms', v_processed_rooms_json,
            'checked_out_room_ids', v_processed_room_ids_json,
            'merge_performed', 1,
            'case_type', 'Case 5 - Merge After Full Checkout',
            'deleted_checkout_ids', IFNULL(@other_checkout_ids, 'None'),
            'folio_records_copied', (SELECT COUNT(*) FROM Checkout_Folio_Master WHERE checkout_id = v_keeper_checkout_id),
            'debug_info', v_debug_msg
        ) AS result;
        LEAVE sp_perform_checkout;
    END IF;

    -- Get all checked-out room IDs
    SELECT GROUP_CONCAT(DISTINCT room_id) INTO v_all_checked_out_room_ids
    FROM checkin_detail_master
    WHERE checkin_id = p_checkin_id AND is_checkout = 1;

    -- ============================================================================
    -- RE-CHECKOUT: Selected room(s) are already checked out, rebuild same bill
    -- ============================================================================
    IF (v_selected_active_room_ids IS NULL OR v_selected_active_room_ids = '') 
       AND (v_checked_out_selected_room_ids IS NOT NULL AND v_checked_out_selected_room_ids != '') THEN
        
        SELECT cm.checkout_id, cm.ldg_bill_no
        INTO v_existing_checkout_id, v_existing_ldg_bill_no
        FROM Checkout_Master cm
        INNER JOIN Checkout_Detail cd ON cm.checkout_id = cd.checkout_id
        WHERE cm.checkin_id = p_checkin_id
          AND FIND_IN_SET(cd.room_id, v_checked_out_selected_room_ids) > 0
          AND cm.bill_no = 1   -- Only lodging bill can have details
        ORDER BY cm.checkout_id ASC
        LIMIT 1;
        
        IF v_existing_checkout_id IS NOT NULL AND v_existing_checkout_id > 0 THEN
            -- FIX: LDG BILL NUMBER LOGIC — reuse existing checkout identity/bill,
            -- never call generate_next_invoice_no() here.
            SET v_is_re_checkout = 1;
            SET v_ldg_bill_no = v_existing_ldg_bill_no;
            SET v_checkout_id = v_existing_checkout_id;
            
            DELETE FROM Checkout_Detail WHERE checkout_id = v_existing_checkout_id;
            DELETE FROM Checkout_Folio_Master WHERE checkout_id = v_existing_checkout_id;
            DELETE FROM Checkout_Room_Charges WHERE checkout_id = v_existing_checkout_id;
            
            UPDATE checkin_detail_master
            SET is_checkout = 0, updated_by_id = v_user_id, updated_date = v_now
            WHERE checkin_id = p_checkin_id
              AND FIND_IN_SET(room_id, v_checked_out_selected_room_ids) > 0;
            
            SET v_active_room_ids = v_checked_out_selected_room_ids;
            SET v_room_ids_to_update = v_checked_out_selected_room_ids;
            
            SET v_debug_msg = CONCAT('Re-checkout mode: checkout_id=', v_existing_checkout_id, 
                                     ', ldg_bill_no=', v_existing_ldg_bill_no);
        ELSE
            SET v_is_re_checkout = 0;
            SET v_active_room_ids = v_checked_out_selected_room_ids;
            SET v_room_ids_to_update = v_checked_out_selected_room_ids;
            
            UPDATE checkin_detail_master
            SET is_checkout = 0, updated_by_id = v_user_id, updated_date = v_now
            WHERE checkin_id = p_checkin_id
              AND FIND_IN_SET(room_id, v_checked_out_selected_room_ids) > 0;
            
            SET v_debug_msg = CONCAT('No existing checkout found. Treating as normal checkout for rooms: ', 
                                     v_checked_out_selected_room_ids);
        END IF;


            -- Recompute aggregated totals for the rooms being re-checked out
    IF v_active_room_ids IS NOT NULL AND v_active_room_ids != '' THEN
        SELECT 
            COALESCE(SUM(room_tariff), 0),
            COALESCE(SUM(ex_pax_charge), 0),
            COALESCE(SUM(child_paid_amount), 0),
            COALESCE(SUM(driver_charge), 0),
            COALESCE(SUM(discount_amount), 0),
            COALESCE(SUM(cgst_amount), 0),
            COALESCE(SUM(sgst_amount), 0),
            COALESCE(SUM(igst_amount), 0),
            COALESCE(SUM(ex_cgst_amount), 0),
            COALESCE(SUM(ex_sgst_amount), 0),
            COALESCE(SUM(ex_igst_amount), 0),
            COALESCE(SUM(child_cgst_amount), 0),
            COALESCE(SUM(child_sgst_amount), 0),
            COALESCE(SUM(child_igst_amount), 0),
            COALESCE(SUM(driver_cgst_amount), 0),
            COALESCE(SUM(driver_sgst_amount), 0),
            COALESCE(SUM(driver_igst_amount), 0),
            COALESCE(SUM(cess_amount), 0),
            COALESCE(SUM(service_charge_amount), 0),
            COALESCE(MAX(no_of_days), 0)
        INTO 
            v_room_tariff_sum,
            v_ex_pax_charge,
            v_child_paid_amount,
            v_driver_charge,
            v_discount_amount,
            v_cgst_amount,
            v_sgst_amount,
            v_igst_amount,
            v_ex_cgst_amount,
            v_ex_sgst_amount,
            v_ex_igst_amount,
            v_child_cgst_amount,
            v_child_sgst_amount,
            v_child_igst_amount,
            v_driver_cgst_amount,
            v_driver_sgst_amount,
            v_driver_igst_amount,
            v_cess_amount,
            v_service_charge_amount,
            v_total_nights
        FROM checkin_detail_master
        WHERE checkin_id = p_checkin_id
          AND FIND_IN_SET(room_id, v_active_room_ids) > 0;
    END IF;
        
    -- ============================================================================
    -- MIXED MODE: Some selected rooms are active, some already checked out
    -- ============================================================================
    ELSEIF v_selected_active_room_ids IS NOT NULL AND v_selected_active_room_ids != '' 
           AND v_checked_out_selected_room_ids IS NOT NULL AND v_checked_out_selected_room_ids != '' THEN
        SET v_mixed_mode = 1;
        SET v_active_room_ids = v_selected_active_room_ids;

        -- ========================================================================
        -- FIX: LDG BILL NUMBER LOGIC (Mixed Mode)
        -- Determine the keeper checkout up front and route the newly-active
        -- rooms straight into it via the re-checkout code path below.
        -- Previously this fell through to the "normal checkout" branch, which:
        --   1) called generate_next_invoice_no() / used p_invoice_no to create a
        --      brand-new Checkout_Master row and bill number for the newly
        --      active rooms, even though that row was about to be discarded —
        --      wasting an invoice number (violates Section 6 & 11), and
        --   2) that temporary checkout's Checkout_Detail/Checkout_Room_Charges
        --      rows were then DELETEd in the merge step below without ever
        --      being copied into the keeper — real data loss.
        -- Setting v_is_re_checkout = 1 here reuses the keeper's existing
        -- ldg_bill_no/checkout_id and writes the new room detail rows directly
        -- into it, so no invoice is generated and nothing needs to be moved.
        -- ========================================================================
        SELECT checkout_id, ldg_bill_no
        INTO v_keeper_checkout_id, v_existing_ldg_bill_no
        FROM Checkout_Master
        WHERE checkin_id = p_checkin_id
          AND bill_no = 1   -- Only lodging bill
        ORDER BY checkout_id ASC
        LIMIT 1;

        IF v_keeper_checkout_id IS NOT NULL AND v_keeper_checkout_id > 0 THEN
            SET v_is_re_checkout = 1;
            SET v_existing_checkout_id = v_keeper_checkout_id;
            SET v_checkout_id = v_keeper_checkout_id;
            SET v_ldg_bill_no = v_existing_ldg_bill_no;
            SET v_room_ids_to_update = v_selected_active_room_ids;
            SET v_debug_msg = CONCAT('Mixed mode: routing new rooms into keeper checkout_id=', v_keeper_checkout_id,
                                     ', ldg_bill_no=', v_existing_ldg_bill_no);
        END IF;
        
    -- Normal case: all selected rooms are active (Case 1, 2, 3)
    ELSEIF v_selected_active_room_ids IS NOT NULL AND v_selected_active_room_ids != '' THEN
        SET v_active_room_ids = v_selected_active_room_ids;

            --  Compute all aggregated totals directly from checkin_detail_master
    IF v_active_room_ids IS NOT NULL AND v_active_room_ids != '' THEN
        SELECT 
            COALESCE(SUM(room_tariff), 0),
            COALESCE(SUM(ex_pax_charge), 0),
            COALESCE(SUM(child_paid_amount), 0),
            COALESCE(SUM(driver_charge), 0),
            COALESCE(SUM(discount_amount), 0),
            COALESCE(SUM(cgst_amount), 0),
            COALESCE(SUM(sgst_amount), 0),
            COALESCE(SUM(igst_amount), 0),
            COALESCE(SUM(ex_cgst_amount), 0),
            COALESCE(SUM(ex_sgst_amount), 0),
            COALESCE(SUM(ex_igst_amount), 0),
            COALESCE(SUM(child_cgst_amount), 0),
            COALESCE(SUM(child_sgst_amount), 0),
            COALESCE(SUM(child_igst_amount), 0),
            COALESCE(SUM(driver_cgst_amount), 0),
            COALESCE(SUM(driver_sgst_amount), 0),
            COALESCE(SUM(driver_igst_amount), 0),
            COALESCE(SUM(cess_amount), 0),
            COALESCE(SUM(service_charge_amount), 0),
            COALESCE(MAX(no_of_days), 0)
        INTO 
            v_room_tariff_sum,
            v_ex_pax_charge,
            v_child_paid_amount,
            v_driver_charge,
            v_discount_amount,
            v_cgst_amount,
            v_sgst_amount,
            v_igst_amount,
            v_ex_cgst_amount,
            v_ex_sgst_amount,
            v_ex_igst_amount,
            v_child_cgst_amount,
            v_child_sgst_amount,
            v_child_igst_amount,
            v_driver_cgst_amount,
            v_driver_sgst_amount,
            v_driver_igst_amount,
            v_cess_amount,
            v_service_charge_amount,
            v_total_nights
        FROM checkin_detail_master
        WHERE checkin_id = p_checkin_id
          AND FIND_IN_SET(room_id, v_active_room_ids) > 0;
    END IF;
        
    ELSE
        SELECT JSON_OBJECT(
            'success', FALSE,
            'message', 'No active rooms selected. Please select rooms that are currently checked in.'
        ) AS result;
        ROLLBACK;
        LEAVE sp_perform_checkout;
    END IF;

    IF (v_active_room_ids IS NULL OR v_active_room_ids = '') AND v_is_re_checkout = 0 THEN
        SELECT JSON_OBJECT(
            'success', FALSE,
            'message', 'No active rooms found to process.'
        ) AS result;
        ROLLBACK;
        LEAVE sp_perform_checkout;
    END IF;

    IF v_active_room_ids IS NOT NULL AND v_active_room_ids != '' THEN
        UPDATE checkin_detail_master
        SET is_checkout = 1, updated_by_id = v_user_id, updated_date = v_now
        WHERE checkin_id = p_checkin_id
          AND FIND_IN_SET(room_id, v_active_room_ids) > 0;
        
        SET v_room_ids_to_update = v_active_room_ids;
    END IF;

    -- ============================================================================
    -- NORMAL CHECKOUT (Case 1/2/3 – Full or Partial)
    -- Using frontend data
    -- ============================================================================
    -- All totals already set from input parameters
    -- No SELECT from checkin_detail_master needed
    
    SELECT COALESCE(JSON_ARRAYAGG(room_number), JSON_ARRAY())
    INTO v_processed_rooms_json
    FROM (SELECT DISTINCT room_number FROM checkin_detail_master WHERE checkin_id = p_checkin_id AND FIND_IN_SET(room_id, v_active_room_ids) > 0) d;

    SELECT COALESCE(JSON_ARRAYAGG(room_id), JSON_ARRAY())
    INTO v_processed_room_ids_json
    FROM (SELECT DISTINCT room_id FROM checkin_detail_master WHERE checkin_id = p_checkin_id AND FIND_IN_SET(room_id, v_active_room_ids) > 0) d;

    SET v_total_computed = COALESCE(p_total_amount, 
        v_room_tariff_sum + v_ex_pax_charge + v_child_paid_amount + v_driver_charge
        + v_cgst_amount + v_sgst_amount + v_igst_amount
        + v_ex_cgst_amount + v_ex_sgst_amount + v_ex_igst_amount
        + v_child_cgst_amount + v_child_sgst_amount + v_child_igst_amount
        + v_driver_cgst_amount + v_driver_sgst_amount + v_driver_igst_amount
        + v_cess_amount + v_service_charge_amount
        - v_discount_amount
    );

    -- Get remaining active count (to decide full vs partial)
    SELECT COUNT(*) INTO v_remaining_active
    FROM checkin_detail_master
    WHERE checkin_id = p_checkin_id AND is_checkout = 0;

    -- ============================================================================
    -- Insert or Update Checkout_Master
    -- ============================================================================
    IF v_is_re_checkout = 0 THEN
        -- FIX: LDG BILL NUMBER LOGIC — this is the ONLY place in the whole
        -- procedure that may call generate_next_invoice_no(); it only runs for
        -- a genuinely new checkout (not re-checkout, not mixed mode, not
        -- Case 4/5). The value is captured once into v_ldg_bill_no and reused
        -- for every subsequent statement in this execution.
        IF p_invoice_no IS NULL OR p_invoice_no = '' THEN
            SET v_ldg_bill_no = generate_next_invoice_no();
        ELSE
            SET v_ldg_bill_no = p_invoice_no;
        END IF;

        INSERT INTO Checkout_Master (
            checkin_id, guest_id, ldg_bill_no, bill_no, reg_no, booking, plan_name,
            checkin_datetime, room_no,
            tot_room_tariff, tot_ex_pax_charge, tot_child_paid_amount, tot_driver_charge,
            tot_discount_amount,
            tot_cgst_amount, tot_sgst_amount, tot_igst_amount,
            tot_ex_cgst_amount, tot_ex_sgst_amount, tot_ex_igst_amount,
            tot_child_cgst_amount, tot_child_sgst_amount, tot_child_igst_amount,
            tot_driver_cgst_amount, tot_driver_sgst_amount, tot_driver_igst_amount,
            tot_service_charge_amount, tot_cess_amount, tot_advance,
            hotelid, total_amount, total_nights,
            id_type, id_number, department_id, department_name,
            special_instruction, message,
            created_by_id, created_date, updated_by_id, updated_date,
            status, checkout_date, checkout_by_id, checkout_reason,
            is_partial_checkout, checked_out_rooms, room_id,
            payment_method, dummy_pax
        )
        SELECT
            cm.checkin_id, cm.guest_id, v_ldg_bill_no, p_bill_no, cm.reg_no, cm.booking, cm.plan_name,
            cm.checkin_datetime, NULL,
            v_room_tariff_sum, v_ex_pax_charge, v_child_paid_amount, v_driver_charge,
            v_discount_amount,
            v_cgst_amount, v_sgst_amount, v_igst_amount,
            v_ex_cgst_amount, v_ex_sgst_amount, v_ex_igst_amount,
            v_child_cgst_amount, v_child_sgst_amount, v_child_igst_amount,
            v_driver_cgst_amount, v_driver_sgst_amount, v_driver_igst_amount,
            v_service_charge_amount, v_cess_amount, v_advance_amt,
            cm.hotelid, COALESCE(p_total_amount, v_total_computed), v_total_nights,
            cm.id_type, cm.id_number, cm.department_id, cm.department_name,
            cm.special_instruction, cm.message,
            cm.created_by_id, cm.created_date, v_user_id, v_now,
            CASE WHEN v_remaining_active = 0 THEN 'checked_out' ELSE 'partial_checkout' END,
            v_checkout_dt,
            v_user_id,
            COALESCE(p_checkout_reason, 'Regular checkout'),
            CASE WHEN v_remaining_active > 0 THEN 1 ELSE 0 END,
            v_processed_rooms_json,
            v_processed_room_ids_json,
            v_final_payment_method,
            p_dummy_pax
        FROM CheckIn_Master cm
        WHERE cm.checkin_id = p_checkin_id;

        SET v_checkout_id = LAST_INSERT_ID();
        
        SET v_debug_msg = CONCAT('New checkout created. checkout_id: ', v_checkout_id, ', ldg_bill_no: ', v_ldg_bill_no);
        
    ELSE
        SET v_checkout_id = v_existing_checkout_id;
        SET v_ldg_bill_no = v_existing_ldg_bill_no;
        
        UPDATE Checkout_Master
        SET
            tot_room_tariff = v_room_tariff_sum,
            tot_ex_pax_charge = v_ex_pax_charge,
            tot_child_paid_amount = v_child_paid_amount,
            tot_driver_charge = v_driver_charge,
            tot_discount_amount = v_discount_amount,
            tot_cgst_amount = v_cgst_amount,
            tot_sgst_amount = v_sgst_amount,
            tot_igst_amount = v_igst_amount,
            tot_ex_cgst_amount = v_ex_cgst_amount,
            tot_ex_sgst_amount = v_ex_sgst_amount,
            tot_ex_igst_amount = v_ex_igst_amount,
            tot_child_cgst_amount = v_child_cgst_amount,
            tot_child_sgst_amount = v_child_sgst_amount,
            tot_child_igst_amount = v_child_igst_amount,
            tot_driver_cgst_amount = v_driver_cgst_amount,
            tot_driver_sgst_amount = v_driver_sgst_amount,
            tot_driver_igst_amount = v_driver_igst_amount,
            tot_service_charge_amount = v_service_charge_amount,
            tot_cess_amount = v_cess_amount,
            tot_advance = v_advance_amt,
            total_amount = COALESCE(p_total_amount, v_total_computed),
            total_nights = v_total_nights,
            checked_out_rooms = v_processed_rooms_json,
            room_id = v_processed_room_ids_json,
            payment_method = v_final_payment_method,
            dummy_pax = p_dummy_pax,  
            updated_by_id = v_user_id,
            updated_date = v_now,
            checkout_date = v_checkout_dt,
            is_partial_checkout = CASE WHEN v_remaining_active > 0 THEN 1 ELSE 0 END,
            status = CASE WHEN v_remaining_active = 0 THEN 'checked_out' ELSE 'partial_checkout' END
        WHERE checkout_id = v_existing_checkout_id;
        
        SET v_debug_msg = CONCAT('Re-checkout - updated existing checkout_id: ', v_existing_checkout_id, 
                                 ', ldg_bill_no: ', v_existing_ldg_bill_no);
    END IF;

    -- Ensure checkout_id is set for re-checkout
    IF v_is_re_checkout = 1 AND (v_checkout_id IS NULL OR v_checkout_id = 0) THEN
        SELECT checkout_id INTO v_checkout_id
        FROM Checkout_Master
        WHERE checkin_id = p_checkin_id
          AND bill_no = 1
        ORDER BY checkout_id DESC
        LIMIT 1;
        
        SET v_debug_msg = CONCAT('Fixed checkout_id from DB: ', v_checkout_id);
    END IF;

    -- ============================================================================
    -- Insert Checkout_Detail (Using frontend data + room details from JSON)
    -- ============================================================================
    INSERT INTO Checkout_Detail (
        checkin_id, checkout_id, hotelid, room_id, room_number,
        room_category_id, room_category_name,
        converted_category_id, converted_category_name,
        guest_id, guest_name, address, mobile,
        company_id, company_name, emailed,
        checkin_datetime, checkout_datetime, no_of_days,
        adults, pax, ex_pax,
        child_paid, child_unpaid, driver,
        room_tariff,
        ex_pax_charge, child_paid_amount, driver_charge,
        discount_percent, discount_amount,
        tax_percen_room,
        cgst_percent, cgst_amount,
        sgst_percent, sgst_amount,
        igst_percent, igst_amount,
        tax_percen_ex,
        ex_cgst_percent, ex_cgst_amount,
        ex_sgst_percent, ex_sgst_amount,
        ex_igst_percent, ex_igst_amount,
        tax_percen_child,
        child_cgst_percent, child_cgst_amount,
        child_sgst_percent, child_sgst_amount,
        child_igst_percent, child_igst_amount,
        tax_percen_driver,
        driver_cgst_percent, driver_cgst_amount,
        driver_sgst_percent, driver_sgst_amount,
        driver_igst_percent, driver_igst_amount,
        service_charge, service_charge_amount,
        cess_percent, cess_amount,
        parent_detail_id,
        is_checkout,
        merged,
        is_settle,
        tax,
        created_date, updated_date,
        created_by_id, updated_by_id
    )
    SELECT
        p_checkin_id,
        v_checkout_id,
        v_hotel_id,
        cdm.room_id,
        cdm.room_number,
        cdm.room_category_id,
        cdm.room_category_name,
        cdm.converted_category_id,
        cdm.converted_category_name,
        v_guest_id,
        p_guest_name,
        p_address,
        p_mobile,
        p_company_id,
        p_company_name,
        cdm.emailed,
        cdm.checkin_datetime,
        v_checkout_dt,
        v_total_nights,
        cdm.adults,
        cdm.pax,
        cdm.ex_pax,
        cdm.child_paid,
        cdm.child_unpaid,
        cdm.driver,
        cdm.room_tariff,
        cdm.ex_pax_charge,
        cdm.child_paid_amount,
        cdm.driver_charge,
        cdm.discount_percent,
        v_discount_amount,
        cdm.tax_percen_room,
        cdm.cgst_percent,
        cdm.cgst_amount,        
        cdm.sgst_percent,
        cdm.sgst_amount,        
        cdm.igst_percent,
        cdm.igst_amount,        
        cdm.tax_percen_ex,
        cdm.ex_cgst_percent,
        cdm.ex_cgst_amount,     
        cdm.ex_sgst_percent,
        cdm.ex_sgst_amount,     
        cdm.ex_igst_percent,
        cdm.ex_igst_amount,     
        cdm.tax_percen_child,
        cdm.child_cgst_percent,
        cdm.child_cgst_amount,  
        cdm.child_sgst_percent,
        cdm.child_sgst_amount,  
        cdm.child_igst_percent,
        cdm.child_igst_amount,  
        cdm.tax_percen_driver,
        cdm.driver_cgst_percent,
        cdm.driver_cgst_amount, 
        cdm.driver_sgst_percent,
        cdm.driver_sgst_amount, 
        cdm.driver_igst_percent,
        cdm.driver_igst_amount, 
        cdm.service_charge,
        cdm.service_charge_amount, 
        cdm.cess_percent,
        cdm.cess_amount,        
        cdm.parent_detail_id,
        1,
        cdm.merged,
        cdm.is_settle,
        cdm.tax,
        cdm.created_date,
        v_now,
        cdm.created_by_id,
        v_user_id
    FROM checkin_detail_master cdm
    WHERE cdm.checkin_id = p_checkin_id
      AND FIND_IN_SET(cdm.room_id, v_active_room_ids) > 0;

    -- ============================================================================
    -- Insert Folio records (Using frontend data)
    -- ============================================================================
    INSERT INTO Checkout_Folio_Master (
        checkin_id, checkout_id, hotel_id, detail_id, room_id,
        transaction_type, transaction_datetime,
        description, debit_amount, credit_amount,
        reference_number, payment_method,
        created_by_id, created_date, updated_by_id, updated_date
    )
    SELECT
        cgfm.checkin_id, 
        v_checkout_id, 
        cgfm.hotel_id, 
        cgfm.detail_id, 
        cgfm.room_id,
        cgfm.transaction_type, 
        cgfm.transaction_datetime,
        cgfm.description, 
        cgfm.debit_amount, 
        cgfm.credit_amount,
        cgfm.reference_number, 
        COALESCE(v_final_payment_method, cgfm.payment_method, 'Cash') AS payment_method,
        cgfm.created_by_id, 
        cgfm.created_date, 
        v_user_id, 
        v_now
    FROM checkin_guest_folio_master cgfm
    WHERE cgfm.checkin_id = p_checkin_id
      AND (cgfm.room_id IS NULL OR FIND_IN_SET(cgfm.room_id, v_active_room_ids) > 0)
      AND cgfm.bill_no = 1;   -- Lodging only

    -- ============================================================================
    -- Insert Room Charges (Using frontend data)
    -- ============================================================================
    INSERT INTO Checkout_Room_Charges (
        checkin_id, checkout_id, guest_id, room_id, category_id,
        pax_count, pax_price, pax_tax,
        ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
        child_count, child_price, child_tax, child_tax_percent, child_total,
        driver_count, driver_price, driver_tax, driver_tax_percent, driver_total,
        total_amount, checkin_datetime, checkout_datetime,
        created_at, updated_at
    )
    SELECT
        cgrc.checkin_id, v_checkout_id, cgrc.guest_id, cgrc.room_id, cgrc.category_id,
        cgrc.pax_count, cgrc.pax_price, cgrc.pax_tax,
        cgrc.ex_pax_count, cgrc.ex_pax_price, cgrc.ex_pax_tax, cgrc.ex_pax_tax_percent, cgrc.ex_pax_total,
        cgrc.child_count, cgrc.child_price, cgrc.child_tax, cgrc.child_tax_percent, cgrc.child_total,
        cgrc.driver_count, cgrc.driver_price, cgrc.driver_tax, cgrc.driver_tax_percent, cgrc.driver_total,
        cgrc.total_amount, cgrc.checkin_datetime, v_checkout_dt,
        NOW(), NOW()
    FROM checkin_guest_room_charges cgrc
    WHERE cgrc.checkin_id = p_checkin_id
      AND FIND_IN_SET(cgrc.room_id, v_active_room_ids) > 0;
    

    -- ============================================================================
    -- Update statuses
    -- ============================================================================
    IF v_remaining_active = 0 THEN
        UPDATE CheckIn_Master
        SET status = 'checked_out', updated_by_id = v_user_id, updated_date = v_now
        WHERE checkin_id = p_checkin_id;
    END IF;

    IF v_room_ids_to_update IS NOT NULL AND v_room_ids_to_update != '' THEN
        UPDATE room_master
        SET room_status_id = 7, updated_by_id = v_user_id, updated_date = v_now
        WHERE FIND_IN_SET(room_id, v_room_ids_to_update);
    END IF;

    -- ============================================================================
    -- Update Checkout_Master final totals (for normal checkout only)
    -- ============================================================================
    IF v_is_re_checkout = 0 AND v_checkout_id IS NOT NULL THEN
        UPDATE Checkout_Master
        SET
            tot_room_tariff = v_room_tariff_sum,
            tot_ex_pax_charge = v_ex_pax_charge,
            tot_child_paid_amount = v_child_paid_amount,
            tot_driver_charge = v_driver_charge,
            tot_discount_amount = v_discount_amount,
            tot_cgst_amount = v_cgst_amount,
            tot_sgst_amount = v_sgst_amount,
            tot_igst_amount = v_igst_amount,
            tot_ex_cgst_amount = v_ex_cgst_amount,
            tot_ex_sgst_amount = v_ex_sgst_amount,
            tot_ex_igst_amount = v_ex_igst_amount,
            tot_child_cgst_amount = v_child_cgst_amount,
            tot_child_sgst_amount = v_child_sgst_amount,
            tot_child_igst_amount = v_child_igst_amount,
            tot_driver_cgst_amount = v_driver_cgst_amount,
            tot_driver_sgst_amount = v_driver_sgst_amount,
            tot_driver_igst_amount = v_driver_igst_amount,
            tot_service_charge_amount = v_service_charge_amount,
            tot_cess_amount = v_cess_amount,
            tot_advance = v_advance_amt,
            total_amount = COALESCE(p_total_amount, v_total_computed),
            total_nights = v_total_nights,
            checked_out_rooms = v_processed_rooms_json,
            room_id = v_processed_room_ids_json,
            payment_method = v_final_payment_method,
            dummy_pax = p_dummy_pax,  
            updated_by_id = v_user_id,
            updated_date = v_now,
            checkout_date = v_checkout_dt,
            is_partial_checkout = CASE WHEN v_remaining_active > 0 THEN 1 ELSE 0 END,
            status = CASE WHEN v_remaining_active = 0 THEN 'checked_out' ELSE 'partial_checkout' END
        WHERE checkout_id = v_checkout_id;
    END IF;

    -- ============================================================================
    -- HANDLE MIXED MODE MERGE
    -- ============================================================================
    IF v_mixed_mode = 1 THEN
        SET v_debug_msg = CONCAT('Mixed-selection merge: checkout datetime = ', v_checkout_dt);

        SELECT checkout_id INTO v_keeper_checkout_id
        FROM Checkout_Master
        WHERE checkin_id = p_checkin_id
          AND bill_no = 1   -- lodging only
        ORDER BY checkout_id ASC
        LIMIT 1;

        SELECT GROUP_CONCAT(DISTINCT checkout_id) INTO @other_checkout_ids
        FROM Checkout_Master
        WHERE checkin_id = p_checkin_id
          AND checkout_id != v_keeper_checkout_id
          AND bill_no = 1;   -- only lodging bills

        -- ========================================================================
        -- FIX: LDG BILL NUMBER LOGIC — move any remaining source checkouts'
        -- Checkout_Detail / Checkout_Room_Charges into the keeper BEFORE they
        -- are deleted. (With the routing fix above, @other_checkout_ids will
        -- normally be empty for the common 2-bill mixed-mode case since the
        -- new rooms were already written directly into the keeper; this only
        -- matters when 3+ Checkout_Master rows genuinely exist and still need
        -- to be folded together.) Without this step the source rows were
        -- previously destroyed with no replacement — real data loss.
        -- ========================================================================
        IF @other_checkout_ids IS NOT NULL AND @other_checkout_ids != '' THEN

            INSERT INTO Checkout_Detail (
                checkin_id, checkout_id, hotelid, room_id, room_number,
                room_category_id, room_category_name,
                converted_category_id, converted_category_name,
                guest_id, guest_name, address, mobile,
                company_id, company_name, emailed,
                checkin_datetime, checkout_datetime, no_of_days,
                adults, pax, ex_pax,
                child_paid, child_unpaid, driver,
                room_tariff,
                ex_pax_charge, child_paid_amount, driver_charge,
                discount_percent, discount_amount,
                tax_percen_room,
                cgst_percent, cgst_amount,
                sgst_percent, sgst_amount,
                igst_percent, igst_amount,
                tax_percen_ex,
                ex_cgst_percent, ex_cgst_amount,
                ex_sgst_percent, ex_sgst_amount,
                ex_igst_percent, ex_igst_amount,
                tax_percen_child,
                child_cgst_percent, child_cgst_amount,
                child_sgst_percent, child_sgst_amount,
                child_igst_percent, child_igst_amount,
                tax_percen_driver,
                driver_cgst_percent, driver_cgst_amount,
                driver_sgst_percent, driver_sgst_amount,
                driver_igst_percent, driver_igst_amount,
                service_charge, service_charge_amount,
                cess_percent, cess_amount,
                parent_detail_id,
                is_checkout,
                merged,
                is_settle,
                tax,
                created_date, updated_date,
                created_by_id, updated_by_id
            )
            SELECT
                checkin_id, v_keeper_checkout_id, hotelid, room_id, room_number,
                room_category_id, room_category_name,
                converted_category_id, converted_category_name,
                guest_id, guest_name, address, mobile,
                company_id, company_name, emailed,
                checkin_datetime, v_checkout_dt, no_of_days,
                adults, pax, ex_pax,
                child_paid, child_unpaid, driver,
                room_tariff,
                ex_pax_charge, child_paid_amount, driver_charge,
                discount_percent, discount_amount,
                tax_percen_room,
                cgst_percent, cgst_amount,
                sgst_percent, sgst_amount,
                igst_percent, igst_amount,
                tax_percen_ex,
                ex_cgst_percent, ex_cgst_amount,
                ex_sgst_percent, ex_sgst_amount,
                ex_igst_percent, ex_igst_amount,
                tax_percen_child,
                child_cgst_percent, child_cgst_amount,
                child_sgst_percent, child_sgst_amount,
                child_igst_percent, child_igst_amount,
                tax_percen_driver,
                driver_cgst_percent, driver_cgst_amount,
                driver_sgst_percent, driver_sgst_amount,
                driver_igst_percent, driver_igst_amount,
                service_charge, service_charge_amount,
                cess_percent, cess_amount,
                parent_detail_id,
                1, merged, is_settle, tax,
                created_date, v_now, created_by_id, v_user_id
            FROM Checkout_Detail
            WHERE FIND_IN_SET(checkout_id, @other_checkout_ids) > 0;

            INSERT INTO Checkout_Room_Charges (
                checkin_id, checkout_id, guest_id, room_id, category_id,
                pax_count, pax_price, pax_tax,
                ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
                child_count, child_price, child_tax, child_tax_percent, child_total,
                driver_count, driver_price, driver_tax, driver_tax_percent, driver_total,
                total_amount, checkin_datetime, checkout_datetime,
                created_at, updated_at
            )
            SELECT
                checkin_id, v_keeper_checkout_id, guest_id, room_id, category_id,
                pax_count, pax_price, pax_tax,
                ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
                child_count, child_price, child_tax, child_tax_percent, child_total,
                driver_count, driver_price, driver_tax, driver_tax_percent, driver_total,
                total_amount, checkin_datetime, v_checkout_dt,
                NOW(), NOW()
            FROM Checkout_Room_Charges
            WHERE FIND_IN_SET(checkout_id, @other_checkout_ids) > 0;
        END IF;

        IF @other_checkout_ids IS NOT NULL AND @other_checkout_ids != '' THEN
            SET @delete_query = CONCAT('DELETE FROM Checkout_Folio_Master WHERE checkout_id IN (', @other_checkout_ids, ')');
            PREPARE stmt FROM @delete_query;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            
            SET @delete_query = CONCAT('DELETE FROM Checkout_Room_Charges WHERE checkout_id IN (', @other_checkout_ids, ')');
            PREPARE stmt FROM @delete_query;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            
            SET @delete_query = CONCAT('DELETE FROM Checkout_Detail WHERE checkout_id IN (', @other_checkout_ids, ')');
            PREPARE stmt FROM @delete_query;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            
            SET @delete_query = CONCAT('DELETE FROM Checkout_Master WHERE checkout_id IN (', @other_checkout_ids, ')');
            PREPARE stmt FROM @delete_query;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        END IF;

        DELETE FROM Checkout_Folio_Master WHERE checkout_id = v_keeper_checkout_id;

        INSERT INTO Checkout_Folio_Master (
            checkin_id, checkout_id, hotel_id, detail_id, room_id,
            transaction_type, transaction_datetime,
            description, debit_amount, credit_amount,
            reference_number, payment_method,
            created_by_id, created_date, updated_by_id, updated_date
        )
        SELECT
            cgfm.checkin_id,
            v_keeper_checkout_id,
            cgfm.hotel_id,
            cgfm.detail_id,
            cgfm.room_id,
            cgfm.transaction_type,
            cgfm.transaction_datetime,
            cgfm.description,
            cgfm.debit_amount,
            cgfm.credit_amount,
            cgfm.reference_number,
            COALESCE(v_final_payment_method, cgfm.payment_method, 'Cash') AS payment_method,
            cgfm.created_by_id,
            cgfm.created_date,
            v_user_id,
            v_now
        FROM checkin_guest_folio_master cgfm
        WHERE cgfm.checkin_id = p_checkin_id
          AND cgfm.bill_no = 1;   -- lodging only

        SELECT COALESCE(JSON_ARRAYAGG(room_number), JSON_ARRAY())
        INTO v_processed_rooms_json
        FROM (SELECT DISTINCT room_number FROM Checkout_Detail WHERE checkout_id = v_keeper_checkout_id) d;

        SELECT COALESCE(JSON_ARRAYAGG(room_id), JSON_ARRAY())
        INTO v_processed_room_ids_json
        FROM (SELECT DISTINCT room_id FROM Checkout_Detail WHERE checkout_id = v_keeper_checkout_id) d;

        SET v_total_computed = COALESCE(p_total_amount, 
            v_room_tariff_sum + v_ex_pax_charge + v_child_paid_amount + v_driver_charge
            + v_cgst_amount + v_sgst_amount + v_igst_amount
            + v_ex_cgst_amount + v_ex_sgst_amount + v_ex_igst_amount
            + v_child_cgst_amount + v_child_sgst_amount + v_child_igst_amount
            + v_driver_cgst_amount + v_driver_sgst_amount + v_driver_igst_amount
            + v_cess_amount + v_service_charge_amount
            - v_discount_amount
        );


            -- Recompute aggregated totals from the merged Checkout_Detail
    SELECT
        COALESCE(SUM(room_tariff), 0),
        COALESCE(SUM(ex_pax_charge), 0),
        COALESCE(SUM(child_paid_amount), 0),
        COALESCE(SUM(driver_charge), 0),
        COALESCE(SUM(discount_amount), 0),
        COALESCE(SUM(cgst_amount), 0),
        COALESCE(SUM(sgst_amount), 0),
        COALESCE(SUM(igst_amount), 0),
        COALESCE(SUM(ex_cgst_amount), 0),
        COALESCE(SUM(ex_sgst_amount), 0),
        COALESCE(SUM(ex_igst_amount), 0),
        COALESCE(SUM(child_cgst_amount), 0),
        COALESCE(SUM(child_sgst_amount), 0),
        COALESCE(SUM(child_igst_amount), 0),
        COALESCE(SUM(driver_cgst_amount), 0),
        COALESCE(SUM(driver_sgst_amount), 0),
        COALESCE(SUM(driver_igst_amount), 0),
        COALESCE(SUM(cess_amount), 0),
        COALESCE(SUM(service_charge_amount), 0),
        COALESCE(MAX(no_of_days), 0)
    INTO
        v_room_tariff_sum,
        v_ex_pax_charge,
        v_child_paid_amount,
        v_driver_charge,
        v_discount_amount,
        v_cgst_amount,
        v_sgst_amount,
        v_igst_amount,
        v_ex_cgst_amount,
        v_ex_sgst_amount,
        v_ex_igst_amount,
        v_child_cgst_amount,
        v_child_sgst_amount,
        v_child_igst_amount,
        v_driver_cgst_amount,
        v_driver_sgst_amount,
        v_driver_igst_amount,
        v_cess_amount,
        v_service_charge_amount,
        v_total_nights
    FROM Checkout_Detail
    WHERE checkout_id = v_keeper_checkout_id;

        UPDATE Checkout_Master
        SET
            tot_room_tariff = v_room_tariff_sum,
            tot_ex_pax_charge = v_ex_pax_charge,
            tot_child_paid_amount = v_child_paid_amount,
            tot_driver_charge = v_driver_charge,
            tot_discount_amount = v_discount_amount,
            tot_cgst_amount = v_cgst_amount,
            tot_sgst_amount = v_sgst_amount,
            tot_igst_amount = v_igst_amount,
            tot_ex_cgst_amount = v_ex_cgst_amount,
            tot_ex_sgst_amount = v_ex_sgst_amount,
            tot_ex_igst_amount = v_ex_igst_amount,
            tot_child_cgst_amount = v_child_cgst_amount,
            tot_child_sgst_amount = v_child_sgst_amount,
            tot_child_igst_amount = v_child_igst_amount,
            tot_driver_cgst_amount = v_driver_cgst_amount,
            tot_driver_sgst_amount = v_driver_sgst_amount,
            tot_driver_igst_amount = v_driver_igst_amount,
            tot_service_charge_amount = v_service_charge_amount,
            tot_cess_amount = v_cess_amount,
            tot_advance = v_advance_amt,
            total_amount = v_total_computed,
            total_nights = v_total_nights,
            checked_out_rooms = v_processed_rooms_json,
            room_id = v_processed_room_ids_json,
            payment_method = v_final_payment_method,
            dummy_pax = p_dummy_pax,  
            updated_by_id = v_user_id,
            updated_date = v_now,
            checkout_date = v_checkout_dt,
            is_partial_checkout = 0,
            status = 'checked_out'
        WHERE checkout_id = v_keeper_checkout_id;

        SET v_checkout_id = v_keeper_checkout_id;
        SET v_ldg_bill_no = (SELECT ldg_bill_no FROM Checkout_Master WHERE checkout_id = v_keeper_checkout_id);
        SET v_remaining_active = (SELECT COUNT(*) FROM checkin_detail_master WHERE checkin_id = p_checkin_id AND is_checkout = 0);

        COMMIT;

        SELECT JSON_OBJECT(
            'success', TRUE,
            'message', 'Mixed selection: newly checked-out rooms merged with previously checked-out rooms into one bill.',
            'checkout_id', v_keeper_checkout_id,
            'checkin_id', p_checkin_id,
            'is_partial', 0,
            'ldg_bill_no', v_ldg_bill_no,
            'payment_method', v_final_payment_method,
            'checkout_datetime', v_checkout_dt,
            'checked_out_rooms', v_processed_rooms_json,
            'checked_out_room_ids', v_processed_room_ids_json,
            'merge_performed', 1,
            'case_type', 'Mixed Mode Merge',
            'deleted_checkout_ids', IFNULL(@other_checkout_ids, 'None'),
            'folio_records_copied', (SELECT COUNT(*) FROM Checkout_Folio_Master WHERE checkout_id = v_keeper_checkout_id)
        ) AS result;
        LEAVE sp_perform_checkout;
    END IF;

    -- ============================================================================
    -- FINAL COMMIT AND RESPONSE
    -- ============================================================================
    COMMIT;

    SELECT JSON_OBJECT(
        'success', TRUE,
        'message', CASE 
            WHEN v_is_re_checkout = 1 THEN CONCAT('Re-checkout completed successfully. Room(s) processed with same LDG Bill No: ', COALESCE(v_ldg_bill_no, 'N/A'))
            WHEN v_remaining_active = 0 THEN 'Full checkout completed'
            ELSE CONCAT('Partial checkout completed. ', v_remaining_active, ' room(s) remain active.')
        END,
        'checkout_id', COALESCE(v_checkout_id, 0),
        'checkin_id', p_checkin_id,
        'is_partial', CASE WHEN v_remaining_active > 0 THEN 1 ELSE 0 END,
        'ldg_bill_no', COALESCE(v_ldg_bill_no, ''),
        'payment_method', v_final_payment_method,
        'checkout_datetime', v_checkout_dt,
        'checked_out_rooms', v_processed_rooms_json,
        'checked_out_room_ids', v_processed_room_ids_json,
        'is_re_checkout', v_is_re_checkout,
        'folio_records_copied', (SELECT COUNT(*) FROM Checkout_Folio_Master WHERE checkout_id = v_checkout_id),
        'data', JSON_OBJECT(
            'checkout_id', COALESCE(v_checkout_id, 0),
            'checkin_id', p_checkin_id,
            'is_partial', CASE WHEN v_remaining_active > 0 THEN 1 ELSE 0 END,
            'ldg_bill_no', COALESCE(v_ldg_bill_no, ''),
            'payment_method', v_final_payment_method,
            'aggregated_values', JSON_OBJECT(
                'advance_amt', v_advance_amt,
                'post_changes_amt', v_post_changes_amt,
                'allowances_amt', v_allowances_amt,
                'discount_amount', v_discount_amount,
                'cgst_amt', v_cgst_amount,
                'sgst_amt', v_sgst_amount,
                'igst_amt', v_igst_amount,
                'total_amount', COALESCE(p_total_amount, v_total_computed),
                'net_payable', COALESCE(p_net_payable, v_total_computed)
            )
        )
    ) AS result;
END