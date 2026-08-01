DELIMITER $$

CREATE PROCEDURE sp_change_room_category(IN p_payload JSON)
BEGIN
    -- ========================================================================
    -- 1. Declare local variables (no @session variables)
    -- ========================================================================
    -- Primary keys and flags
    DECLARE v_checkinId INT;
    DECLARE v_convertedCategory VARCHAR(255);
    DECLARE v_folioTotal DECIMAL(10,2);
    DECLARE v_currentDetail JSON;
    DECLARE v_currentCharges JSON;
    DECLARE v_currentDetailId INT;
    DECLARE v_chargesId INT;
    DECLARE v_updatedBy VARCHAR(100) DEFAULT USER();

    -- Extracted arrays (cached to avoid repeated parsing)
    DECLARE v_futureDetails JSON;
    DECLARE v_futureCharges JSON;

    -- Current detail fields (cached)
    DECLARE v_convCategoryId INT;
    DECLARE v_convCategoryName VARCHAR(255);
    DECLARE v_roomTariff DECIMAL(10,2);
    DECLARE v_cgstPercent DECIMAL(5,2);
    DECLARE v_cgstAmount DECIMAL(10,2);
    DECLARE v_sgstPercent DECIMAL(5,2);
    DECLARE v_sgstAmount DECIMAL(10,2);
    DECLARE v_igstPercent DECIMAL(5,2);
    DECLARE v_igstAmount DECIMAL(10,2);
    DECLARE v_cessPercent DECIMAL(5,2);
    DECLARE v_cessAmount DECIMAL(10,2);
    DECLARE v_tax DECIMAL(10,2);
    DECLARE v_discountAmount DECIMAL(10,2);
    DECLARE v_exPaxCharge DECIMAL(10,2);
    DECLARE v_driverCharge DECIMAL(10,2);
    DECLARE v_childPaidAmount DECIMAL(10,2);

    -- Existence / row counts
    DECLARE v_checkinExists INT DEFAULT 0;
    DECLARE v_detailExists INT DEFAULT 0;
    DECLARE v_chargesExists INT DEFAULT 0;

    -- Update counts (for response)
    DECLARE v_checkinUpdated INT DEFAULT 0;
    DECLARE v_detailUpdated INT DEFAULT 0;
    DECLARE v_chargesUpdated INT DEFAULT 0;
    DECLARE v_futureDetailsUpdated INT DEFAULT 0;
    DECLARE v_futureChargesUpdated INT DEFAULT 0;
    DECLARE v_folioUpdated INT DEFAULT 0;

    -- ========================================================================
    -- 2. Error handler – rolls back on any SQL exception
    -- ========================================================================
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- ========================================================================
    -- 3. Start transaction and lock the checkin master row
    -- ========================================================================
    START TRANSACTION;

    -- ========================================================================
    -- 4. Extract mandatory top‑level fields
    -- ========================================================================
    SET v_checkinId          = JSON_UNQUOTE(JSON_EXTRACT(p_payload, '$.checkinId'));
    SET v_convertedCategory  = JSON_UNQUOTE(JSON_EXTRACT(p_payload, '$.convertedCategory'));
    SET v_folioTotal         = JSON_UNQUOTE(JSON_EXTRACT(p_payload, '$.folioTotalAmount'));
    SET v_currentDetail      = JSON_EXTRACT(p_payload, '$.currentDetail');
    SET v_currentCharges     = JSON_EXTRACT(p_payload, '$.currentCharges');
    SET v_futureDetails      = JSON_EXTRACT(p_payload, '$.futureDetails');
    SET v_futureCharges      = JSON_EXTRACT(p_payload, '$.futureCharges');

    -- Validate mandatory presence
    IF v_checkinId IS NULL OR v_convertedCategory IS NULL OR v_currentDetail IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Missing required fields: checkinId, convertedCategory, or currentDetail';
    END IF;

    -- ========================================================================
    -- 5. Validate and lock checkin_master (with existence & business rules)
    -- ========================================================================
    SELECT checkin_id, status, hotelid
    INTO @dummy_checkin, @checkin_status, @hotelid
    FROM checkin_master
    WHERE checkin_id = v_checkinId
    FOR UPDATE;

    IF @dummy_checkin IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'checkin_id does not exist';
    END IF;

    -- Example business rule: prevent changes if checkin is already settled/checked out
    IF @checkin_status IN ('SETTLED', 'CHECKED_OUT') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot change category for a settled or checked‑out checkin';
    END IF;

    -- Optionally verify hotelid with the payload (if sent) to prevent cross‑hotel updates.

    SET v_checkinExists = 1; -- mark that we have a valid checkin

    -- ========================================================================
    -- 6. Validate currentDetail.detailId and its existence + lock the row
    -- ========================================================================
    SET v_currentDetailId = JSON_UNQUOTE(JSON_EXTRACT(v_currentDetail, '$.detailId'));
    IF v_currentDetailId IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'currentDetail.detailId is missing or null';
    END IF;

    -- Lock and verify that the detail belongs to this checkin
    SELECT detail_id
    INTO @dummy_detail
    FROM checkin_detail
    WHERE detail_id = v_currentDetailId AND checkin_id = v_checkinId
    FOR UPDATE;

    IF @dummy_detail IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Current detail not found or does not belong to this checkin';
    END IF;

    SET v_detailExists = 1;

    -- ========================================================================
    -- 7. Validate currentCharges if provided + lock the row
    -- ========================================================================
    IF v_currentCharges IS NOT NULL AND JSON_TYPE(v_currentCharges) = 'OBJECT' THEN
        SET v_chargesId = JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.chargesId'));
        IF v_chargesId IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'currentCharges.chargesId is missing or null';
        END IF;

        SELECT guest_room_charges_id
        INTO @dummy_charges
        FROM checkin_guest_room_charges
        WHERE guest_room_charges_id = v_chargesId AND checkin_id = v_checkinId
        FOR UPDATE;

        IF @dummy_charges IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Current charges record not found or does not belong to this checkin';
        END IF;

        SET v_chargesExists = 1;
    END IF;

    -- ========================================================================
    -- 8. Extract all fields from currentDetail into local variables (once)
    -- ========================================================================
    SET v_convCategoryId   = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentDetail, '$.convertedCategoryId')) AS UNSIGNED);
    SET v_convCategoryName = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentDetail, '$.convertedCategoryName')) AS CHAR(255));
    SET v_roomTariff       = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentDetail, '$.roomTariff')) AS DECIMAL(10,2));
    SET v_cgstPercent      = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentDetail, '$.cgstPercent')) AS DECIMAL(5,2));
    SET v_cgstAmount       = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentDetail, '$.cgstAmount')) AS DECIMAL(10,2));
    SET v_sgstPercent      = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentDetail, '$.sgstPercent')) AS DECIMAL(5,2));
    SET v_sgstAmount       = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentDetail, '$.sgstAmount')) AS DECIMAL(10,2));
    SET v_igstPercent      = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentDetail, '$.igstPercent')) AS DECIMAL(5,2));
    SET v_igstAmount       = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentDetail, '$.igstAmount')) AS DECIMAL(10,2));
    SET v_cessPercent      = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentDetail, '$.cessPercent')) AS DECIMAL(5,2));
    SET v_cessAmount       = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentDetail, '$.cessAmount')) AS DECIMAL(10,2));
    SET v_tax              = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentDetail, '$.tax')) AS DECIMAL(10,2));
    SET v_discountAmount   = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentDetail, '$.discountAmount')) AS DECIMAL(10,2));
    SET v_exPaxCharge      = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentDetail, '$.exPaxCharge')) AS DECIMAL(10,2));
    SET v_driverCharge     = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentDetail, '$.driverCharge')) AS DECIMAL(10,2));
    SET v_childPaidAmount  = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentDetail, '$.childPaidAmount')) AS DECIMAL(10,2));

    -- ========================================================================
    -- 9. Update checkin_master (now we know the row exists)
    -- ========================================================================
    UPDATE checkin_master
    SET converted_category = v_convertedCategory,
        updated_at = NOW(),
        updated_by = v_updatedBy
    WHERE checkin_id = v_checkinId;

    SET v_checkinUpdated = ROW_COUNT();
    -- No error if 0 rows changed; it's fine if value was already the same.

    -- ========================================================================
    -- 10. Update the current checkin_detail (row existence already verified)
    -- ========================================================================
    UPDATE checkin_detail
    SET
        converted_category_id = v_convCategoryId,
        converted_category_name = v_convCategoryName,
        room_tariff = v_roomTariff,
        cgst_percent = v_cgstPercent,
        cgst_amount = v_cgstAmount,
        sgst_percent = v_sgstPercent,
        sgst_amount = v_sgstAmount,
        igst_percent = v_igstPercent,
        igst_amount = v_igstAmount,
        cess_percent = v_cessPercent,
        cess_amount = v_cessAmount,
        tax = v_tax,
        discount_amount = v_discountAmount,
        ex_pax_charge = v_exPaxCharge,
        driver_charge = v_driverCharge,
        child_paid_amount = v_childPaidAmount,
        updated_at = NOW(),
        updated_by = v_updatedBy
    WHERE detail_id = v_currentDetailId AND checkin_id = v_checkinId;

    SET v_detailUpdated = ROW_COUNT();
    -- If no rows changed, it's acceptable.

    -- ========================================================================
    -- 11. Update current checkin_guest_room_charges (if provided and exists)
    -- ========================================================================
    IF v_chargesExists = 1 THEN
        UPDATE checkin_guest_room_charges
        SET
            guest_id = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.guestId')) AS UNSIGNED),
            room_id = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.roomId')) AS UNSIGNED),
            checkin_id = v_checkinId,
            detail_checkin_datetime = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.detailCheckinDatetime')) AS DATETIME),
            detail_checkout_datetime = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.detailCheckoutDatetime')) AS DATETIME),
            category_id = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.categoryId')) AS UNSIGNED),
            pax_price = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.paxPrice')) AS DECIMAL(10,2)),
            pax_tax = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.paxTax')) AS DECIMAL(10,2)),
            ex_pax_price = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.exPaxPrice')) AS DECIMAL(10,2)),
            ex_pax_tax = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.exPaxTax')) AS DECIMAL(10,2)),
            ex_pax_tax_percent = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.exPaxTaxPercent')) AS DECIMAL(5,2)),
            ex_pax_total = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.exPaxTotal')) AS DECIMAL(10,2)),
            child_price = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.childPrice')) AS DECIMAL(10,2)),
            child_tax = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.childTax')) AS DECIMAL(10,2)),
            child_tax_percent = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.childTaxPercent')) AS DECIMAL(5,2)),
            child_total = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.childTotal')) AS DECIMAL(10,2)),
            driver_price = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.driverPrice')) AS DECIMAL(10,2)),
            driver_tax = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.driverTax')) AS DECIMAL(10,2)),
            driver_tax_percent = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.driverTaxPercent')) AS DECIMAL(5,2)),
            driver_total = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.driverTotal')) AS DECIMAL(10,2)),
            total_amount = CAST(JSON_UNQUOTE(JSON_EXTRACT(v_currentCharges, '$.totalAmount')) AS DECIMAL(10,2)),
            updated_at = NOW(),
            updated_by = v_updatedBy
        WHERE guest_room_charges_id = v_chargesId AND checkin_id = v_checkinId;

        SET v_chargesUpdated = ROW_COUNT();
    END IF;

    -- ========================================================================
    -- 12. Bulk update future checkin_detail (using cached JSON array)
    --     Only if array is not null and is of type ARRAY and has elements.
    -- ========================================================================
    IF v_futureDetails IS NOT NULL AND JSON_TYPE(v_futureDetails) = 'ARRAY' AND JSON_LENGTH(v_futureDetails) > 0 THEN
        UPDATE checkin_detail cd
        JOIN JSON_TABLE(
            v_futureDetails,
            '$[*]' COLUMNS(
                detail_id INT PATH '$.detailId',
                converted_category_id INT PATH '$.convertedCategoryId',
                converted_category_name VARCHAR(255) PATH '$.convertedCategoryName',
                room_tariff DECIMAL(10,2) PATH '$.roomTariff',
                cgst_percent DECIMAL(5,2) PATH '$.cgstPercent',
                cgst_amount DECIMAL(10,2) PATH '$.cgstAmount',
                sgst_percent DECIMAL(5,2) PATH '$.sgstPercent',
                sgst_amount DECIMAL(10,2) PATH '$.sgstAmount',
                igst_percent DECIMAL(5,2) PATH '$.igstPercent',
                igst_amount DECIMAL(10,2) PATH '$.igstAmount',
                cess_percent DECIMAL(5,2) PATH '$.cessPercent',
                cess_amount DECIMAL(10,2) PATH '$.cessAmount',
                tax DECIMAL(10,2) PATH '$.tax',
                discount_amount DECIMAL(10,2) PATH '$.discountAmount',
                ex_pax_charge DECIMAL(10,2) PATH '$.exPaxCharge',
                driver_charge DECIMAL(10,2) PATH '$.driverCharge',
                child_paid_amount DECIMAL(10,2) PATH '$.childPaidAmount'
            )
        ) AS ft ON cd.detail_id = ft.detail_id
        SET
            cd.converted_category_id = ft.converted_category_id,
            cd.converted_category_name = ft.converted_category_name,
            cd.room_tariff = ft.room_tariff,
            cd.cgst_percent = ft.cgst_percent,
            cd.cgst_amount = ft.cgst_amount,
            cd.sgst_percent = ft.sgst_percent,
            cd.sgst_amount = ft.sgst_amount,
            cd.igst_percent = ft.igst_percent,
            cd.igst_amount = ft.igst_amount,
            cd.cess_percent = ft.cess_percent,
            cd.cess_amount = ft.cess_amount,
            cd.tax = ft.tax,
            cd.discount_amount = ft.discount_amount,
            cd.ex_pax_charge = ft.ex_pax_charge,
            cd.driver_charge = ft.driver_charge,
            cd.child_paid_amount = ft.child_paid_amount,
            cd.updated_at = NOW(),
            cd.updated_by = v_updatedBy
        WHERE cd.detail_id != v_currentDetailId   -- skip current detail
          AND cd.checkin_id = v_checkinId;

        SET v_futureDetailsUpdated = ROW_COUNT();
    END IF;

    -- ========================================================================
    -- 13. Bulk update future checkin_guest_room_charges (cached array)
    -- ========================================================================
    IF v_futureCharges IS NOT NULL AND JSON_TYPE(v_futureCharges) = 'ARRAY' AND JSON_LENGTH(v_futureCharges) > 0 THEN
        UPDATE checkin_guest_room_charges cgrc
        JOIN JSON_TABLE(
            v_futureCharges,
            '$[*]' COLUMNS(
                charges_id INT PATH '$.chargesId',
                guest_id INT PATH '$.guestId',
                room_id INT PATH '$.roomId',
                detail_checkin_datetime DATETIME PATH '$.detailCheckinDatetime',
                detail_checkout_datetime DATETIME PATH '$.detailCheckoutDatetime',
                category_id INT PATH '$.categoryId',
                pax_price DECIMAL(10,2) PATH '$.paxPrice',
                pax_tax DECIMAL(10,2) PATH '$.paxTax',
                ex_pax_price DECIMAL(10,2) PATH '$.exPaxPrice',
                ex_pax_tax DECIMAL(10,2) PATH '$.exPaxTax',
                ex_pax_tax_percent DECIMAL(5,2) PATH '$.exPaxTaxPercent',
                ex_pax_total DECIMAL(10,2) PATH '$.exPaxTotal',
                child_price DECIMAL(10,2) PATH '$.childPrice',
                child_tax DECIMAL(10,2) PATH '$.childTax',
                child_tax_percent DECIMAL(5,2) PATH '$.childTaxPercent',
                child_total DECIMAL(10,2) PATH '$.childTotal',
                driver_price DECIMAL(10,2) PATH '$.driverPrice',
                driver_tax DECIMAL(10,2) PATH '$.driverTax',
                driver_tax_percent DECIMAL(5,2) PATH '$.driverTaxPercent',
                driver_total DECIMAL(10,2) PATH '$.driverTotal',
                total_amount DECIMAL(10,2) PATH '$.totalAmount'
            )
        ) AS fch ON cgrc.guest_room_charges_id = fch.charges_id
        SET
            cgrc.guest_id = fch.guest_id,
            cgrc.room_id = fch.room_id,
            cgrc.checkin_id = v_checkinId,
            cgrc.detail_checkin_datetime = fch.detail_checkin_datetime,
            cgrc.detail_checkout_datetime = fch.detail_checkout_datetime,
            cgrc.category_id = fch.category_id,
            cgrc.pax_price = fch.pax_price,
            cgrc.pax_tax = fch.pax_tax,
            cgrc.ex_pax_price = fch.ex_pax_price,
            cgrc.ex_pax_tax = fch.ex_pax_tax,
            cgrc.ex_pax_tax_percent = fch.ex_pax_tax_percent,
            cgrc.ex_pax_total = fch.ex_pax_total,
            cgrc.child_price = fch.child_price,
            cgrc.child_tax = fch.child_tax,
            cgrc.child_tax_percent = fch.child_tax_percent,
            cgrc.child_total = fch.child_total,
            cgrc.driver_price = fch.driver_price,
            cgrc.driver_tax = fch.driver_tax,
            cgrc.driver_tax_percent = fch.driver_tax_percent,
            cgrc.driver_total = fch.driver_total,
            cgrc.total_amount = fch.total_amount,
            cgrc.updated_at = NOW(),
            cgrc.updated_by = v_updatedBy
        WHERE cgrc.checkin_id = v_checkinId;

        SET v_futureChargesUpdated = ROW_COUNT();
    END IF;

    -- ========================================================================
    -- 14. Update guest folio (replicates updateRoomChargeFolio logic)
    --     Adjust table/column names to your actual schema.
    -- ========================================================================
    -- First, verify that the folio record exists (it should)
    SELECT COUNT(*) INTO @folioExists
    FROM checkin_guest_folio_master
    WHERE checkin_id = v_checkinId AND detail_id = v_currentDetailId;

    IF @folioExists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Folio record not found for this detail';
    END IF;

    UPDATE checkin_guest_folio_master
    SET
        room_charge = v_folioTotal,   -- adjust column name
        total = v_folioTotal,         -- adjust if separate total column
        updated_at = NOW(),
        updated_by = v_updatedBy
    WHERE checkin_id = v_checkinId
      AND detail_id = v_currentDetailId;

    SET v_folioUpdated = ROW_COUNT();
    -- No error if 0 rows changed (values already the same).

    -- ========================================================================
    -- 15. (Optional) Insert audit log – commented out; enable if needed.
    -- ========================================================================
    /*
    INSERT INTO audit_log (
        table_name, record_id, action, old_value, new_value, changed_by, changed_at
    ) VALUES
        ('checkin_master', v_checkinId, 'UPDATE', NULL, v_convertedCategory, v_updatedBy, NOW());
    */

    -- ========================================================================
    -- 16. Commit the transaction
    -- ========================================================================
    COMMIT;

    -- ========================================================================
    -- 17. Return detailed JSON response with row counts
    -- ========================================================================
    SELECT JSON_OBJECT(
        'success', 1,
        'message', 'Room category changed successfully',
        'updatedRows', JSON_OBJECT(
            'checkin_master', v_checkinUpdated,
            'current_detail', v_detailUpdated,
            'current_charges', v_chargesUpdated,
            'future_details', v_futureDetailsUpdated,
            'future_charges', v_futureChargesUpdated,
            'folio', v_folioUpdated
        )
    ) AS response;

END$$

DELIMITER ;