CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_extend_room_stay`(
    IN p_checkin_id INT,
    IN p_room_id INT,
    IN p_extension_days INT,
    IN p_user_id INT,
    OUT p_new_checkout_datetime DATETIME,
    OUT p_new_total_amount DECIMAL(10,2),
    OUT p_new_total_nights INT,
    OUT p_extension_amount DECIMAL(10,2),
    OUT p_daily_rate DECIMAL(10,2),
    OUT p_new_detail_id INT,
    OUT p_new_folio_id INT,
    OUT p_message VARCHAR(255),
    OUT p_success BOOLEAN
)
BEGIN
    -- =====================================================================
    -- 1. DECLARE ALL VARIABLES
    -- =====================================================================
    DECLARE v_hotelid INT;
    DECLARE v_guest_id INT;
    DECLARE v_total_nights INT;
    DECLARE v_total_amount DECIMAL(10,2);
    
    DECLARE v_detail_id INT;
    DECLARE v_room_number VARCHAR(50);
    DECLARE v_room_category_id INT;
    DECLARE v_room_category_name VARCHAR(100);
    DECLARE v_converted_category_id INT;
    DECLARE v_converted_category_name VARCHAR(100);
    DECLARE v_room_tariff DECIMAL(10,2);
    DECLARE v_discount_percent DECIMAL(5,2);
    DECLARE v_discount_amount DECIMAL(10,2);
    DECLARE v_cgst_percent DECIMAL(5,2);
    DECLARE v_cgst_amount DECIMAL(10,2);
    DECLARE v_sgst_percent DECIMAL(5,2);
    DECLARE v_sgst_amount DECIMAL(10,2);
    DECLARE v_igst_percent DECIMAL(5,2);
    DECLARE v_igst_amount DECIMAL(10,2);
    DECLARE v_cess_percent DECIMAL(5,2);
    DECLARE v_cess_amount DECIMAL(10,2);
    DECLARE v_service_charge DECIMAL(5,2);
    DECLARE v_service_charge_amount DECIMAL(10,2);
    DECLARE v_detail_ex_pax_charge DECIMAL(10,2);
    DECLARE v_detail_child_paid_amount DECIMAL(10,2);
    DECLARE v_detail_driver_charge DECIMAL(10,2);
    DECLARE v_detail_adults INT;
    DECLARE v_detail_pax INT;
    DECLARE v_detail_ex_pax INT;
    DECLARE v_detail_child_paid INT;          -- <-- ADDED
    DECLARE v_detail_child_unpaid INT;
    DECLARE v_detail_driver INT;
    DECLARE v_detail_tax DECIMAL(10,2);
    DECLARE v_detail_no_of_days INT;
    DECLARE v_detail_checkout_datetime DATETIME;
    DECLARE v_tax_percen_room DECIMAL(5,2);   -- <-- ADDED

    -- Missing columns from original detail
    DECLARE v_guest_name VARCHAR(150);
    DECLARE v_address VARCHAR(255);
    DECLARE v_mobile VARCHAR(15);
    DECLARE v_company_id INT;
    DECLARE v_company_name VARCHAR(150);
    DECLARE v_emailed VARCHAR(100);

    -- Extra‑charge tax percentages
    DECLARE v_tax_percen_ex DECIMAL(5,2);
    DECLARE v_ex_cgst_percent DECIMAL(5,2);
    DECLARE v_ex_sgst_percent DECIMAL(5,2);
    DECLARE v_ex_igst_percent DECIMAL(5,2);
    DECLARE v_tax_percen_child DECIMAL(5,2);
    DECLARE v_child_cgst_percent DECIMAL(5,2);
    DECLARE v_child_sgst_percent DECIMAL(5,2);
    DECLARE v_child_igst_percent DECIMAL(5,2);
    DECLARE v_tax_percen_driver DECIMAL(5,2);
    DECLARE v_driver_cgst_percent DECIMAL(5,2);
    DECLARE v_driver_sgst_percent DECIMAL(5,2);
    DECLARE v_driver_igst_percent DECIMAL(5,2);

    DECLARE v_folio_payment_method VARCHAR(50);
    DECLARE v_folio_reference_number VARCHAR(100);
    
    DECLARE v_current_checkout_date DATETIME;
    DECLARE v_new_checkout_date DATETIME;
    DECLARE v_room_price_after_discount DECIMAL(10,2);
    DECLARE v_discount_amt DECIMAL(10,2);
    DECLARE v_tax_amount DECIMAL(10,2);
    DECLARE v_cgst_amt DECIMAL(10,2);
    DECLARE v_sgst_amt DECIMAL(10,2);
    DECLARE v_igst_amt DECIMAL(10,2);
    DECLARE v_gst_amount DECIMAL(10,2);
    DECLARE v_cess_amt DECIMAL(10,2);
    DECLARE v_service_charge_amt DECIMAL(10,2);
    DECLARE v_total_tax_percent DECIMAL(5,2);
    
    -- Base and tax amounts for extra charges (total for extension period)
    DECLARE v_base_ex_pax_total DECIMAL(10,2);
    DECLARE v_base_child_total DECIMAL(10,2);
    DECLARE v_base_driver_total DECIMAL(10,2);
    DECLARE v_ex_cgst_amt DECIMAL(10,2);
    DECLARE v_ex_sgst_amt DECIMAL(10,2);
    DECLARE v_ex_igst_amt DECIMAL(10,2);
    DECLARE v_child_cgst_amt DECIMAL(10,2);
    DECLARE v_child_sgst_amt DECIMAL(10,2);
    DECLARE v_child_igst_amt DECIMAL(10,2);
    DECLARE v_driver_cgst_amt DECIMAL(10,2);
    DECLARE v_driver_sgst_amt DECIMAL(10,2);
    DECLARE v_driver_igst_amt DECIMAL(10,2);
    
    -- Per‑day base amounts (no tax) for extra charges
    DECLARE v_base_ex_pax_per_day DECIMAL(10,2);
    DECLARE v_base_child_per_day DECIMAL(10,2);
    DECLARE v_base_driver_per_day DECIMAL(10,2);

    -- Per‑day totals (including tax) used for extension amount calculation
    DECLARE v_daily_room_total DECIMAL(10,2);
    DECLARE v_daily_ex_pax_total DECIMAL(10,2);
    DECLARE v_daily_child_total DECIMAL(10,2);
    DECLARE v_daily_driver_total DECIMAL(10,2);
    DECLARE v_daily_rate DECIMAL(10,2);

    -- Per‑day totals used inside the loop for checkin_guest_room_charges
    DECLARE v_day_room_total DECIMAL(10,2);
    DECLARE v_day_ex_pax_total DECIMAL(10,2);
    DECLARE v_day_child_total DECIMAL(10,2);
    DECLARE v_day_driver_total DECIMAL(10,2);
    DECLARE v_day_total_amount DECIMAL(10,2);

    DECLARE v_extension_amount DECIMAL(10,2);
    DECLARE v_old_total_nights INT;
    DECLARE v_old_total_amount DECIMAL(10,2);
    DECLARE v_new_total_nights INT;
    DECLARE v_new_total_amount DECIMAL(10,2);
    DECLARE v_new_detail_id INT;
    DECLARE v_new_folio_id INT;
    DECLARE v_now DATETIME;
    DECLARE v_day_index INT;
    DECLARE v_charge_checkin_date DATETIME;
    DECLARE v_charge_checkout_date DATETIME;
    DECLARE v_original_ex_pax_price_per_person DECIMAL(10,2);
    DECLARE v_original_child_price_per_child DECIMAL(10,2);
    DECLARE v_original_driver_price_per_driver DECIMAL(10,2);

    -- =====================================================================
    -- 2. DECLARE EXIT HANDLER
    -- =====================================================================
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Error occurred during extension';
        RESIGNAL;
    END;

    -- =====================================================================
    -- 3. INITIALIZE VARIABLES AND START TRANSACTION
    -- =====================================================================
    START TRANSACTION;
    SET v_now = NOW();
    SET p_success = FALSE;
    SET p_message = '';

    -- =====================================================================
    -- 4. VALIDATE INPUT PARAMETERS
    -- =====================================================================
    IF p_checkin_id IS NULL OR p_checkin_id <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid checkin ID';
    END IF;

    IF p_room_id IS NULL OR p_room_id <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid room ID';
    END IF;

    IF p_extension_days IS NULL OR p_extension_days < 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Extension days must be >= 1';
    END IF;

    -- =====================================================================
    -- 5. FETCH CURRENT CHECKIN MASTER DATA
    -- =====================================================================
    SELECT 
        cm.hotelid,
        cm.guest_id,
        cm.total_nights,
        cm.total_amount
    INTO 
        v_hotelid,
        v_guest_id,
        v_total_nights,
        v_total_amount
    FROM checkin_master cm
    WHERE cm.checkin_id = p_checkin_id 
      AND cm.status = 'active'
    FOR UPDATE;

    IF v_hotelid IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Active checkin not found';
    END IF;

    -- =====================================================================
    -- 6. FETCH CURRENT DETAIL FOR THE ROOM (MOST RECENT ACTIVE)
    -- =====================================================================
    SELECT 
        cdm.detail_id,
        cdm.room_number,
        cdm.room_category_id,
        cdm.room_category_name,
        cdm.converted_category_id,
        cdm.converted_category_name,
        cdm.room_tariff,
        cdm.discount_percent,
        cdm.discount_amount,
        cdm.cgst_percent,
        cdm.cgst_amount,
        cdm.sgst_percent,
        cdm.sgst_amount,
        cdm.igst_percent,
        cdm.igst_amount,
        cdm.cess_percent,
        cdm.cess_amount,
        cdm.service_charge,
        cdm.service_charge_amount,
        cdm.ex_pax_charge,
        cdm.child_paid_amount,
        cdm.driver_charge,
        cdm.adults,
        cdm.pax,
        cdm.ex_pax,
        cdm.child_paid,               -- <-- ADDED
        cdm.child_unpaid,
        cdm.driver,
        cdm.tax,
        cdm.checkout_datetime,
        cdm.no_of_days,
        cdm.tax_percen_room,          -- <-- ADDED
        -- missing columns
        cdm.guest_name,
        cdm.address,
        cdm.mobile,
        cdm.company_id,
        cdm.company_name,
        cdm.emailed,
        -- extra‑charge tax percentages
        cdm.tax_percen_ex,
        cdm.ex_cgst_percent,
        cdm.ex_sgst_percent,
        cdm.ex_igst_percent,
        cdm.tax_percen_child,
        cdm.child_cgst_percent,
        cdm.child_sgst_percent,
        cdm.child_igst_percent,
        cdm.tax_percen_driver,
        cdm.driver_cgst_percent,
        cdm.driver_sgst_percent,
        cdm.driver_igst_percent
    INTO 
        v_detail_id,
        v_room_number,
        v_room_category_id,
        v_room_category_name,
        v_converted_category_id,
        v_converted_category_name,
        v_room_tariff,
        v_discount_percent,
        v_discount_amount,
        v_cgst_percent,
        v_cgst_amount,
        v_sgst_percent,
        v_sgst_amount,
        v_igst_percent,
        v_igst_amount,
        v_cess_percent,
        v_cess_amount,
        v_service_charge,
        v_service_charge_amount,
        v_detail_ex_pax_charge,
        v_detail_child_paid_amount,
        v_detail_driver_charge,
        v_detail_adults,
        v_detail_pax,
        v_detail_ex_pax,
        v_detail_child_paid,           -- <-- ADDED
        v_detail_child_unpaid,
        v_detail_driver,
        v_detail_tax,
        v_detail_checkout_datetime,
        v_detail_no_of_days,
        v_tax_percen_room,             -- <-- ADDED
        v_guest_name,
        v_address,
        v_mobile,
        v_company_id,
        v_company_name,
        v_emailed,
        v_tax_percen_ex,
        v_ex_cgst_percent,
        v_ex_sgst_percent,
        v_ex_igst_percent,
        v_tax_percen_child,
        v_child_cgst_percent,
        v_child_sgst_percent,
        v_child_igst_percent,
        v_tax_percen_driver,
        v_driver_cgst_percent,
        v_driver_sgst_percent,
        v_driver_igst_percent
    FROM checkin_detail_master cdm
    WHERE cdm.checkin_id = p_checkin_id 
      AND cdm.room_id = p_room_id 
      AND cdm.is_checkout = 0
    ORDER BY cdm.detail_id DESC
    LIMIT 1
    FOR UPDATE;

    IF v_detail_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Active detail record not found for this room';
    END IF;

    -- =====================================================================
    -- 7. FETCH LATEST FOLIO ROW (FOR REFERENCE)
    -- =====================================================================
    SELECT 
        cgfm.payment_method,
        cgfm.reference_number
    INTO 
        v_folio_payment_method,
        v_folio_reference_number
    FROM checkin_guest_folio_master cgfm
    WHERE cgfm.checkin_id = p_checkin_id
    ORDER BY cgfm.folio_id DESC
    LIMIT 1
    FOR UPDATE;

    IF v_folio_reference_number IS NULL THEN
        SET v_folio_reference_number = CONCAT('CHK-', p_checkin_id);
    END IF;

    -- =====================================================================
    -- 8. CALCULATE PER-DAY ROOM CHARGES (BASE AND TAX)
    -- =====================================================================
    SET v_discount_amt = (v_room_tariff * v_discount_percent) / 100;
    SET v_room_price_after_discount = v_room_tariff - v_discount_amt;

    SET v_cgst_amt = 0;
    SET v_sgst_amt = 0;
    SET v_igst_amt = 0;
    
    IF v_igst_percent > 0 THEN
        SET v_igst_amt = (v_room_price_after_discount * v_igst_percent) / 100;
    ELSE
        SET v_cgst_amt = (v_room_price_after_discount * v_cgst_percent) / 100;
        SET v_sgst_amt = (v_room_price_after_discount * v_sgst_percent) / 100;
    END IF;
    
    SET v_gst_amount = v_igst_amt + v_cgst_amt + v_sgst_amt;
    SET v_cess_amt = (v_room_price_after_discount * v_cess_percent) / 100;
    SET v_service_charge_amt = (v_room_price_after_discount * v_service_charge) / 100;
    SET v_tax_amount = v_gst_amount + v_cess_amt + v_service_charge_amt;
    
    IF v_igst_percent > 0 THEN
        SET v_total_tax_percent = v_igst_percent;
    ELSE
        SET v_total_tax_percent = v_cgst_percent + v_sgst_percent;
    END IF;

    -- =====================================================================
    -- 9. CALCULATE EXTRA CHARGES: BASE + TAX (using original percentages)
    -- =====================================================================
    SET v_base_ex_pax_total = 0;
    SET v_base_child_total = 0;
    SET v_base_driver_total = 0;
    SET v_ex_cgst_amt = 0;
    SET v_ex_sgst_amt = 0;
    SET v_ex_igst_amt = 0;
    SET v_child_cgst_amt = 0;
    SET v_child_sgst_amt = 0;
    SET v_child_igst_amt = 0;
    SET v_driver_cgst_amt = 0;
    SET v_driver_sgst_amt = 0;
    SET v_driver_igst_amt = 0;

    IF v_detail_no_of_days > 0 THEN
        IF v_detail_ex_pax > 0 AND v_detail_ex_pax_charge > 0 THEN
            SET v_original_ex_pax_price_per_person = v_detail_ex_pax_charge / (v_detail_no_of_days * v_detail_ex_pax);
            SET v_base_ex_pax_per_day = v_original_ex_pax_price_per_person * v_detail_ex_pax;
            SET v_base_ex_pax_total = v_base_ex_pax_per_day * p_extension_days;
            SET v_ex_cgst_amt = (v_base_ex_pax_total * v_ex_cgst_percent) / 100;
            SET v_ex_sgst_amt = (v_base_ex_pax_total * v_ex_sgst_percent) / 100;
            SET v_ex_igst_amt = (v_base_ex_pax_total * v_ex_igst_percent) / 100;
        END IF;
        
        IF v_detail_child_unpaid > 0 AND v_detail_child_paid_amount > 0 THEN
            SET v_original_child_price_per_child = v_detail_child_paid_amount / (v_detail_no_of_days * v_detail_child_unpaid);
            SET v_base_child_per_day = v_original_child_price_per_child * v_detail_child_unpaid;
            SET v_base_child_total = v_base_child_per_day * p_extension_days;
            SET v_child_cgst_amt = (v_base_child_total * v_child_cgst_percent) / 100;
            SET v_child_sgst_amt = (v_base_child_total * v_child_sgst_percent) / 100;
            SET v_child_igst_amt = (v_base_child_total * v_child_igst_percent) / 100;
        END IF;
        
        IF v_detail_driver > 0 AND v_detail_driver_charge > 0 THEN
            SET v_original_driver_price_per_driver = v_detail_driver_charge / (v_detail_no_of_days * v_detail_driver);
            SET v_base_driver_per_day = v_original_driver_price_per_driver * v_detail_driver;
            SET v_base_driver_total = v_base_driver_per_day * p_extension_days;
            SET v_driver_cgst_amt = (v_base_driver_total * v_driver_cgst_percent) / 100;
            SET v_driver_sgst_amt = (v_base_driver_total * v_driver_sgst_percent) / 100;
            SET v_driver_igst_amt = (v_base_driver_total * v_driver_igst_percent) / 100;
        END IF;
    END IF;

    -- Daily totals (including tax) for extension amount calculation
    SET v_daily_room_total = v_room_price_after_discount + v_tax_amount;
    SET v_daily_ex_pax_total = v_base_ex_pax_per_day + (v_ex_cgst_amt + v_ex_sgst_amt + v_ex_igst_amt) / p_extension_days;
    SET v_daily_child_total = v_base_child_per_day + (v_child_cgst_amt + v_child_sgst_amt + v_child_igst_amt) / p_extension_days;
    SET v_daily_driver_total = v_base_driver_per_day + (v_driver_cgst_amt + v_driver_sgst_amt + v_driver_igst_amt) / p_extension_days;
    SET v_daily_rate = v_daily_room_total + v_daily_ex_pax_total + v_daily_child_total + v_daily_driver_total;

    -- =====================================================================
    -- 10. CALCULATE EXTENSION AMOUNT AND NEW CHECKOUT DATE
    -- =====================================================================
    SET v_extension_amount = v_daily_rate * p_extension_days;
    SET v_current_checkout_date = COALESCE(v_detail_checkout_datetime, v_current_checkout_date);
    SET v_new_checkout_date = DATE_ADD(v_current_checkout_date, INTERVAL p_extension_days DAY);

    -- =====================================================================
    -- 11. MARK CURRENT DETAIL AS MERGED
    -- =====================================================================
    UPDATE checkin_detail_master 
    SET is_checkout = 0, 
        merged = 1, 
        updated_by_id = p_user_id, 
        updated_date = v_now
    WHERE detail_id = v_detail_id 
      AND checkin_id = p_checkin_id;

    -- =====================================================================
    -- 12. INSERT NEW DETAIL RECORD WITH ALL FIELDS
    -- =====================================================================
    INSERT INTO checkin_detail_master (
        checkin_id, hotelid, guest_id, room_id, room_number,
        room_category_id, room_category_name, converted_category_id,
        converted_category_name,
        checkin_datetime, checkout_datetime,
        no_of_days, adults, pax, ex_pax, child_paid, child_unpaid, driver,
        room_tariff, ex_pax_charge, child_paid_amount, driver_charge,
        discount_percent, discount_amount,
        tax_percen_room,                -- <-- ADDED
        cgst_percent, cgst_amount, sgst_percent, sgst_amount,
        igst_percent, igst_amount, cess_percent, cess_amount,
        service_charge, service_charge_amount, tax,
        -- missing columns
        guest_name, address, mobile,
        company_id, company_name, emailed,
        -- extra-charge tax percentages and amounts
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
        -- parent and flags
        parent_detail_id, is_checkout, merged, is_settle,
        created_by_id, created_date, updated_by_id, updated_date
    ) VALUES (
        p_checkin_id, v_hotelid, v_guest_id, p_room_id, v_room_number,
        v_room_category_id, v_room_category_name, v_converted_category_id,
        v_converted_category_name,
        v_current_checkout_date, v_new_checkout_date,
        p_extension_days, v_detail_adults, v_detail_pax,
        v_detail_ex_pax, 
        v_detail_child_paid,           -- <-- now uses original count
        v_detail_child_unpaid, 
        v_detail_driver,
        v_room_tariff, 
        v_base_ex_pax_total,            -- base, not tax-inclusive
        v_base_child_total,             -- base
        v_base_driver_total,            -- base
        v_discount_percent, v_discount_amt * p_extension_days,
        v_tax_percen_room,              -- <-- now copied
        v_cgst_percent, v_cgst_amt * p_extension_days,
        v_sgst_percent, v_sgst_amt * p_extension_days,
        v_igst_percent, v_igst_amt * p_extension_days,
        v_cess_percent, v_cess_amt * p_extension_days,
        v_service_charge, v_service_charge_amt * p_extension_days,
        -- tax column = sum of all tax components
        (v_tax_amount + 
         (v_ex_cgst_amt + v_ex_sgst_amt + v_ex_igst_amt) +
         (v_child_cgst_amt + v_child_sgst_amt + v_child_igst_amt) +
         (v_driver_cgst_amt + v_driver_sgst_amt + v_driver_igst_amt)) * p_extension_days,
        -- missing columns
        v_guest_name, v_address, v_mobile,
        v_company_id, v_company_name, v_emailed,
        v_tax_percen_ex,
        v_ex_cgst_percent, v_ex_cgst_amt,
        v_ex_sgst_percent, v_ex_sgst_amt,
        v_ex_igst_percent, v_ex_igst_amt,
        v_tax_percen_child,
        v_child_cgst_percent, v_child_cgst_amt,
        v_child_sgst_percent, v_child_sgst_amt,
        v_child_igst_percent, v_child_igst_amt,
        v_tax_percen_driver,
        v_driver_cgst_percent, v_driver_cgst_amt,
        v_driver_sgst_percent, v_driver_sgst_amt,
        v_driver_igst_percent, v_driver_igst_amt,
        v_detail_id, 0, 0, 0,
        p_user_id, v_now, p_user_id, v_now
    );

    SET v_new_detail_id = LAST_INSERT_ID();

    -- =====================================================================
    -- 13. INSERT GUEST ROOM CHARGES (ONE ROW PER EXTENSION DAY)
    -- =====================================================================
    SET v_day_index = 0;
    
    WHILE v_day_index < p_extension_days DO
        SET v_charge_checkin_date = DATE_ADD(v_current_checkout_date, INTERVAL v_day_index DAY);
        SET v_charge_checkout_date = DATE_ADD(v_current_checkout_date, INTERVAL (v_day_index + 1) DAY);
        
        -- Per-day tax amounts (base + tax)
        SET v_day_ex_pax_total = (v_base_ex_pax_per_day + 
            (v_ex_cgst_amt + v_ex_sgst_amt + v_ex_igst_amt) / p_extension_days);
        SET v_day_child_total = (v_base_child_per_day + 
            (v_child_cgst_amt + v_child_sgst_amt + v_child_igst_amt) / p_extension_days);
        SET v_day_driver_total = (v_base_driver_per_day + 
            (v_driver_cgst_amt + v_driver_sgst_amt + v_driver_igst_amt) / p_extension_days);
        SET v_day_room_total = v_room_price_after_discount + v_tax_amount;
        SET v_day_total_amount = v_day_room_total + v_day_ex_pax_total + 
                                v_day_child_total + v_day_driver_total;

        INSERT INTO checkin_guest_room_charges (
            guest_id, room_id, category_id, checkin_id,
            pax_count, pax_price, pax_tax,
            ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
            child_count, child_price, child_tax, child_tax_percent, child_total,
            driver_count, driver_price, driver_tax, driver_tax_percent, driver_total,
            total_amount, checkin_datetime, checkout_datetime,
            created_at, updated_at
        ) VALUES (
            v_guest_id, p_room_id, v_room_category_id, p_checkin_id,
            v_detail_pax, v_room_price_after_discount, v_tax_amount,
            v_detail_ex_pax, 
            v_base_ex_pax_per_day / v_detail_ex_pax,  -- price per person per day (base)
            (v_ex_cgst_amt + v_ex_sgst_amt + v_ex_igst_amt) / p_extension_days, -- total tax per day
            v_total_tax_percent, v_day_ex_pax_total,
            v_detail_child_unpaid, 
            v_base_child_per_day / v_detail_child_unpaid,
            (v_child_cgst_amt + v_child_sgst_amt + v_child_igst_amt) / p_extension_days,
            v_total_tax_percent, v_day_child_total,
            v_detail_driver,
            v_base_driver_per_day / v_detail_driver,
            (v_driver_cgst_amt + v_driver_sgst_amt + v_driver_igst_amt) / p_extension_days,
            v_total_tax_percent, v_day_driver_total,
            v_day_total_amount,
            v_charge_checkin_date, v_charge_checkout_date,
            v_now, v_now
        );

        SET v_day_index = v_day_index + 1;
    END WHILE;

    -- =====================================================================
    -- 14. UPDATE CHECKIN MASTER (TOTAL NIGHTS, TOTAL AMOUNT)
    -- =====================================================================
    SET v_old_total_nights = COALESCE(v_total_nights, 0);
    SET v_old_total_amount = COALESCE(v_total_amount, 0);
    SET v_new_total_nights = v_old_total_nights + p_extension_days;
    SET v_new_total_amount = v_old_total_amount + v_extension_amount;

    UPDATE checkin_master 
    SET total_nights = v_new_total_nights,
        total_amount = v_new_total_amount,
        updated_by_id = p_user_id,
        updated_date = v_now
    WHERE checkin_id = p_checkin_id;

    -- =====================================================================
    -- 15. INSERT NEW FOLIO ENTRY FOR EXTENSION CHARGE
    -- =====================================================================
    INSERT INTO checkin_guest_folio_master (
        checkin_id, hotel_id, detail_id, room_id, transaction_type,
        transaction_datetime, description, debit_amount, credit_amount,
        reference_number, payment_method, created_by_id, created_date
    ) VALUES (
        p_checkin_id, v_hotelid, v_new_detail_id, p_room_id, 'Room Extension',
        v_now, CONCAT('Extended ', p_extension_days, ' day(s) - Room ', v_room_number),
        v_extension_amount, 0,
        v_folio_reference_number, v_folio_payment_method, p_user_id, v_now
    );

    SET v_new_folio_id = LAST_INSERT_ID();

    -- =====================================================================
    -- 16. UPDATE ROOM STATUS (SET TO OCCUPIED – STATUS_ID = 2)
    -- =====================================================================
    UPDATE room_master 
    SET room_status_id = 2,
        updated_by_id = p_user_id,
        updated_date = v_now
    WHERE room_id = p_room_id 
      AND hotelid = v_hotelid;

    -- =====================================================================
    -- 17. SET OUTPUT PARAMETERS
    -- =====================================================================
    SET p_new_checkout_datetime = v_new_checkout_date;
    SET p_new_total_amount = v_new_total_amount;
    SET p_new_total_nights = v_new_total_nights;
    SET p_extension_amount = v_extension_amount;
    SET p_daily_rate = v_daily_rate;
    SET p_new_detail_id = v_new_detail_id;
    SET p_new_folio_id = v_new_folio_id;
    SET p_success = TRUE;
    SET p_message = CONCAT('Stay extended by ', p_extension_days, ' day(s) successfully');

    -- =====================================================================
    -- 18. COMMIT TRANSACTION
    -- =====================================================================
    COMMIT;
 
END