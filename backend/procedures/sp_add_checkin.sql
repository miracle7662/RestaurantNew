CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkout_bill`(
    IN p_checkout_id INT
)
BEGIN

    /* ==========================================================
       RESULT SET 1 : HEADER
    ========================================================== */

    WITH guest_info AS (
        SELECT 
            cm.checkout_id,
            MAX(cdm.guest_name) AS guest_name,
            MAX(cdm.mobile) AS mobile,
            MAX(cdm.address) AS address,
            MAX(cdm.emailed) AS emailed,
            MAX(comp.company_name) AS company_name,
            MAX(comp.gst_no) AS gst_no
            
        FROM checkout_master cm
        LEFT JOIN checkout_detail cdm ON cdm.checkin_id = cm.checkin_id
        LEFT JOIN company_master comp ON comp.company_id = cdm.company_id
        WHERE cm.checkout_id = p_checkout_id
        GROUP BY cm.checkout_id
    ),
    cd_totals AS (
        SELECT
            checkout_id,
            COALESCE(SUM(adults), 0) AS adults,
            COALESCE(SUM(pax), 0)    AS pax,
            COALESCE(SUM(ex_pax), 0) AS ex_pax
        FROM checkout_detail
        WHERE checkout_id = p_checkout_id AND is_checkout = 1
        GROUP BY checkout_id
    )
    SELECT
        hm.hotel_name,
        hm.address AS hotel_address,
        hm.phone,
        hm.trn_gstno,

        cm.checkout_id,
        cm.checkin_id,
        cm.reg_no,
        cm.ldg_bill_no,

        cm.booking,
        cm.plan_name,

        cm.checkin_datetime AS checkin_datetimecm,
        cm.checkout_date AS checkout_datetimecm,

        cm.checked_out_rooms AS room_no,

        COALESCE(ct.adults, 0) AS adults,
        COALESCE(ct.pax, 0)    AS pax,
        COALESCE(ct.ex_pax, 0) AS ex_pax,

        cm.total_nights,

        COALESCE(cm.payment_method, 'Cash') AS payment_mode,

        ROUND(IFNULL(cm.total_amount, 0), 2) AS total_amount,
        ROUND(
            IFNULL(cm.total_amount, 0)
            - IFNULL(cm.tot_discount_amount, 0)
            - IFNULL(cm.tot_advance, 0)
        , 2) AS net_payable,

        ROUND(IFNULL(cm.tot_discount_amount, 0), 2) AS discount_amount,
        ROUND(IFNULL(cm.tot_advance, 0), 2)         AS advance_amt,

        0 AS post_changes_amt,
        0 AS allowances_amt,
        0 AS round_off_amount,

        ROUND(IFNULL(cm.tot_cgst_amount, 0), 2)     AS cgst_amt,
        ROUND(IFNULL(cm.tot_sgst_amount, 0), 2)     AS sgst_amt,
        ROUND(IFNULL(cm.tot_igst_amount, 0), 2)     AS igst_amt,
        ROUND(IFNULL(cm.tot_cess_amount, 0), 2)     AS cess_amt,
        ROUND(IFNULL(cm.tot_service_charge_amount, 0), 2) AS service_charge_amt,

        gi.guest_name,
        gi.mobile AS guest_mobile,
        gi.address AS guest_address,
        gi.emailed AS guest_email,
        gi.company_name,
        gi.gst_no,
        NULL AS id_type,
        NULL AS id_number

    FROM checkout_master cm
    LEFT JOIN msthotelmasters hm ON hm.hotelid = cm.hotelid
    LEFT JOIN guest_info gi ON gi.checkout_id = cm.checkout_id
    LEFT JOIN cd_totals ct ON ct.checkout_id = cm.checkout_id
    WHERE cm.checkout_id = p_checkout_id;


    /* ==========================================================
       RESULT SET 2 : BILL DETAILS
       ========================================================== */

    WITH guest_name_cte AS (
        SELECT COALESCE(
            (SELECT guest_name FROM checkout_detail 
             WHERE checkout_id = p_checkout_id AND is_checkout = 1 LIMIT 1),
            (SELECT cdm.guest_name FROM checkout_master cm 
             JOIN checkin_detail_master cdm ON cdm.checkin_id = cm.checkin_id 
             WHERE cm.checkout_id = p_checkout_id LIMIT 1)
        ) AS guest_name
    ),
    -- Get room extension amounts grouped by room and date
    room_extensions AS (
        SELECT
            cf.room_id,
            DATE(cf.transaction_datetime) AS extension_date,
            SUM(cf.debit_amount) AS total_extension_amount
        FROM checkout_folio_master cf
        WHERE cf.checkout_id = p_checkout_id
          AND UPPER(TRIM(cf.transaction_type)) = 'ROOM EXTENSION'
        GROUP BY cf.room_id, DATE(cf.transaction_datetime)
    ),
    -- Get the latest checkout_detail record per room
    latest_checkout_detail AS (
        SELECT 
            cd1.*
        FROM checkout_detail cd1
        INNER JOIN (
            SELECT 
                checkout_id,
                room_id,
                MAX(checkin_datetime) AS latest_checkin_datetime
            FROM checkout_detail
            WHERE checkout_id = p_checkout_id AND is_checkout = 1
            GROUP BY checkout_id, room_id
        ) cd2 ON cd1.checkout_id = cd2.checkout_id 
            AND cd1.room_id = cd2.room_id 
            AND cd1.checkin_datetime = cd2.latest_checkin_datetime
        WHERE cd1.checkout_id = p_checkout_id AND cd1.is_checkout = 1
    )
    SELECT
        x.room_number,
        x.bill_date,

        ROUND(SUM(x.tariff), 2) AS tariff,
        ROUND(SUM(x.ex_pax), 2) AS ex_pax,
        ROUND(SUM(x.child_paid_amount), 2) AS child_paid_amount,
        ROUND(SUM(x.driver_charge), 2) AS driver_charge,

        ROUND(SUM(x.cgst + x.ex_cgst_amount + x.child_cgst_amount + x.driver_cgst_amount), 2) AS cgst,
        ROUND(SUM(x.sgst + x.ex_sgst_amount + x.child_sgst_amount + x.driver_sgst_amount), 2) AS sgst,
        ROUND(SUM(x.igst + x.ex_igst_amount + x.child_igst_amount + x.driver_igst_amount), 2) AS igst,

        ROUND(SUM(x.food), 2) AS food,
        ROUND(SUM(x.post_charges), 2) AS post_charges,
        ROUND(SUM(x.allowance), 2) AS allowance,

        -- FIX: dtotal_amount - Allowance is subtracted, Advance is added
        ROUND(
            SUM(x.tariff) + 
            SUM(x.ex_pax) + 
            SUM(x.child_paid_amount) + 
            SUM(x.driver_charge) +
            SUM(x.cgst + x.ex_cgst_amount + x.child_cgst_amount + x.driver_cgst_amount) +
            SUM(x.sgst + x.ex_sgst_amount + x.child_sgst_amount + x.driver_sgst_amount) +
            SUM(x.igst + x.ex_igst_amount + x.child_igst_amount + x.driver_igst_amount) +
            SUM(x.food) + 
            SUM(x.post_charges) - 
            SUM(x.allowance ) - 
            SUM(x.discount_amount) +
            SUM(CASE WHEN UPPER(x.transaction_type) = 'ADVANCE ADDITION' THEN x.allowance ELSE 0 END)
        , 2) AS dtotal_amount,

        MAX(x.room_id) AS room_id,
        MAX(x.room_category_name) AS room_category_name,
        MAX(x.converted_category_name) AS converted_category_name,

        MAX(x.checkin_datetime) AS checkin_datetime,
        MAX(x.checkout_datetime) AS checkout_datetime,

        MAX(x.no_of_days) AS no_of_days,

        MAX(x.room_tariff_per_day) AS room_tariff_per_day,

        MAX(x.adults) AS adults,
        MAX(x.pax) AS pax,
        MAX(x.ex_pax_total) AS ex_pax_total,

        MAX(x.child_paid) AS child_paid,
        MAX(x.child_unpaid) AS child_unpaid,
        MAX(x.driver) AS driver,

        MAX(x.ex_cgst_percent) AS ex_cgst_percent,
        MAX(x.ex_cgst_amount) AS ex_cgst_amount,
        MAX(x.ex_sgst_percent) AS ex_sgst_percent,
        MAX(x.ex_sgst_amount) AS ex_sgst_amount,
        MAX(x.ex_igst_percent) AS ex_igst_percent,
        MAX(x.ex_igst_amount) AS ex_igst_amount,

        MAX(x.tax_percen_child) AS tax_percen_child,
        MAX(x.child_cgst_percent) AS child_cgst_percent,
        MAX(x.child_cgst_amount) AS child_cgst_amount,
        MAX(x.child_sgst_percent) AS child_sgst_percent,
        MAX(x.child_sgst_amount) AS child_sgst_amount,
        MAX(x.child_igst_percent) AS child_igst_percent,
        MAX(x.child_igst_amount) AS child_igst_amount,

        MAX(x.tax_percen_driver) AS tax_percen_driver,
        MAX(x.driver_cgst_percent) AS driver_cgst_percent,
        MAX(x.driver_cgst_amount) AS driver_cgst_amount,
        MAX(x.driver_sgst_percent) AS driver_sgst_percent,
        MAX(x.driver_sgst_amount) AS driver_sgst_amount,
        MAX(x.driver_igst_percent) AS driver_igst_percent,
        MAX(x.driver_igst_amount) AS driver_igst_amount,

        MAX(x.discount_percent) AS discount_percent,
        MAX(x.discount_amount) AS discount_amount,

        MAX(x.cgst_percent) AS cgst_percent,
        MAX(x.cgst_amount) AS cgst_amount,

        MAX(x.sgst_percent) AS sgst_percent,
        MAX(x.sgst_amount) AS sgst_amount,

        MAX(x.igst_percent) AS igst_percent,
        MAX(x.igst_amount) AS igst_amount,

        MAX(x.cess_percent) AS cess_percent,
        MAX(x.cess_amount) AS cess_amount,

        MAX(x.service_charge) AS service_charge,
        MAX(x.service_charge_amount) AS service_charge_amount,

        MAX(x.tax) AS tax,

        MAX(x.charge_id) AS charge_id,

        MAX(x.guest_name) AS guest_name,

        MAX(x.payment_mode) AS payment_mode,

        MAX(x.description) AS description,

        MAX(x.transaction_type) AS transaction_type

    FROM
    (
        -- ============================================================
        -- 1. ROOM CHARGES
        -- ============================================================
        SELECT
            cd.room_number,
            DATE(cd.checkin_datetime) AS bill_date,

            cd.room_id,
            cd.room_category_name,
            cd.converted_category_name,

            cd.checkin_datetime,
            cd.checkout_datetime,

            cd.no_of_days,

            IFNULL(cd.room_tariff, 0) AS tariff,
            IFNULL(cd.ex_pax_charge * cd.ex_pax, 0) AS ex_pax,
            IFNULL(cd.child_paid_amount * cd.child_paid, 0) AS child_paid_amount,
            IFNULL(cd.driver_charge * cd.driver, 0) AS driver_charge,

            IFNULL(cd.cgst_amount, 0) AS cgst,
            IFNULL(cd.sgst_amount, 0) AS sgst,
            IFNULL(cd.igst_amount, 0) AS igst,

            0 AS food,
            0 AS post_charges,
            0 AS allowance,

            IFNULL(cd.room_tariff, 0) AS room_tariff_per_day,

            IFNULL(cd.adults, 0) AS adults,
            IFNULL(cd.pax, 0) AS pax,
            IFNULL(cd.ex_pax, 0) AS ex_pax_total,

            IFNULL(cd.child_paid, 0) AS child_paid,
            IFNULL(cd.child_unpaid, 0) AS child_unpaid,
            IFNULL(cd.driver, 0) AS driver,

            IFNULL(cd.ex_cgst_percent, 0) AS ex_cgst_percent,
            IFNULL(cd.ex_cgst_amount, 0) AS ex_cgst_amount,
            IFNULL(cd.ex_sgst_percent, 0) AS ex_sgst_percent,
            IFNULL(cd.ex_sgst_amount, 0) AS ex_sgst_amount,
            IFNULL(cd.ex_igst_percent, 0) AS ex_igst_percent,
            IFNULL(cd.ex_igst_amount, 0) AS ex_igst_amount,

            IFNULL(cd.tax_percen_child, 0) AS tax_percen_child,
            IFNULL(cd.child_cgst_percent, 0) AS child_cgst_percent,
            IFNULL(cd.child_cgst_amount, 0) AS child_cgst_amount,
            IFNULL(cd.child_sgst_percent, 0) AS child_sgst_percent,
            IFNULL(cd.child_sgst_amount, 0) AS child_sgst_amount,
            IFNULL(cd.child_igst_percent, 0) AS child_igst_percent,
            IFNULL(cd.child_igst_amount, 0) AS child_igst_amount,

            IFNULL(cd.tax_percen_driver, 0) AS tax_percen_driver,
            IFNULL(cd.driver_cgst_percent, 0) AS driver_cgst_percent,
            IFNULL(cd.driver_cgst_amount, 0) AS driver_cgst_amount,
            IFNULL(cd.driver_sgst_percent, 0) AS driver_sgst_percent,
            IFNULL(cd.driver_sgst_amount, 0) AS driver_sgst_amount,
            IFNULL(cd.driver_igst_percent, 0) AS driver_igst_percent,
            IFNULL(cd.driver_igst_amount, 0) AS driver_igst_amount,

            IFNULL(cd.discount_percent, 0) AS discount_percent,
            IFNULL(cd.discount_amount, 0) AS discount_amount,

            IFNULL(cd.cgst_percent, 0) AS cgst_percent,
            IFNULL(cd.cgst_amount, 0) AS cgst_amount,

            IFNULL(cd.sgst_percent, 0) AS sgst_percent,
            IFNULL(cd.sgst_amount, 0) AS sgst_amount,

            IFNULL(cd.igst_percent, 0) AS igst_percent,
            IFNULL(cd.igst_amount, 0) AS igst_amount,

            IFNULL(cd.cess_percent, 0) AS cess_percent,
            IFNULL(cd.cess_amount, 0) AS cess_amount,

            IFNULL(cd.service_charge, 0) AS service_charge,
            IFNULL(cd.service_charge_amount, 0) AS service_charge_amount,

            IFNULL(cd.tax, 0) AS tax,

            cd.checkout_detail_id AS charge_id,

            COALESCE(cd.guest_name, (SELECT guest_name FROM guest_name_cte)) AS guest_name,
            (SELECT COALESCE(payment_method, 'Cash') FROM checkout_master WHERE checkout_id = p_checkout_id) AS payment_mode,

            'ROOM CHARGES' AS transaction_type,
            CONCAT('Room Charges (', cd.room_number, ')') AS description,

            COALESCE(
                (SELECT re.total_extension_amount 
                 FROM room_extensions re 
                 WHERE re.room_id = cd.room_id 
                   AND re.extension_date = DATE(cd.checkin_datetime)),
                0
            ) AS extension_amount

        FROM checkout_detail cd
        WHERE cd.checkout_id = p_checkout_id
          AND cd.is_checkout = 1

        UNION ALL

        -- ============================================================
        -- 2. FOOD
        -- ============================================================
        SELECT
            COALESCE(lcd.room_number, 'COMMON') AS room_number,
            DATE(cf.transaction_datetime) AS bill_date,

            COALESCE(lcd.room_id, 0) AS room_id,
            lcd.room_category_name,
            lcd.converted_category_name,

            cm.checkin_datetime,
            cm.checkout_date AS checkout_datetime,

            1 AS no_of_days,

            0 AS tariff,
            0 AS ex_pax,
            0 AS child_paid_amount,
            0 AS driver_charge,

            0 AS cgst,
            0 AS sgst,
            0 AS igst,

            IFNULL(cf.debit_amount, 0) AS food,
            0 AS post_charges,
            0 AS allowance,

            0 AS room_tariff_per_day,

            0 AS adults,
            0 AS pax,
            0 AS ex_pax_total,

            0 AS child_paid,
            0 AS child_unpaid,
            0 AS driver,

            0 AS ex_cgst_percent,
            0 AS ex_cgst_amount,
            0 AS ex_sgst_percent,
            0 AS ex_sgst_amount,
            0 AS ex_igst_percent,
            0 AS ex_igst_amount,

            0 AS tax_percen_child,
            0 AS child_cgst_percent,
            0 AS child_cgst_amount,
            0 AS child_sgst_percent,
            0 AS child_sgst_amount,
            0 AS child_igst_percent,
            0 AS child_igst_amount,

            0 AS tax_percen_driver,
            0 AS driver_cgst_percent,
            0 AS driver_cgst_amount,
            0 AS driver_sgst_percent,
            0 AS driver_sgst_amount,
            0 AS driver_igst_percent,
            0 AS driver_igst_amount,

            0 AS discount_percent,
            0 AS discount_amount,

            0 AS cgst_percent,
            0 AS cgst_amount,
            0 AS sgst_percent,
            0 AS sgst_amount,
            0 AS igst_percent,
            0 AS igst_amount,

            0 AS cess_percent,
            0 AS cess_amount,

            0 AS service_charge,
            0 AS service_charge_amount,

            0 AS tax,

            cf.folio_id AS charge_id,

            (SELECT guest_name FROM guest_name_cte) AS guest_name,
            (SELECT COALESCE(payment_method, 'Cash') FROM checkout_master WHERE checkout_id = p_checkout_id) AS payment_mode,

            'FOOD' AS transaction_type,

            CASE
                WHEN IFNULL(cf.description, '') <> '' THEN cf.description
                ELSE 'Food Charges'
            END AS description,

            0 AS extension_amount

        FROM checkout_folio_master cf
        LEFT JOIN latest_checkout_detail lcd ON lcd.checkout_id = cf.checkout_id AND lcd.room_id = cf.room_id
        INNER JOIN checkout_master cm ON cm.checkout_id = cf.checkout_id
        WHERE cf.checkout_id = p_checkout_id
          AND UPPER(TRIM(cf.transaction_type)) = 'FOOD'

        UNION ALL

        -- ============================================================
        -- 3. POST CHARGES (CHARGE)
        -- ============================================================
        SELECT
            COALESCE(lcd.room_number, 'COMMON') AS room_number,
            DATE(cf.transaction_datetime) AS bill_date,

            COALESCE(lcd.room_id, 0) AS room_id,
            lcd.room_category_name,
            lcd.converted_category_name,

            cm.checkin_datetime,
            cm.checkout_date AS checkout_datetime,

            1 AS no_of_days,

            0 AS tariff,
            0 AS ex_pax,
            0 AS child_paid_amount,
            0 AS driver_charge,

            0 AS cgst,
            0 AS sgst,
            0 AS igst,

            0 AS food,
            IFNULL(cf.debit_amount, 0) AS post_charges,
            0 AS allowance,

            0 AS room_tariff_per_day,

            0 AS adults,
            0 AS pax,
            0 AS ex_pax_total,

            0 AS child_paid,
            0 AS child_unpaid,
            0 AS driver,

            0 AS ex_cgst_percent,
            0 AS ex_cgst_amount,
            0 AS ex_sgst_percent,
            0 AS ex_sgst_amount,
            0 AS ex_igst_percent,
            0 AS ex_igst_amount,

            0 AS tax_percen_child,
            0 AS child_cgst_percent,
            0 AS child_cgst_amount,
            0 AS child_sgst_percent,
            0 AS child_sgst_amount,
            0 AS child_igst_percent,
            0 AS child_igst_amount,

            0 AS tax_percen_driver,
            0 AS driver_cgst_percent,
            0 AS driver_cgst_amount,
            0 AS driver_sgst_percent,
            0 AS driver_sgst_amount,
            0 AS driver_igst_percent,
            0 AS driver_igst_amount,

            0 AS discount_percent,
            0 AS discount_amount,

            0 AS cgst_percent,
            0 AS cgst_amount,
            0 AS sgst_percent,
            0 AS sgst_amount,
            0 AS igst_percent,
            0 AS igst_amount,

            0 AS cess_percent,
            0 AS cess_amount,

            0 AS service_charge,
            0 AS service_charge_amount,

            0 AS tax,

            cf.folio_id AS charge_id,

            (SELECT guest_name FROM guest_name_cte) AS guest_name,
            (SELECT COALESCE(payment_method, 'Cash') FROM checkout_master WHERE checkout_id = p_checkout_id) AS payment_mode,

            'CHARGE' AS transaction_type,

            CASE
                WHEN IFNULL(cf.description, '') <> '' THEN cf.description
                ELSE 'Post Charges'
            END AS description,

            0 AS extension_amount

        FROM checkout_folio_master cf
        LEFT JOIN latest_checkout_detail lcd ON lcd.checkout_id = cf.checkout_id AND (lcd.room_id = cf.room_id OR cf.room_id IS NULL)
        INNER JOIN checkout_master cm ON cm.checkout_id = cf.checkout_id
        WHERE cf.checkout_id = p_checkout_id
          AND UPPER(TRIM(cf.transaction_type)) = 'CHARGE'

        UNION ALL

        -- ============================================================
        -- 4. ALLOWANCE
        -- ============================================================
        SELECT
            COALESCE(lcd.room_number, 'COMMON') AS room_number,
            DATE(cf.transaction_datetime) AS bill_date,

            COALESCE(lcd.room_id, 0) AS room_id,
            lcd.room_category_name,
            lcd.converted_category_name,

            cm.checkin_datetime,
            cm.checkout_date AS checkout_datetime,

            1 AS no_of_days,

            0 AS tariff,
            0 AS ex_pax,
            0 AS child_paid_amount,
            0 AS driver_charge,

            0 AS cgst,
            0 AS sgst,
            0 AS igst,

            0 AS food,
            0 AS post_charges,

            IFNULL(cf.credit_amount, 0) AS allowance,

            0 AS room_tariff_per_day,

            0 AS adults,
            0 AS pax,
            0 AS ex_pax_total,

            0 AS child_paid,
            0 AS child_unpaid,
            0 AS driver,

            0 AS ex_cgst_percent,
            0 AS ex_cgst_amount,
            0 AS ex_sgst_percent,
            0 AS ex_sgst_amount,
            0 AS ex_igst_percent,
            0 AS ex_igst_amount,

            0 AS tax_percen_child,
            0 AS child_cgst_percent,
            0 AS child_cgst_amount,
            0 AS child_sgst_percent,
            0 AS child_sgst_amount,
            0 AS child_igst_percent,
            0 AS child_igst_amount,

            0 AS tax_percen_driver,
            0 AS driver_cgst_percent,
            0 AS driver_cgst_amount,
            0 AS driver_sgst_percent,
            0 AS driver_sgst_amount,
            0 AS driver_igst_percent,
            0 AS driver_igst_amount,

            0 AS discount_percent,
            0 AS discount_amount,

            0 AS cgst_percent,
            0 AS cgst_amount,
            0 AS sgst_percent,
            0 AS sgst_amount,
            0 AS igst_percent,
            0 AS igst_amount,

            0 AS cess_percent,
            0 AS cess_amount,

            0 AS service_charge,
            0 AS service_charge_amount,

            0 AS tax,

            cf.folio_id AS charge_id,

            (SELECT guest_name FROM guest_name_cte) AS guest_name,
            (SELECT COALESCE(payment_method, 'Cash') FROM checkout_master WHERE checkout_id = p_checkout_id) AS payment_mode,

            'ALLOWANCE' AS transaction_type,

            CASE
                WHEN IFNULL(cf.description, '') <> '' THEN cf.description
                ELSE 'Allowance'
            END AS description,

            0 AS extension_amount

        FROM checkout_folio_master cf
        LEFT JOIN latest_checkout_detail lcd ON lcd.checkout_id = cf.checkout_id AND (lcd.room_id = cf.room_id OR cf.room_id IS NULL)
        INNER JOIN checkout_master cm ON cm.checkout_id = cf.checkout_id
        WHERE cf.checkout_id = p_checkout_id
          AND UPPER(TRIM(cf.transaction_type)) = 'ALLOWANCE'

        UNION ALL

        -- ============================================================
        -- 5. ADVANCE ADDITION
        -- ============================================================
        SELECT
            COALESCE(lcd.room_number, 'COMMON') AS room_number,
            DATE(cf.transaction_datetime) AS bill_date,

            COALESCE(lcd.room_id, 0) AS room_id,
            lcd.room_category_name,
            lcd.converted_category_name,

            cm.checkin_datetime,
            cm.checkout_date AS checkout_datetime,

            1 AS no_of_days,

            0 AS tariff,
            0 AS ex_pax,
            0 AS child_paid_amount,
            0 AS driver_charge,

            0 AS cgst,
            0 AS sgst,
            0 AS igst,

            0 AS food,
            0 AS post_charges,

            IFNULL(cf.credit_amount, 0) AS allowance,

            0 AS room_tariff_per_day,

            0 AS adults,
            0 AS pax,
            0 AS ex_pax_total,

            0 AS child_paid,
            0 AS child_unpaid,
            0 AS driver,

            0 AS ex_cgst_percent,
            0 AS ex_cgst_amount,
            0 AS ex_sgst_percent,
            0 AS ex_sgst_amount,
            0 AS ex_igst_percent,
            0 AS ex_igst_amount,

            0 AS tax_percen_child,
            0 AS child_cgst_percent,
            0 AS child_cgst_amount,
            0 AS child_sgst_percent,
            0 AS child_sgst_amount,
            0 AS child_igst_percent,
            0 AS child_igst_amount,

            0 AS tax_percen_driver,
            0 AS driver_cgst_percent,
            0 AS driver_cgst_amount,
            0 AS driver_sgst_percent,
            0 AS driver_sgst_amount,
            0 AS driver_igst_percent,
            0 AS driver_igst_amount,

            0 AS discount_percent,
            0 AS discount_amount,

            0 AS cgst_percent,
            0 AS cgst_amount,
            0 AS sgst_percent,
            0 AS sgst_amount,
            0 AS igst_percent,
            0 AS igst_amount,

            0 AS cess_percent,
            0 AS cess_amount,

            0 AS service_charge,
            0 AS service_charge_amount,

            0 AS tax,

            cf.folio_id AS charge_id,

            (SELECT guest_name FROM guest_name_cte) AS guest_name,
            (SELECT COALESCE(payment_method, 'Cash') FROM checkout_master WHERE checkout_id = p_checkout_id) AS payment_mode,

            'ADVANCE ADDITION' AS transaction_type,

            CASE
                WHEN IFNULL(cf.description, '') <> '' THEN cf.description
                ELSE 'Advance Addition'
            END AS description,

            0 AS extension_amount

        FROM checkout_folio_master cf
        LEFT JOIN latest_checkout_detail lcd ON lcd.checkout_id = cf.checkout_id AND (lcd.room_id = cf.room_id OR cf.room_id IS NULL)
        INNER JOIN checkout_master cm ON cm.checkout_id = cf.checkout_id
        WHERE cf.checkout_id = p_checkout_id
          AND UPPER(TRIM(cf.transaction_type)) = 'ADVANCE ADDITION'

    ) x

    GROUP BY
        x.room_number,
        x.bill_date,
        x.transaction_type,
        x.charge_id,
        x.description

    ORDER BY
        x.room_number,
        x.bill_date,
        FIELD(
            UPPER(x.transaction_type),
            'ROOM CHARGES',
            'FOOD',
            'CHARGE',
            'ALLOWANCE',
            'ADVANCE ADDITION'
        ),
        x.charge_id;


            /* ==========================================================
       RESULT SET 3 : FOOTER SUMMARY (FIXED)
       ========================================================== */

    WITH summary_totals AS (
        SELECT
            cd.checkout_id,
            
            -- Calculate total from checkout_detail ONLY
            -- Room Extension is already included in checkout_detail.room_tariff
            ROUND(
                -- Room Charges (includes extensions already)
                IFNULL(SUM(cd.room_tariff), 0) + 
                IFNULL(SUM(cd.ex_pax_charge * cd.ex_pax), 0) + 
                IFNULL(SUM(cd.child_paid_amount * cd.child_paid), 0) + 
                IFNULL(SUM(cd.driver_charge * cd.driver), 0) +
                
                -- GST Components
                IFNULL(SUM(cd.cgst_amount + cd.ex_cgst_amount + cd.child_cgst_amount + cd.driver_cgst_amount), 0) +
                IFNULL(SUM(cd.sgst_amount + cd.ex_sgst_amount + cd.child_sgst_amount + cd.driver_sgst_amount), 0) +
                IFNULL(SUM(cd.igst_amount + cd.ex_igst_amount + cd.child_igst_amount + cd.driver_igst_amount), 0) +
                
                -- CESS & Service Charge
                IFNULL(SUM(cd.cess_amount), 0) +
                IFNULL(SUM(cd.service_charge_amount), 0) -
                
                -- Discount (from checkout_detail)
                IFNULL(SUM(cd.discount_amount), 0) +
                
                -- Food Charges (from folio)
                COALESCE(
                    (SELECT SUM(cf.debit_amount) 
                     FROM checkout_folio_master cf 
                     WHERE cf.checkout_id = p_checkout_id 
                       AND UPPER(TRIM(cf.transaction_type)) = 'FOOD'),
                    0
                ) +
                
                -- Post Charges (CHARGE) (from folio)
                COALESCE(
                    (SELECT SUM(cf.debit_amount) 
                     FROM checkout_folio_master cf 
                     WHERE cf.checkout_id = p_checkout_id 
                       AND UPPER(TRIM(cf.transaction_type)) = 'CHARGE'),
                    0
                ) -
                
                -- Allowance (from folio)
                COALESCE(
                    (SELECT SUM(cf.credit_amount) 
                     FROM checkout_folio_master cf 
                     WHERE cf.checkout_id = p_checkout_id 
                       AND UPPER(TRIM(cf.transaction_type)) = 'ALLOWANCE'),
                    0
                )
            , 2) AS total_bill_amount,
            
            -- CGST Total
            ROUND(IFNULL(SUM(cd.cgst_amount), 0), 2) + 
            ROUND(IFNULL(SUM(cd.ex_cgst_amount), 0), 2) + 
            ROUND(IFNULL(SUM(cd.child_cgst_amount), 0), 2) + 
            ROUND(IFNULL(SUM(cd.driver_cgst_amount), 0), 2) AS total_cgst,
            
            -- SGST Total
            ROUND(IFNULL(SUM(cd.sgst_amount), 0), 2) + 
            ROUND(IFNULL(SUM(cd.ex_sgst_amount), 0), 2) + 
            ROUND(IFNULL(SUM(cd.child_sgst_amount), 0), 2) + 
            ROUND(IFNULL(SUM(cd.driver_sgst_amount), 0), 2) AS total_sgst,
            
            -- IGST Total
            ROUND(IFNULL(SUM(cd.igst_amount), 0), 2) + 
            ROUND(IFNULL(SUM(cd.ex_igst_amount), 0), 2) + 
            ROUND(IFNULL(SUM(cd.child_igst_amount), 0), 2) + 
            ROUND(IFNULL(SUM(cd.driver_igst_amount), 0), 2) AS total_igst,
            
            -- CESS Total
            ROUND(IFNULL(SUM(cd.cess_amount), 0), 2) AS total_cess,
            
            -- Service Charge Total
            ROUND(IFNULL(SUM(cd.service_charge_amount), 0), 2) AS total_service_charge,
            
            -- Discount Total
            ROUND(IFNULL(SUM(cd.discount_amount), 0), 2) AS total_discount,
            
            -- Advance Total
            ROUND(IFNULL(MAX(cm.tot_advance), 0), 2) AS total_advance,
            
            -- Post Charges total (for display)
            ROUND(
                COALESCE(
                    (SELECT SUM(cf.debit_amount) 
                     FROM checkout_folio_master cf 
                     WHERE cf.checkout_id = p_checkout_id 
                       AND UPPER(TRIM(cf.transaction_type)) = 'CHARGE'),
                    0
                ), 2
            ) AS total_post_charges,
            
            -- Allowance total (for display)
            ROUND(
                COALESCE(
                    (SELECT SUM(cf.credit_amount) 
                     FROM checkout_folio_master cf 
                     WHERE cf.checkout_id = p_checkout_id 
                       AND UPPER(TRIM(cf.transaction_type)) = 'ALLOWANCE'),
                    0
                ), 2
            ) AS total_allowance,
            
            -- Food total (for display)
            ROUND(
                COALESCE(
                    (SELECT SUM(cf.debit_amount) 
                     FROM checkout_folio_master cf 
                     WHERE cf.checkout_id = p_checkout_id 
                       AND UPPER(TRIM(cf.transaction_type)) = 'FOOD'),
                    0
                ), 2
            ) AS total_food
            
        FROM checkout_detail cd
        LEFT JOIN checkout_master cm ON cm.checkout_id = cd.checkout_id
        WHERE cd.checkout_id = p_checkout_id AND cd.is_checkout = 1
        GROUP BY cd.checkout_id
    )
    SELECT
        ROUND(IFNULL(st.total_bill_amount, 0), 2) AS bill_amount,

        ROUND(IFNULL(st.total_post_charges, 0), 2) AS post_charges,
        ROUND(IFNULL(st.total_allowance, 0), 2) AS allowance,
        ROUND(IFNULL(st.total_food, 0), 2) AS food,

        ROUND(IFNULL(st.total_discount, 0), 2) AS discount_amount,
        ROUND(IFNULL(st.total_advance, 0), 2) AS advance_amount,

        -- Balance Amount = Bill Amount - Discount - Advance
        ROUND(
            IFNULL(st.total_bill_amount, 0)
            - IFNULL(st.total_discount, 0)
            - IFNULL(st.total_advance, 0)
        , 2) AS balance_amount,

        -- Net Payable = Bill Amount - Discount
        ROUND(
            IFNULL(st.total_bill_amount, 0)
            - IFNULL(st.total_discount, 0)
        , 2) AS net_payable,

        0 AS round_off_amount,

        ROUND(IFNULL(st.total_cgst, 0), 2) AS cgst,
        ROUND(IFNULL(st.total_sgst, 0), 2) AS sgst,
        ROUND(IFNULL(st.total_igst, 0), 2) AS igst,
        ROUND(IFNULL(st.total_cess, 0), 2) AS cess,
        ROUND(IFNULL(st.total_service_charge, 0), 2) AS service_charge,

        COALESCE(cm.payment_method, 'Cash') AS payment_mode

    FROM checkout_master cm
    LEFT JOIN summary_totals st ON st.checkout_id = cm.checkout_id
    WHERE cm.checkout_id = p_checkout_id;
END