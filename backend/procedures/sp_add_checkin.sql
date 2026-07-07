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
            MAX(cdm.emailed) AS emailed
        FROM checkout_master cm
        LEFT JOIN checkin_detail_master cdm ON cdm.checkin_id = cm.checkin_id
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

        cm.checkin_datetime,
        cm.checkout_date AS checkout_datetime,

        cm.checked_out_rooms AS room_no,   -- JSON array

        COALESCE(ct.adults, 0) AS adults,
        COALESCE(ct.pax, 0)    AS pax,
        COALESCE(ct.ex_pax, 0) AS ex_pax,

        cm.total_nights,

        NULL AS payment_mode,

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
    )
    SELECT
        x.room_number,
        x.bill_date,

        ROUND(SUM(x.tariff), 2)          AS tariff,
        ROUND(SUM(x.ex_pax), 2)          AS ex_pax,

        ROUND(SUM(x.cgst), 2)            AS cgst,
        ROUND(SUM(x.sgst), 2)            AS sgst,
        ROUND(SUM(x.igst), 2)            AS igst,

        ROUND(SUM(x.food), 2)            AS food,
        ROUND(SUM(x.post_charges), 2)    AS post_charges,
        ROUND(SUM(x.allowance), 2)       AS allowance,

        ROUND(
            SUM(x.tariff) + SUM(x.ex_pax) + SUM(x.cgst) + SUM(x.sgst) + SUM(x.igst)
            + SUM(x.food) + SUM(x.post_charges) - SUM(x.allowance)
        , 2) AS total_amount,

        MAX(x.room_id)                  AS room_id,
        MAX(x.room_category_name)       AS room_category_name,
        MAX(x.converted_category_name)  AS converted_category_name,

        MAX(x.checkin_datetime)         AS checkin_datetime,
        MAX(x.checkout_datetime)        AS checkout_datetime,

        MAX(x.no_of_days)               AS no_of_days,

        MAX(x.room_tariff_per_day)      AS room_tariff_per_day,

        MAX(x.adults)                   AS adults,
        MAX(x.pax)                      AS pax,
        MAX(x.ex_pax_total)             AS ex_pax_total,

        MAX(x.child_unpaid)             AS child_unpaid,
        MAX(x.driver)                   AS driver,

        MAX(x.discount_percent)         AS discount_percent,
        MAX(x.discount_amount)          AS discount_amount,

        MAX(x.cgst_percent)             AS cgst_percent,
        MAX(x.cgst_amount)              AS cgst_amount,

        MAX(x.sgst_percent)             AS sgst_percent,
        MAX(x.sgst_amount)              AS sgst_amount,

        MAX(x.igst_percent)             AS igst_percent,
        MAX(x.igst_amount)              AS igst_amount,

        MAX(x.cess_percent)             AS cess_percent,
        MAX(x.cess_amount)              AS cess_amount,

        MAX(x.service_charge)           AS service_charge,
        MAX(x.service_charge_amount)    AS service_charge_amount,

        MAX(x.tax)                      AS tax,

        MAX(x.charge_id)                AS charge_id,

        MAX(x.guest_name)               AS guest_name,

        MAX(x.payment_mode)             AS payment_mode,

        MAX(x.description)              AS description,

        MAX(x.transaction_type)         AS transaction_type

    FROM
    (
        -- ROOM CHARGES
        SELECT
            cd.room_number,
            DATE(cd.checkin_datetime) AS bill_date,

            cd.room_id,
            cd.room_category_name,
            cd.converted_category_name,

            cd.checkin_datetime,
            cd.checkout_datetime,

            cd.no_of_days,

            IFNULL(cd.room_tariff, 0)          AS tariff,
            IFNULL(cd.ex_pax_charge, 0)        AS ex_pax,

            IFNULL(cd.cgst_amount, 0)          AS cgst,
            IFNULL(cd.sgst_amount, 0)          AS sgst,
            IFNULL(cd.igst_amount, 0)          AS igst,

            0 AS food,
            0 AS post_charges,
            0 AS allowance,

            IFNULL(cd.room_tariff, 0)          AS room_tariff_per_day,

            IFNULL(cd.adults, 0)               AS adults,
            IFNULL(cd.pax, 0)                  AS pax,
            IFNULL(cd.ex_pax, 0)               AS ex_pax_total,

            IFNULL(cd.child_unpaid, 0)         AS child_unpaid,
            IFNULL(cd.driver, 0)               AS driver,

            IFNULL(cd.discount_percent, 0)     AS discount_percent,
            IFNULL(cd.discount_amount, 0)      AS discount_amount,

            IFNULL(cd.cgst_percent, 0)         AS cgst_percent,
            IFNULL(cd.cgst_amount, 0)          AS cgst_amount,

            IFNULL(cd.sgst_percent, 0)         AS sgst_percent,
            IFNULL(cd.sgst_amount, 0)          AS sgst_amount,

            IFNULL(cd.igst_percent, 0)         AS igst_percent,
            IFNULL(cd.igst_amount, 0)          AS igst_amount,

            IFNULL(cd.cess_percent, 0)         AS cess_percent,
            IFNULL(cd.cess_amount, 0)          AS cess_amount,

            IFNULL(cd.service_charge, 0)       AS service_charge,
            IFNULL(cd.service_charge_amount, 0) AS service_charge_amount,

            IFNULL(cd.tax, 0)                  AS tax,

            cd.checkout_detail_id             AS charge_id,

            COALESCE(cd.guest_name, (SELECT guest_name FROM guest_name_cte)) AS guest_name,
            NULL AS payment_mode,

            'ROOM CHARGES'                    AS transaction_type,
            CONCAT('Room Charges (', cd.room_number, ')') AS description

        FROM checkout_detail cd
        WHERE cd.checkout_id = p_checkout_id
          AND cd.is_checkout = 1

        UNION ALL

        -- ROOM EXTENSION
        SELECT
            COALESCE(cd.room_number, 'COMMON') AS room_number,
            DATE(cf.transaction_datetime) AS bill_date,

            COALESCE(cd.room_id, 0) AS room_id,
            cd.room_category_name,
            cd.converted_category_name,

            cm.checkin_datetime,
            cm.checkout_date AS checkout_datetime,

            1 AS no_of_days,

            IFNULL(cf.debit_amount, 0) AS tariff,
            0 AS ex_pax,

            0 AS cgst,
            0 AS sgst,
            0 AS igst,

            0 AS food,
            0 AS post_charges,
            0 AS allowance,

            0 AS room_tariff_per_day,

            0 AS adults,
            0 AS pax,
            0 AS ex_pax_total,

            0 AS child_unpaid,
            0 AS driver,

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
            NULL AS payment_mode,

            'ROOM EXTENSION' AS transaction_type,

            CASE
                WHEN IFNULL(cf.description, '') <> '' THEN cf.description
                ELSE 'Room Extension'
            END AS description

        FROM checkout_folio_master cf
        LEFT JOIN checkout_detail cd ON cd.checkout_id = cf.checkout_id AND cd.room_id = cf.room_id
        INNER JOIN checkout_master cm ON cm.checkout_id = cf.checkout_id
        WHERE cf.checkout_id = p_checkout_id
          AND UPPER(TRIM(cf.transaction_type)) = 'ROOM EXTENSION'

        UNION ALL

        -- FOOD
        SELECT
            COALESCE(cd.room_number, 'COMMON') AS room_number,
            DATE(cf.transaction_datetime) AS bill_date,

            COALESCE(cd.room_id, 0) AS room_id,
            cd.room_category_name,
            cd.converted_category_name,

            cm.checkin_datetime,
            cm.checkout_date AS checkout_datetime,

            1 AS no_of_days,

            0 AS tariff,
            0 AS ex_pax,

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

            0 AS child_unpaid,
            0 AS driver,

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
            NULL AS payment_mode,

            'FOOD' AS transaction_type,

            CASE
                WHEN IFNULL(cf.description, '') <> '' THEN cf.description
                ELSE 'Food Charges'
            END AS description

        FROM checkout_folio_master cf
        LEFT JOIN checkout_detail cd ON cd.checkout_id = cf.checkout_id AND cd.room_id = cf.room_id
        INNER JOIN checkout_master cm ON cm.checkout_id = cf.checkout_id
        WHERE cf.checkout_id = p_checkout_id
          AND UPPER(TRIM(cf.transaction_type)) = 'FOOD'

        UNION ALL

        -- POST CHARGES (CHARGE)
        SELECT
            COALESCE(cd.room_number, 'COMMON') AS room_number,
            DATE(cf.transaction_datetime) AS bill_date,

            COALESCE(cd.room_id, 0) AS room_id,
            cd.room_category_name,
            cd.converted_category_name,

            cm.checkin_datetime,
            cm.checkout_date AS checkout_datetime,

            1 AS no_of_days,

            0 AS tariff,
            0 AS ex_pax,

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

            0 AS child_unpaid,
            0 AS driver,

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
            NULL AS payment_mode,

            'CHARGE' AS transaction_type,

            CASE
                WHEN IFNULL(cf.description, '') <> '' THEN cf.description
                ELSE 'Post Charges'
            END AS description

        FROM checkout_folio_master cf
        LEFT JOIN checkout_detail cd ON cd.checkout_id = cf.checkout_id AND (cd.room_id = cf.room_id OR cf.room_id IS NULL)
        INNER JOIN checkout_master cm ON cm.checkout_id = cf.checkout_id
        WHERE cf.checkout_id = p_checkout_id
          AND UPPER(TRIM(cf.transaction_type)) = 'CHARGE'

        UNION ALL

        -- ALLOWANCE + ADVANCE ADDITION
        SELECT
            COALESCE(cd.room_number, 'COMMON') AS room_number,
            DATE(cf.transaction_datetime) AS bill_date,

            COALESCE(cd.room_id, 0) AS room_id,
            cd.room_category_name,
            cd.converted_category_name,

            cm.checkin_datetime,
            cm.checkout_date AS checkout_datetime,

            1 AS no_of_days,

            0 AS tariff,
            0 AS ex_pax,

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

            0 AS child_unpaid,
            0 AS driver,

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
            NULL AS payment_mode,

            CASE
                WHEN UPPER(TRIM(cf.transaction_type)) = 'ADVANCE ADDITION'
                    THEN 'ADVANCE ADDITION'
                ELSE 'ALLOWANCE'
            END AS transaction_type,

            CASE
                WHEN IFNULL(cf.description, '') <> '' THEN cf.description
                WHEN UPPER(TRIM(cf.transaction_type)) = 'ADVANCE ADDITION'
                    THEN 'Advance Addition'
                ELSE 'Allowance'
            END AS description

        FROM checkout_folio_master cf
        LEFT JOIN checkout_detail cd ON cd.checkout_id = cf.checkout_id AND (cd.room_id = cf.room_id OR cf.room_id IS NULL)
        INNER JOIN checkout_master cm ON cm.checkout_id = cf.checkout_id
        WHERE cf.checkout_id = p_checkout_id
          AND UPPER(TRIM(cf.transaction_type)) IN ('ALLOWANCE', 'ADVANCE ADDITION')

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
            'ROOM EXTENSION',
            'FOOD',
            'CHARGE',
            'ALLOWANCE',
            'ADVANCE ADDITION'
        ),
        x.charge_id;


    /* ==========================================================
       RESULT SET 3 : FOOTER SUMMARY
    ========================================================== */

    SELECT
        ROUND(IFNULL(cm.total_amount, 0), 2)           AS bill_amount,

        0 AS post_charges,
        0 AS allowance,

        ROUND(IFNULL(cm.tot_discount_amount, 0), 2)    AS discount_amount,
        ROUND(IFNULL(cm.tot_advance, 0), 2)            AS advance_amount,

        ROUND(
            IFNULL(cm.total_amount, 0)
            - IFNULL(cm.tot_discount_amount, 0)
            - IFNULL(cm.tot_advance, 0)
        , 2) AS balance_amount,

        ROUND(
            IFNULL(cm.total_amount, 0)
            - IFNULL(cm.tot_discount_amount, 0)
            - IFNULL(cm.tot_advance, 0)
        , 2) AS net_payable,

        0 AS round_off_amount,

        ROUND(IFNULL(cm.tot_cgst_amount, 0), 2)        AS cgst,
        ROUND(IFNULL(cm.tot_sgst_amount, 0), 2)        AS sgst,
        ROUND(IFNULL(cm.tot_igst_amount, 0), 2)        AS igst,
        ROUND(IFNULL(cm.tot_cess_amount, 0), 2)        AS cess,
        ROUND(IFNULL(cm.tot_service_charge_amount, 0), 2) AS service_charge,

        NULL AS payment_mode

    FROM checkout_master cm
    WHERE cm.checkout_id = p_checkout_id;

END