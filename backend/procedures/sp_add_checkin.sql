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
    IN p_user_id INT
)
sp_perform_checkout:BEGIN
    DECLARE v_now DATETIME;
    DECLARE v_user_id INT;
    DECLARE v_ldg_bill_no VARCHAR(50);
    DECLARE v_hotel_id INT;
    DECLARE v_error_msg VARCHAR(500);
    DECLARE v_debug_msg VARCHAR(1000);

    -- Selected room parsing
    DECLARE v_selected_rooms_str VARCHAR(2000) DEFAULT '';
    DECLARE v_selected_room_ids VARCHAR(2000) DEFAULT '';
    DECLARE v_selected_room_ids_all VARCHAR(2000) DEFAULT '';
    DECLARE v_active_room_ids VARCHAR(2000) DEFAULT '';
    DECLARE v_active_room_count INT DEFAULT 0;
    DECLARE v_all_checked_out_room_ids VARCHAR(2000) DEFAULT '';

    -- Aggregates (for normal checkout or recalc)
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

    -- Folio aggregates (guest-level)
    DECLARE v_advance_amt DECIMAL(10,2) DEFAULT 0;
    DECLARE v_post_changes_amt DECIMAL(10,2) DEFAULT 0;
    DECLARE v_allowances_amt DECIMAL(10,2) DEFAULT 0;

    -- JSON for processed rooms
    DECLARE v_processed_rooms_json JSON;
    DECLARE v_processed_room_ids_json JSON;
    DECLARE v_room_ids_to_update VARCHAR(2000) DEFAULT '';

    DECLARE v_i INT DEFAULT 0;
    DECLARE v_room_value VARCHAR(50);
    DECLARE v_total_computed DECIMAL(10,2) DEFAULT 0;
    DECLARE v_remaining_active INT DEFAULT 0;
    DECLARE v_checkout_id INT;

    -- Merge / Split variables
    DECLARE v_merge_mode TINYINT DEFAULT 0;
    DECLARE v_split_mode TINYINT DEFAULT 0;
    DECLARE v_keeper_checkout_id INT DEFAULT 0;
    DECLARE v_source_checkout_id INT DEFAULT 0;
    DECLARE v_new_checkout_id INT DEFAULT 0;
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_cur_checkout_id INT;
    DECLARE v_merge_triggered TINYINT DEFAULT 0;

    -- Cursor for merge
    DECLARE merge_cursor CURSOR FOR
        SELECT DISTINCT cm.checkout_id
        FROM Checkout_Master cm
        INNER JOIN Checkout_Detail cd ON cm.checkout_id = cd.checkout_id
        WHERE cm.checkin_id = p_checkin_id
          AND FIND_IN_SET(cd.room_id, v_all_checked_out_room_ids) > 0
        ORDER BY cm.checkout_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    -- Error handler
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
    SET v_now = NOW();
    SET v_user_id = COALESCE(p_user_id, 1);
    SET v_error_msg = 'Starting checkout process';
    SET v_debug_msg = 'Initializing';

    -- 1. Validate checkin
    SELECT hotelid INTO v_hotel_id FROM CheckIn_Master WHERE checkin_id = p_checkin_id;
    IF v_hotel_id IS NULL THEN
        SELECT JSON_OBJECT('success', FALSE, 'message', 'Check-in record not found') AS result;
        ROLLBACK;
        LEAVE sp_perform_checkout;
    END IF;

    -- 2. Parse selected rooms JSON into comma-separated string
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

    -- 3. Get room IDs for all selected rooms (regardless of is_checkout)
    IF v_selected_rooms_str != '' THEN
        SELECT GROUP_CONCAT(DISTINCT room_id)
        INTO v_selected_room_ids_all
        FROM checkin_detail_master
        WHERE checkin_id = p_checkin_id
          AND FIND_IN_SET(room_number COLLATE utf8mb4_general_ci, v_selected_rooms_str) > 0;
    END IF;

    -- 4. Get active rooms (is_checkout = 0)
    SELECT COUNT(*) INTO v_active_room_count
    FROM checkin_detail_master
    WHERE checkin_id = p_checkin_id AND is_checkout = 0;

    -- 5. Get all checked-out room IDs for this checkin
    SELECT GROUP_CONCAT(DISTINCT room_id) INTO v_all_checked_out_room_ids
    FROM checkin_detail_master
    WHERE checkin_id = p_checkin_id AND is_checkout = 1;

    -- 6. Determine operation: normal, merge, or split
    IF v_active_room_count > 0 THEN
        -- Normal checkout: active rooms exist
        IF v_selected_rooms_str != '' THEN
            SELECT GROUP_CONCAT(DISTINCT room_id)
            INTO v_active_room_ids
            FROM checkin_detail_master
            WHERE checkin_id = p_checkin_id
              AND is_checkout = 0
              AND FIND_IN_SET(room_number COLLATE utf8mb4_general_ci, v_selected_rooms_str) > 0;
        END IF;

        IF v_active_room_ids IS NULL OR v_active_room_ids = '' THEN
            SELECT JSON_OBJECT('success', FALSE, 'message', 'No active rooms selected.') AS result;
            ROLLBACK;
            LEAVE sp_perform_checkout;
        END IF;

        -- Mark selected active rooms as checked out
        UPDATE checkin_detail_master
        SET is_checkout = 1, updated_by_id = v_user_id, updated_date = v_now
        WHERE checkin_id = p_checkin_id
          AND FIND_IN_SET(room_id, v_active_room_ids) > 0;

        SET v_room_ids_to_update = v_active_room_ids;
        SET v_merge_mode = 0;
        SET v_split_mode = 0;

    ELSE
        -- No active rooms – all rooms are already checked out
        IF v_selected_room_ids_all IS NULL OR v_selected_room_ids_all = '' THEN
            SELECT JSON_OBJECT('success', FALSE, 'message', 'No rooms selected.') AS result;
            ROLLBACK;
            LEAVE sp_perform_checkout;
        END IF;

        SET @selected_count = (SELECT COUNT(*) FROM checkin_detail_master WHERE checkin_id = p_checkin_id AND FIND_IN_SET(room_id, v_selected_room_ids_all) > 0);
        SET @checked_out_count = (SELECT COUNT(*) FROM checkin_detail_master WHERE checkin_id = p_checkin_id AND is_checkout = 1);

        IF @selected_count = @checked_out_count AND @selected_count > 0 THEN
            -- MERGE: selected all checked-out rooms
            SET v_merge_mode = 1;
            SET v_split_mode = 0;
        ELSEIF @selected_count < @checked_out_count AND @selected_count > 0 THEN
            -- SPLIT: selected a proper subset
            SET v_split_mode = 1;
            SET v_merge_mode = 0;
        ELSE
            SELECT JSON_OBJECT('success', FALSE, 'message', 'Invalid selection. You must select at least one room.') AS result;
            ROLLBACK;
            LEAVE sp_perform_checkout;
        END IF;
    END IF;

    -- -----------------------------------------------------------------
    -- 7. MERGE MODE (Modified to also trigger when multiple masters exist)
    -- -----------------------------------------------------------------
    IF v_merge_mode = 1 OR (SELECT COUNT(*) FROM Checkout_Master WHERE checkin_id = p_checkin_id) > 1 THEN
        -- If triggered from normal checkout, set flag
        IF v_merge_mode = 0 THEN
            SET v_merge_triggered = 1;
            SET v_all_checked_out_room_ids = (SELECT GROUP_CONCAT(DISTINCT room_id) 
                                              FROM checkin_detail_master 
                                              WHERE checkin_id = p_checkin_id AND is_checkout = 1);
        END IF;
        
        OPEN merge_cursor;
        SET v_done = 0;
        SET v_keeper_checkout_id = 0;

        read_loop: LOOP
            FETCH merge_cursor INTO v_cur_checkout_id;
            IF v_done THEN
                LEAVE read_loop;
            END IF;
            IF v_keeper_checkout_id = 0 THEN
                SET v_keeper_checkout_id = v_cur_checkout_id;
            ELSE
                -- Copy all child records from v_cur_checkout_id to keeper
                -- Checkout_Detail
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
                    1, merged, is_settle, tax,
                    created_date, v_now, created_by_id, v_user_id
                FROM Checkout_Detail
                WHERE checkout_id = v_cur_checkout_id;

                -- Checkout_Folio_Master
                INSERT INTO Checkout_Folio_Master (
                    checkin_id, checkout_id, hotel_id, detail_id, room_id,
                    transaction_type, transaction_datetime,
                    description, debit_amount, credit_amount,
                    reference_number, payment_method,
                    created_by_id, created_date, updated_by_id, updated_date
                )
                SELECT
                    checkin_id, v_keeper_checkout_id, hotel_id, detail_id, room_id,
                    transaction_type, transaction_datetime,
                    description, debit_amount, credit_amount,
                    reference_number, payment_method,
                    created_by_id, created_date, v_user_id, v_now
                FROM Checkout_Folio_Master
                WHERE checkout_id = v_cur_checkout_id;

                -- Checkout_Room_Charges
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
                    total_amount, checkin_datetime, checkout_datetime,
                    NOW(), NOW()
                FROM Checkout_Room_Charges
                WHERE checkout_id = v_cur_checkout_id;

                -- Delete the merged checkout master and its children (already copied)
                DELETE FROM Checkout_Detail WHERE checkout_id = v_cur_checkout_id;
                DELETE FROM Checkout_Folio_Master WHERE checkout_id = v_cur_checkout_id;
                DELETE FROM Checkout_Room_Charges WHERE checkout_id = v_cur_checkout_id;
                DELETE FROM Checkout_Master WHERE checkout_id = v_cur_checkout_id;
            END IF;
        END LOOP;
        CLOSE merge_cursor;

        -- Recalculate totals for keeper
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

        -- Folio aggregates
        SELECT
            COALESCE(SUM(CASE WHEN transaction_type IN ('Booking Receipt','Advance Addition') THEN credit_amount ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN transaction_type = 'CHARGE' THEN debit_amount ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN transaction_type = 'ALLOWANCE' THEN credit_amount ELSE 0 END), 0)
        INTO v_advance_amt, v_post_changes_amt, v_allowances_amt
        FROM checkin_guest_folio_master
        WHERE checkin_id = p_checkin_id;

        SET v_total_computed = v_room_tariff_sum + v_ex_pax_charge + v_child_paid_amount + v_driver_charge
                            + v_cgst_amount + v_sgst_amount + v_igst_amount
                            + v_ex_cgst_amount + v_ex_sgst_amount + v_ex_igst_amount
                            + v_child_cgst_amount + v_child_sgst_amount + v_child_igst_amount
                            + v_driver_cgst_amount + v_driver_sgst_amount + v_driver_igst_amount
                            + v_cess_amount + v_service_charge_amount
                            - v_discount_amount;

        -- Build JSON arrays for keeper
        SELECT COALESCE(JSON_ARRAYAGG(room_number), JSON_ARRAY())
        INTO v_processed_rooms_json
        FROM (SELECT DISTINCT room_number FROM Checkout_Detail WHERE checkout_id = v_keeper_checkout_id) d;

        SELECT COALESCE(JSON_ARRAYAGG(room_id), JSON_ARRAY())
        INTO v_processed_room_ids_json
        FROM (SELECT DISTINCT room_id FROM Checkout_Detail WHERE checkout_id = v_keeper_checkout_id) d;

        -- Update keeper master
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
            updated_by_id = v_user_id,
            updated_date = v_now,
            is_partial_checkout = 0,
            status = 'checked_out'
        WHERE checkout_id = v_keeper_checkout_id;

        SET v_checkout_id = v_keeper_checkout_id;
        SET v_ldg_bill_no = (SELECT ldg_bill_no FROM Checkout_Master WHERE checkout_id = v_keeper_checkout_id);
        SET v_remaining_active = 0;

        COMMIT;
        
        -- Return appropriate message based on how merge was triggered
        IF v_merge_triggered = 1 THEN
            SELECT JSON_OBJECT(
                'success', TRUE,
                'message', 'Merged all checkout bills into one after normal checkout.',
                'checkout_id', v_keeper_checkout_id,
                'checkin_id', p_checkin_id,
                'is_partial', 0,
                'ldg_bill_no', v_ldg_bill_no,
                'checked_out_rooms', v_processed_rooms_json,
                'checked_out_room_ids', v_processed_room_ids_json,
                'merge_performed', 1,
                'merge_triggered_by', 'normal_checkout',
                'data', JSON_OBJECT(
                    'checkout_id', v_keeper_checkout_id,
                    'checkin_id', p_checkin_id,
                    'is_partial', 0,
                    'ldg_bill_no', v_ldg_bill_no,
                    'aggregated_values', JSON_OBJECT(
                        'advance_amt', v_advance_amt,
                        'total_amount', v_total_computed,
                        'net_payable', COALESCE(p_net_payable, v_total_computed)
                    )
                )
            ) AS result;
        ELSE
            SELECT JSON_OBJECT(
                'success', TRUE,
                'message', 'Merged all checkout bills into one.',
                'checkout_id', v_keeper_checkout_id,
                'checkin_id', p_checkin_id,
                'is_partial', 0,
                'ldg_bill_no', v_ldg_bill_no,
                'checked_out_rooms', v_processed_rooms_json,
                'checked_out_room_ids', v_processed_room_ids_json,
                'merge_performed', 1,
                'data', JSON_OBJECT(
                    'checkout_id', v_keeper_checkout_id,
                    'checkin_id', p_checkin_id,
                    'is_partial', 0,
                    'ldg_bill_no', v_ldg_bill_no,
                    'aggregated_values', JSON_OBJECT(
                        'advance_amt', v_advance_amt,
                        'total_amount', v_total_computed,
                        'net_payable', COALESCE(p_net_payable, v_total_computed)
                    )
                )
            ) AS result;
        END IF;
        LEAVE sp_perform_checkout;
    END IF;

    -- -----------------------------------------------------------------
    -- 8. SPLIT MODE (unchanged - payment_method not needed at master level)
    -- -----------------------------------------------------------------
    IF v_split_mode = 1 THEN
        -- Identify the source checkout master that currently contains these rooms
        SELECT DISTINCT cm.checkout_id INTO v_source_checkout_id
        FROM Checkout_Master cm
        INNER JOIN Checkout_Detail cd ON cm.checkout_id = cd.checkout_id
        WHERE cm.checkin_id = p_checkin_id
          AND FIND_IN_SET(cd.room_id, v_selected_room_ids_all) > 0
        LIMIT 1;

        IF v_source_checkout_id IS NULL THEN
            SELECT JSON_OBJECT('success', FALSE, 'message', 'Selected rooms not found in any checkout.') AS result;
            ROLLBACK;
            LEAVE sp_perform_checkout;
        END IF;

        -- Generate new bill number for the new split bill
        SET v_ldg_bill_no = generate_next_invoice_no();

        -- Create a new Checkout_Master for the selected rooms (copy from source master, but with new ldg_bill_no)
        INSERT INTO Checkout_Master (
            checkin_id, guest_id, ldg_bill_no, reg_no, booking, plan_name,
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
            is_partial_checkout, checked_out_rooms, room_id
        )
        SELECT
            cm.checkin_id, cm.guest_id, v_ldg_bill_no, cm.reg_no, cm.booking, cm.plan_name,
            cm.checkin_datetime, NULL,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            cm.hotelid, 0, 0,
            cm.id_type, cm.id_number, cm.department_id, cm.department_name,
            cm.special_instruction, cm.message,
            cm.created_by_id, cm.created_date, v_user_id, v_now,
            'checked_out', v_now, v_user_id, COALESCE(p_checkout_reason, 'Split checkout'),
            0, JSON_ARRAY(), JSON_ARRAY()
        FROM Checkout_Master cm
        WHERE cm.checkout_id = v_source_checkout_id;

        SET v_new_checkout_id = LAST_INSERT_ID();

        -- Move selected room records from source to new checkout
        -- Checkout_Detail
        UPDATE Checkout_Detail
        SET checkout_id = v_new_checkout_id, updated_by_id = v_user_id, updated_date = v_now
        WHERE checkout_id = v_source_checkout_id
          AND FIND_IN_SET(room_id, v_selected_room_ids_all) > 0;

        -- Checkout_Folio_Master (only room-specific transactions)
        UPDATE Checkout_Folio_Master
        SET checkout_id = v_new_checkout_id, updated_by_id = v_user_id, updated_date = v_now
        WHERE checkout_id = v_source_checkout_id
          AND room_id IS NOT NULL
          AND FIND_IN_SET(room_id, v_selected_room_ids_all) > 0;

        -- Checkout_Room_Charges
        UPDATE Checkout_Room_Charges
        SET checkout_id = v_new_checkout_id, updated_at = v_now
        WHERE checkout_id = v_source_checkout_id
          AND FIND_IN_SET(room_id, v_selected_room_ids_all) > 0;

        -- Recalculate totals for source master (remaining rooms)
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
        WHERE checkout_id = v_source_checkout_id;

        -- Recalculate totals for new split master (selected rooms)
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
            @new_room_tariff_sum,
            @new_ex_pax_charge,
            @new_child_paid_amount,
            @new_driver_charge,
            @new_discount_amount,
            @new_cgst_amount,
            @new_sgst_amount,
            @new_igst_amount,
            @new_ex_cgst_amount,
            @new_ex_sgst_amount,
            @new_ex_igst_amount,
            @new_child_cgst_amount,
            @new_child_sgst_amount,
            @new_child_igst_amount,
            @new_driver_cgst_amount,
            @new_driver_sgst_amount,
            @new_driver_igst_amount,
            @new_cess_amount,
            @new_service_charge_amount,
            @new_total_nights
        FROM Checkout_Detail
        WHERE checkout_id = v_new_checkout_id;

        -- Compute totals
        SET v_total_computed = v_room_tariff_sum + v_ex_pax_charge + v_child_paid_amount + v_driver_charge
                            + v_cgst_amount + v_sgst_amount + v_igst_amount
                            + v_ex_cgst_amount + v_ex_sgst_amount + v_ex_igst_amount
                            + v_child_cgst_amount + v_child_sgst_amount + v_child_igst_amount
                            + v_driver_cgst_amount + v_driver_sgst_amount + v_driver_igst_amount
                            + v_cess_amount + v_service_charge_amount
                            - v_discount_amount;

        SET @new_total = @new_room_tariff_sum + @new_ex_pax_charge + @new_child_paid_amount + @new_driver_charge
                         + @new_cgst_amount + @new_sgst_amount + @new_igst_amount
                         + @new_ex_cgst_amount + @new_ex_sgst_amount + @new_ex_igst_amount
                         + @new_child_cgst_amount + @new_child_sgst_amount + @new_child_igst_amount
                         + @new_driver_cgst_amount + @new_driver_sgst_amount + @new_driver_igst_amount
                         + @new_cess_amount + @new_service_charge_amount
                         - @new_discount_amount;

        -- Folio aggregates (guest-level, same for both)
        SELECT
            COALESCE(SUM(CASE WHEN transaction_type IN ('Booking Receipt','Advance Addition') THEN credit_amount ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN transaction_type = 'CHARGE' THEN debit_amount ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN transaction_type = 'ALLOWANCE' THEN credit_amount ELSE 0 END), 0)
        INTO v_advance_amt, v_post_changes_amt, v_allowances_amt
        FROM checkin_guest_folio_master
        WHERE checkin_id = p_checkin_id;

        -- Build JSON for source (remaining rooms)
        SELECT COALESCE(JSON_ARRAYAGG(room_number), JSON_ARRAY())
        INTO v_processed_rooms_json
        FROM (SELECT DISTINCT room_number FROM Checkout_Detail WHERE checkout_id = v_source_checkout_id) d;

        SELECT COALESCE(JSON_ARRAYAGG(room_id), JSON_ARRAY())
        INTO v_processed_room_ids_json
        FROM (SELECT DISTINCT room_id FROM Checkout_Detail WHERE checkout_id = v_source_checkout_id) d;

        -- Update source master
        UPDATE Checkout_Master        SET
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
            updated_by_id = v_user_id,
            updated_date = v_now,
            is_partial_checkout = CASE WHEN (SELECT COUNT(*) FROM Checkout_Detail WHERE checkout_id = v_source_checkout_id) > 0 THEN 0 ELSE 1 END,
            status = CASE WHEN (SELECT COUNT(*) FROM Checkout_Detail WHERE checkout_id = v_source_checkout_id) > 0 THEN 'checked_out' ELSE 'partial_checkout' END
        WHERE checkout_id = v_source_checkout_id;

        -- Build JSON for new master (selected rooms)
        SELECT COALESCE(JSON_ARRAYAGG(room_number), JSON_ARRAY())
        INTO @new_rooms_json
        FROM (SELECT DISTINCT room_number FROM Checkout_Detail WHERE checkout_id = v_new_checkout_id) d;

        SELECT COALESCE(JSON_ARRAYAGG(room_id), JSON_ARRAY())
        INTO @new_room_ids_json
        FROM (SELECT DISTINCT room_id FROM Checkout_Detail WHERE checkout_id = v_new_checkout_id) d;

        -- Update new master
        UPDATE Checkout_Master
        SET
            tot_room_tariff = @new_room_tariff_sum,
            tot_ex_pax_charge = @new_ex_pax_charge,
            tot_child_paid_amount = @new_child_paid_amount,
            tot_driver_charge = @new_driver_charge,
            tot_discount_amount = @new_discount_amount,
            tot_cgst_amount = @new_cgst_amount,
            tot_sgst_amount = @new_sgst_amount,
            tot_igst_amount = @new_igst_amount,
            tot_ex_cgst_amount = @new_ex_cgst_amount,
            tot_ex_sgst_amount = @new_ex_sgst_amount,
            tot_ex_igst_amount = @new_ex_igst_amount,
            tot_child_cgst_amount = @new_child_cgst_amount,
            tot_child_sgst_amount = @new_child_sgst_amount,
            tot_child_igst_amount = @new_child_igst_amount,
            tot_driver_cgst_amount = @new_driver_cgst_amount,
            tot_driver_sgst_amount = @new_driver_sgst_amount,
            tot_driver_igst_amount = @new_driver_igst_amount,
            tot_service_charge_amount = @new_service_charge_amount,
            tot_cess_amount = @new_cess_amount,
            tot_advance = v_advance_amt,
            total_amount = @new_total,
            total_nights = @new_total_nights,
            checked_out_rooms = @new_rooms_json,
            room_id = @new_room_ids_json,
            updated_by_id = v_user_id,
            updated_date = v_now,
            is_partial_checkout = 0,
            status = 'checked_out'
        WHERE checkout_id = v_new_checkout_id;

        -- If source master becomes empty (no detail records), delete it
        IF (SELECT COUNT(*) FROM Checkout_Detail WHERE checkout_id = v_source_checkout_id) = 0 THEN
            DELETE FROM Checkout_Master WHERE checkout_id = v_source_checkout_id;
            SET v_checkout_id = v_new_checkout_id;
        ELSE
            SET v_checkout_id = v_new_checkout_id;  -- return the new bill as primary
        END IF;

        COMMIT;
        SELECT JSON_OBJECT(
            'success', TRUE,
            'message', 'Split checkout: selected rooms moved to a new bill.',
            'new_checkout_id', v_new_checkout_id,
            'source_checkout_id', v_source_checkout_id,
            'new_bill_no', v_ldg_bill_no,
            'selected_rooms', @new_rooms_json,
            'remaining_rooms', v_processed_rooms_json,
            'data', JSON_OBJECT(
                'checkout_id', v_new_checkout_id,
                'checkin_id', p_checkin_id,
                'is_partial', 0,
                'ldg_bill_no', v_ldg_bill_no,
                'aggregated_values', JSON_OBJECT(
                    'advance_amt', v_advance_amt,
                    'total_amount', @new_total,
                    'net_payable', COALESCE(p_net_payable, @new_total)
                )
            )
        ) AS result;
        LEAVE sp_perform_checkout;
    END IF;

    -- -----------------------------------------------------------------
    -- 9. NORMAL CHECKOUT (active rooms exist) - ADDED PAYMENT_METHOD
    -- -----------------------------------------------------------------
    -- We already have v_active_room_ids, and the rooms are marked as checked out.
    -- Compute aggregates from selected active rooms
    SELECT
        COALESCE(SUM(room_tariff), 0),
        COALESCE(SUM(adults), 0),
        COALESCE(SUM(pax), 0),
        COALESCE(SUM(ex_pax), 0),
        COALESCE(SUM(ex_pax_charge), 0),
        COALESCE(SUM(child_paid), 0),
        COALESCE(SUM(child_unpaid), 0),
        COALESCE(SUM(child_paid_amount), 0),
        COALESCE(SUM(driver), 0),
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
        v_room_tariff_sum, v_adults, v_pax, v_ex_pax, v_ex_pax_charge,
        v_child_paid, v_child_unpaid, v_child_paid_amount, v_driver, v_driver_charge,
        v_discount_amount,
        v_cgst_amount, v_sgst_amount, v_igst_amount,
        v_ex_cgst_amount, v_ex_sgst_amount, v_ex_igst_amount,
        v_child_cgst_amount, v_child_sgst_amount, v_child_igst_amount,
        v_driver_cgst_amount, v_driver_sgst_amount, v_driver_igst_amount,
        v_cess_amount, v_service_charge_amount,
        v_total_nights
    FROM checkin_detail_master
    WHERE checkin_id = p_checkin_id
      AND FIND_IN_SET(room_id, v_active_room_ids) > 0;

    -- Build JSON arrays of processed rooms
    SELECT COALESCE(JSON_ARRAYAGG(room_number), JSON_ARRAY())
    INTO v_processed_rooms_json
    FROM (SELECT DISTINCT room_number FROM checkin_detail_master WHERE checkin_id = p_checkin_id AND FIND_IN_SET(room_id, v_active_room_ids) > 0) d;

    SELECT COALESCE(JSON_ARRAYAGG(room_id), JSON_ARRAY())
    INTO v_processed_room_ids_json
    FROM (SELECT DISTINCT room_id FROM checkin_detail_master WHERE checkin_id = p_checkin_id AND FIND_IN_SET(room_id, v_active_room_ids) > 0) d;

    -- Compute total if not provided
    SET v_total_computed = COALESCE(p_total_amount,
        v_room_tariff_sum + v_ex_pax_charge + v_child_paid_amount + v_driver_charge
        + v_cgst_amount + v_sgst_amount + v_igst_amount
        + v_ex_cgst_amount + v_ex_sgst_amount + v_ex_igst_amount
        + v_child_cgst_amount + v_child_sgst_amount + v_child_igst_amount
        + v_driver_cgst_amount + v_driver_sgst_amount + v_driver_igst_amount
        + v_cess_amount + v_service_charge_amount
        - v_discount_amount
    );

    -- Folio aggregates (guest-level)
    SELECT
        COALESCE(SUM(CASE WHEN transaction_type IN ('Booking Receipt','Advance Addition') THEN credit_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN transaction_type = 'CHARGE' THEN debit_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN transaction_type = 'ALLOWANCE' THEN credit_amount ELSE 0 END), 0)
    INTO v_advance_amt, v_post_changes_amt, v_allowances_amt
    FROM checkin_guest_folio_master
    WHERE checkin_id = p_checkin_id;

    -- Count remaining active rooms
    SELECT COUNT(*) INTO v_remaining_active
    FROM checkin_detail_master
    WHERE checkin_id = p_checkin_id AND is_checkout = 0;

    -- Generate new invoice number
    IF p_invoice_no IS NULL OR p_invoice_no = '' THEN
        SET v_ldg_bill_no = generate_next_invoice_no();
    ELSE
        SET v_ldg_bill_no = p_invoice_no;
    END IF;

    -- Insert new Checkout_Master (ADDED payment_method column)
    INSERT INTO Checkout_Master (
        checkin_id, guest_id, ldg_bill_no, reg_no, booking, plan_name,
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
        payment_method  -- <-- ADDED payment_method column
    )
    SELECT
        cm.checkin_id, cm.guest_id, v_ldg_bill_no, cm.reg_no, cm.booking, cm.plan_name,
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
        v_now,  -- checkout date
        v_user_id,
        COALESCE(p_checkout_reason, 'Regular checkout'),
        CASE WHEN v_remaining_active > 0 THEN 1 ELSE 0 END,
        v_processed_rooms_json,
        v_processed_room_ids_json,
        COALESCE(p_payment_method, 'Cash')  -- <-- ADDED payment_method value from parameter
    FROM CheckIn_Master cm
    WHERE cm.checkin_id = p_checkin_id;

    SET v_checkout_id = LAST_INSERT_ID();

    -- Insert child records for the processed rooms
    -- Checkout_Detail
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
        checkin_id,
        v_checkout_id,
        hotelid,
        room_id,
        room_number,
        room_category_id,
        room_category_name,
        converted_category_id,
        converted_category_name,
        guest_id,
        guest_name,
        address,
        mobile,
        company_id,
        company_name,
        emailed,
        checkin_datetime,
        checkout_datetime,
        no_of_days,
        adults,
        pax,
        ex_pax,
        child_paid,
        child_unpaid,
        driver,
        room_tariff,
        ex_pax_charge,
        child_paid_amount,
        driver_charge,
        discount_percent,
        discount_amount,
        tax_percen_room,
        cgst_percent,
        cgst_amount,
        sgst_percent,
        sgst_amount,
        igst_percent,
        igst_amount,
        tax_percen_ex,
        ex_cgst_percent,
        ex_cgst_amount,
        ex_sgst_percent,
        ex_sgst_amount,
        ex_igst_percent,
        ex_igst_amount,
        tax_percen_child,
        child_cgst_percent,
        child_cgst_amount,
        child_sgst_percent,
        child_sgst_amount,
        child_igst_percent,
        child_igst_amount,
        tax_percen_driver,
        driver_cgst_percent,
        driver_cgst_amount,
        driver_sgst_percent,
        driver_sgst_amount,
        driver_igst_percent,
        driver_igst_amount,
        service_charge,
        service_charge_amount,
        cess_percent,
        cess_amount,
        parent_detail_id,
        1,
        merged,
        is_settle,
        tax,
        created_date,
        v_now,
        created_by_id,
        v_user_id
    FROM checkin_detail_master
    WHERE checkin_id = p_checkin_id
      AND FIND_IN_SET(room_id, v_active_room_ids) > 0;

    -- Checkout_Folio_Master (ADDED payment_method to INSERT and SELECT)
    INSERT INTO Checkout_Folio_Master (
        checkin_id, checkout_id, hotel_id, detail_id, room_id, transaction_type, transaction_datetime,
        description, debit_amount, credit_amount, reference_number, payment_method,
        created_by_id, created_date, updated_by_id, updated_date
    )
    SELECT
        checkin_id, v_checkout_id, hotel_id, detail_id, room_id, transaction_type, transaction_datetime,
        description, debit_amount, credit_amount, reference_number, 
        COALESCE(p_payment_method, payment_method, 'Cash') AS payment_method,  -- <-- Use checkout payment method, fallback to existing
        created_by_id, created_date, v_user_id, v_now
    FROM checkin_guest_folio_master
    WHERE checkin_id = p_checkin_id
      AND room_id IS NOT NULL
      AND FIND_IN_SET(room_id, v_active_room_ids) > 0;

    -- Checkout_Room_Charges
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
        cgrc.total_amount, cgrc.checkin_datetime, cgrc.checkout_datetime,
        NOW(), NOW()
    FROM checkin_guest_room_charges cgrc
    WHERE cgrc.checkin_id = p_checkin_id
      AND FIND_IN_SET(cgrc.room_id, v_active_room_ids) > 0;

    -- Update CheckIn_Master status if all rooms are now checked out
    IF v_remaining_active = 0 THEN
        UPDATE CheckIn_Master
        SET status = 'checked_out', updated_by_id = v_user_id, updated_date = v_now
        WHERE checkin_id = p_checkin_id;
    END IF;

    -- Update room_master status to 'Bill/Settlement' for processed rooms
    IF v_room_ids_to_update IS NOT NULL AND v_room_ids_to_update != '' THEN
        UPDATE room_master
        SET room_status_id = 7, updated_by_id = v_user_id, updated_date = v_now
        WHERE FIND_IN_SET(room_id, v_room_ids_to_update);
    END IF;

    COMMIT;

    -- Check if multiple checkout masters exist and trigger merge
    IF (SELECT COUNT(*) FROM Checkout_Master WHERE checkin_id = p_checkin_id) > 1 THEN
        SET v_merge_mode = 1;
        SET v_all_checked_out_room_ids = (SELECT GROUP_CONCAT(DISTINCT room_id) 
                                          FROM checkin_detail_master 
                                          WHERE checkin_id = p_checkin_id AND is_checkout = 1);
        -- The merge will execute when procedure loops back, but we need to return merge result
        -- So we'll execute merge logic here by calling the merge section
        -- Reinitialize for merge execution
        SET v_done = 0;
        SET v_keeper_checkout_id = 0;
        
        OPEN merge_cursor;
        read_loop_after_normal: LOOP
            FETCH merge_cursor INTO v_cur_checkout_id;
            IF v_done THEN
                LEAVE read_loop_after_normal;
            END IF;
            IF v_keeper_checkout_id = 0 THEN
                SET v_keeper_checkout_id = v_cur_checkout_id;
            ELSE
                -- Copy all child records from v_cur_checkout_id to keeper
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
                    1, merged, is_settle, tax,
                    created_date, v_now, created_by_id, v_user_id
                FROM Checkout_Detail
                WHERE checkout_id = v_cur_checkout_id;

                INSERT INTO Checkout_Folio_Master (
                    checkin_id, checkout_id, hotel_id, detail_id, room_id,
                    transaction_type, transaction_datetime,
                    description, debit_amount, credit_amount,
                    reference_number, payment_method,
                    created_by_id, created_date, updated_by_id, updated_date
                )
                SELECT
                    checkin_id, v_keeper_checkout_id, hotel_id, detail_id, room_id,
                    transaction_type, transaction_datetime,
                    description, debit_amount, credit_amount,
                    reference_number, payment_method,
                    created_by_id, created_date, v_user_id, v_now
                FROM Checkout_Folio_Master
                WHERE checkout_id = v_cur_checkout_id;

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
                    total_amount, checkin_datetime, checkout_datetime,
                    NOW(), NOW()
                FROM Checkout_Room_Charges
                WHERE checkout_id = v_cur_checkout_id;

                DELETE FROM Checkout_Detail WHERE checkout_id = v_cur_checkout_id;
                DELETE FROM Checkout_Folio_Master WHERE checkout_id = v_cur_checkout_id;
                DELETE FROM Checkout_Room_Charges WHERE checkout_id = v_cur_checkout_id;
                DELETE FROM Checkout_Master WHERE checkout_id = v_cur_checkout_id;
            END IF;
        END LOOP;
        CLOSE merge_cursor;

        -- Recalculate totals for keeper
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

        SELECT
            COALESCE(SUM(CASE WHEN transaction_type IN ('Booking Receipt','Advance Addition') THEN credit_amount ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN transaction_type = 'CHARGE' THEN debit_amount ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN transaction_type = 'ALLOWANCE' THEN credit_amount ELSE 0 END), 0)
        INTO v_advance_amt, v_post_changes_amt, v_allowances_amt
        FROM checkin_guest_folio_master
        WHERE checkin_id = p_checkin_id;

        SET v_total_computed = v_room_tariff_sum + v_ex_pax_charge + v_child_paid_amount + v_driver_charge
                            + v_cgst_amount + v_sgst_amount + v_igst_amount
                            + v_ex_cgst_amount + v_ex_sgst_amount + v_ex_igst_amount
                            + v_child_cgst_amount + v_child_sgst_amount + v_child_igst_amount
                            + v_driver_cgst_amount + v_driver_sgst_amount + v_driver_igst_amount
                            + v_cess_amount + v_service_charge_amount
                            - v_discount_amount;

        SELECT COALESCE(JSON_ARRAYAGG(room_number), JSON_ARRAY())
        INTO v_processed_rooms_json
        FROM (SELECT DISTINCT room_number FROM Checkout_Detail WHERE checkout_id = v_keeper_checkout_id) d;

        SELECT COALESCE(JSON_ARRAYAGG(room_id), JSON_ARRAY())
        INTO v_processed_room_ids_json
        FROM (SELECT DISTINCT room_id FROM Checkout_Detail WHERE checkout_id = v_keeper_checkout_id) d;

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
            updated_by_id = v_user_id,
            updated_date = v_now,
            is_partial_checkout = 0,
            status = 'checked_out'
        WHERE checkout_id = v_keeper_checkout_id;

        SET v_checkout_id = v_keeper_checkout_id;
        SET v_ldg_bill_no = (SELECT ldg_bill_no FROM Checkout_Master WHERE checkout_id = v_keeper_checkout_id);

        SELECT JSON_OBJECT(
            'success', TRUE,
            'message', 'Merged all checkout bills into one after normal checkout.',
            'checkout_id', v_keeper_checkout_id,
            'checkin_id', p_checkin_id,
            'is_partial', 0,
            'ldg_bill_no', v_ldg_bill_no,
            'checked_out_rooms', v_processed_rooms_json,
            'checked_out_room_ids', v_processed_room_ids_json,
            'merge_performed', 1,
            'merge_triggered_by', 'normal_checkout',
            'data', JSON_OBJECT(
                'checkout_id', v_keeper_checkout_id,
                'checkin_id', p_checkin_id,
                'is_partial', 0,
                'ldg_bill_no', v_ldg_bill_no,
                'aggregated_values', JSON_OBJECT(
                    'advance_amt', v_advance_amt,
                    'total_amount', v_total_computed,
                    'net_payable', COALESCE(p_net_payable, v_total_computed)
                )
            )
        ) AS result;
        LEAVE sp_perform_checkout;
    END IF;

    -- Return success JSON (ADDED payment_method in response)
    SELECT JSON_OBJECT(
        'success', TRUE,
        'message', CASE
            WHEN v_remaining_active = 0 THEN 'Full checkout completed'
            ELSE CONCAT('Partial checkout completed. ', v_remaining_active, ' room(s) remain active.')
        END,
        'checkout_id', v_checkout_id,
        'checkin_id', p_checkin_id,
        'is_partial', CASE WHEN v_remaining_active > 0 THEN 1 ELSE 0 END,
        'ldg_bill_no', v_ldg_bill_no,
        'payment_method', COALESCE(p_payment_method, 'Cash'),  -- <-- ADDED payment_method in response
        'checked_out_rooms', v_processed_rooms_json,
        'checked_out_room_ids', v_processed_room_ids_json,
        'room_ids_updated', v_room_ids_to_update,
        'rooms_updated_count', CASE
            WHEN v_room_ids_to_update IS NOT NULL AND v_room_ids_to_update != ''
            THEN LENGTH(v_room_ids_to_update) - LENGTH(REPLACE(v_room_ids_to_update,',','')) + 1
            ELSE 0
        END,
        'data', JSON_OBJECT(
            'checkout_id', v_checkout_id,
            'checkin_id', p_checkin_id,
            'is_partial', CASE WHEN v_remaining_active > 0 THEN 1 ELSE 0 END,
            'ldg_bill_no', v_ldg_bill_no,
            'payment_method', COALESCE(p_payment_method, 'Cash'),  -- <-- ADDED payment_method in data
            'aggregated_values', JSON_OBJECT(
                'advance_amt', v_advance_amt,
                'post_changes_amt', v_post_changes_amt,
                'allowances_amt', v_allowances_amt,
                'discount_amount', v_discount_amount,
                'cgst_amt', v_cgst_amount,
                'sgst_amt', v_sgst_amount,
                'igst_amt', v_igst_amount,
                'ex_cgst_amt', v_ex_cgst_amount,
                'ex_sgst_amt', v_ex_sgst_amount,
                'ex_igst_amt', v_ex_igst_amount,
                'child_cgst_amt', v_child_cgst_amount,
                'child_sgst_amt', v_child_sgst_amount,
                'child_igst_amt', v_child_igst_amount,
                'driver_cgst_amt', v_driver_cgst_amount,
                'driver_sgst_amt', v_driver_sgst_amount,
                'driver_igst_amt', v_driver_igst_amount,
                'cess_amt', v_cess_amount,
                'service_charge_amt', v_service_charge_amount,
                'total_amount', COALESCE(p_total_amount, v_total_computed),
                'net_payable', COALESCE(p_net_payable, v_total_computed)
            )
        )
    ) AS result;
END