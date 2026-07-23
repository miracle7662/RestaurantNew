CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_checkin_details_summary`(
    IN p_hotel_id INT,
    IN p_checkin_id INT
)
BEGIN

/* ROOM CHARGES & EXTENSION - Fixed total_amount calculation */
SELECT
    cm.checkin_id,
    cm.booking,
    cm.plan_name,
    cm.reg_no,
    cm.checkin_datetime,
    cm.hotelid,
    
    cdm.detail_id,
    cdm.guest_id,
    cdm.room_id,
    cdm.room_number,
    cdm.room_category_name,
    cdm.converted_category_name,
    cdm.room_tariff,
    cdm.discount_percent,
    cdm.discount_amount,
    (COALESCE(cdm.cgst_percent, 0) + COALESCE(cdm.sgst_percent, 0)) AS tax_percent,
    cdm.cgst_percent,
    cdm.sgst_percent,
    cdm.igst_percent,
    cdm.is_settle,
    cdm.checkin_datetime AS detail_checkin_datetime,
    cdm.checkout_datetime AS detail_checkout_datetime,
    cdm.adults,
    cdm.pax,
    cdm.ex_pax,
    cdm.child_unpaid,
    cdm.driver,
    cdm.ex_pax_charge,
    cdm.child_paid_amount,
    cdm.driver_charge,
    cdm.cess_percent,
    cdm.service_charge,
    cdm.parent_detail_id,

    COALESCE(gm.name, 'Guest') AS guest_name,
    COALESCE(gm.mobile, '-') AS mobile,
    COALESCE(gm.address, '-') AS address,
    COALESCE(gm.email, '-') AS email,

    -- Get folio for this specific room detail
    (SELECT folio_id
     FROM checkin_guest_folio_master 
     WHERE detail_id = cdm.detail_id
       AND transaction_type IN ('Room Charges', 'Room Extension')
       AND checkin_id = cm.checkin_id
     LIMIT 1) AS folio_id,

    CASE
        WHEN cdm.parent_detail_id IS NULL THEN 'Room Charges'
        ELSE 'Room Extension'
    END AS transaction_type,

    CASE
        WHEN cdm.parent_detail_id IS NULL THEN 'Check-in Day'
        ELSE 'Extended'
    END AS description,

    (SELECT payment_method
     FROM checkin_guest_folio_master 
     WHERE detail_id = cdm.detail_id
       AND transaction_type IN ('Room Charges', 'Room Extension')
       AND checkin_id = cm.checkin_id
     LIMIT 1) AS payment_method,

    (SELECT debit_amount
     FROM checkin_guest_folio_master 
     WHERE detail_id = cdm.detail_id
       AND transaction_type IN ('Room Charges', 'Room Extension')
       AND checkin_id = cm.checkin_id
     LIMIT 1) AS debit_amount,

    (SELECT credit_amount
     FROM checkin_guest_folio_master 
     WHERE detail_id = cdm.detail_id
       AND transaction_type IN ('Room Charges', 'Room Extension')
       AND checkin_id = cm.checkin_id
     LIMIT 1) AS credit_amount,

    (SELECT reference_number
     FROM checkin_guest_folio_master 
     WHERE detail_id = cdm.detail_id
       AND transaction_type IN ('Room Charges', 'Room Extension')
       AND checkin_id = cm.checkin_id
     LIMIT 1) AS reference_number,

    -- Breakdown fields
    NULL AS guest_room_charges_id,
    cdm.room_category_id AS category_id,
    cdm.pax AS pax_count,
    cdm.room_tariff AS pax_price,
    (COALESCE(cdm.cgst_amount, 0) + COALESCE(cdm.sgst_amount, 0) + COALESCE(cdm.igst_amount, 0)) AS pax_tax,

    cdm.ex_pax AS ex_pax_count,
    cdm.ex_pax_charge AS ex_pax_price,
    (COALESCE(cdm.ex_cgst_amount, 0) + COALESCE(cdm.ex_sgst_amount, 0) + COALESCE(cdm.ex_igst_amount, 0)) AS ex_pax_tax,
    cdm.tax_percen_ex AS ex_pax_tax_percent,
    (COALESCE(cdm.ex_pax, 0) * COALESCE(cdm.ex_pax_charge, 0))
        + (COALESCE(cdm.ex_cgst_amount, 0) + COALESCE(cdm.ex_sgst_amount, 0) + COALESCE(cdm.ex_igst_amount, 0)) AS ex_pax_total,

    cdm.child_paid AS child_count,
    cdm.child_paid_amount AS child_price,
    (COALESCE(cdm.child_cgst_amount, 0) + COALESCE(cdm.child_sgst_amount, 0) + COALESCE(cdm.child_igst_amount, 0)) AS child_tax,
    cdm.tax_percen_child AS child_tax_percent,
    (COALESCE(cdm.child_paid, 0) * COALESCE(cdm.child_paid_amount, 0))
        + (COALESCE(cdm.child_cgst_amount, 0) + COALESCE(cdm.child_sgst_amount, 0) + COALESCE(cdm.child_igst_amount, 0)) AS child_total,

    cdm.driver AS driver_count,
    cdm.driver_charge AS driver_price,
    (COALESCE(cdm.driver_cgst_amount, 0) + COALESCE(cdm.driver_sgst_amount, 0) + COALESCE(cdm.driver_igst_amount, 0)) AS driver_tax,
    cdm.tax_percen_driver AS driver_tax_percent,
    (COALESCE(cdm.driver, 0) * COALESCE(cdm.driver_charge, 0))
        + (COALESCE(cdm.driver_cgst_amount, 0) + COALESCE(cdm.driver_sgst_amount, 0) + COALESCE(cdm.driver_igst_amount, 0)) AS driver_total,

    -- FIXED: Total amount calculation
    -- room_tariff is already the per room rate (not multiplied by pax)
    CASE
        WHEN (SELECT debit_amount
              FROM checkin_guest_folio_master 
              WHERE detail_id = cdm.detail_id
                AND transaction_type IN ('Room Charges', 'Room Extension')
                AND checkin_id = cm.checkin_id
              LIMIT 1) IS NOT NULL
        THEN (SELECT debit_amount
              FROM checkin_guest_folio_master 
              WHERE detail_id = cdm.detail_id
                AND transaction_type IN ('Room Charges', 'Room Extension')
                AND checkin_id = cm.checkin_id
              LIMIT 1)
        ELSE 
            -- Calculate total from all components
            COALESCE(cdm.room_tariff, 0)  -- Base room rate (already includes pax charges)
            + COALESCE(cdm.cgst_amount, 0) + COALESCE(cdm.sgst_amount, 0) + COALESCE(cdm.igst_amount, 0)  -- Pax taxes
            
            + COALESCE((cdm.ex_pax * cdm.ex_pax_charge), 0)  -- Extra pax amount
            + COALESCE(cdm.ex_cgst_amount, 0) + COALESCE(cdm.ex_sgst_amount, 0) + COALESCE(cdm.ex_igst_amount, 0)  -- Extra pax taxes
            
            + COALESCE((cdm.child_paid * cdm.child_paid_amount), 0)  -- Child amount
            + COALESCE(cdm.child_cgst_amount, 0) + COALESCE(cdm.child_sgst_amount, 0) + COALESCE(cdm.child_igst_amount, 0)  -- Child taxes
            
            + COALESCE((cdm.driver * cdm.driver_charge), 0)  -- Driver amount
            + COALESCE(cdm.driver_cgst_amount, 0) + COALESCE(cdm.driver_sgst_amount, 0) + COALESCE(cdm.driver_igst_amount, 0)  -- Driver taxes
            
            - COALESCE(cdm.discount_amount, 0)  -- Subtract discount
            + COALESCE(cdm.cess_percent, 0)  -- Add cess if any
            + COALESCE(cdm.service_charge, 0)  -- Add service charge if any
    END AS total_amount,

    cdm.checkin_datetime AS charge_checkin_datetime,
    cdm.checkout_datetime AS charge_checkout_datetime,

    'ROOM_CHARGE' AS source_type,
    
    -- Add room sequence for ordering
    ROW_NUMBER() OVER (PARTITION BY cdm.room_id ORDER BY cdm.detail_id) AS room_sequence

FROM checkin_master cm
INNER JOIN checkin_detail_master cdm
    ON cm.checkin_id = cdm.checkin_id
LEFT JOIN guest_master gm
    ON gm.guest_id = cdm.guest_id

WHERE cm.hotelid = p_hotel_id
  AND cm.checkin_id = p_checkin_id
  AND cdm.is_settle = 0

UNION ALL

/* ADVANCE / FOOD / BAR / OTHER FOLIO ENTRIES */
SELECT
    cm.checkin_id,
    cm.booking,
    cm.plan_name,
    cm.reg_no,
    cm.checkin_datetime,
    cm.hotelid,
    
    COALESCE(cdm.detail_id, 0) AS detail_id,
    COALESCE(cdm.guest_id, 0) AS guest_id,
    cgfm.room_id,
    COALESCE(cdm.room_number, '-') AS room_number,
    COALESCE(cdm.room_category_name, '-') AS room_category_name,
    COALESCE(cdm.converted_category_name, '-') AS converted_category_name,

    CASE
        WHEN cgfm.transaction_type IN ('Advance Addition', 'Allowance')
            THEN -COALESCE(cgfm.credit_amount, 0)
        WHEN COALESCE(cgfm.debit_amount, 0) > 0
            THEN cgfm.debit_amount
        ELSE (COALESCE(cgfm.debit_amount, 0) - COALESCE(cgfm.credit_amount, 0))
    END AS room_tariff,

    0 AS discount_percent,
    0 AS discount_amount,
    0 AS tax_percent,
    0 AS cgst_percent,
    0 AS sgst_percent,
    0 AS igst_percent,
    0 AS is_settle,

    cgfm.transaction_datetime AS detail_checkin_datetime,
    cgfm.transaction_datetime AS detail_checkout_datetime,

    0 AS adults,
    0 AS pax,
    0 AS ex_pax,
    0 AS child_unpaid,
    0 AS driver,
    0 AS ex_pax_charge,
    0 AS child_paid_amount,
    0 AS driver_charge,
    0 AS cess_percent,
    0 AS service_charge,
    NULL AS parent_detail_id,

    COALESCE(gm.name, 'Guest') AS guest_name,
    COALESCE(gm.mobile, '-') AS mobile,
    COALESCE(gm.address, '-') AS address,
    COALESCE(gm.email, '-') AS email,

    cgfm.folio_id,
    cgfm.transaction_type,
    cgfm.description,
    cgfm.payment_method,
    cgfm.debit_amount,
    cgfm.credit_amount,
    cgfm.reference_number,

    NULL AS guest_room_charges_id,
    NULL AS category_id,
    NULL AS pax_count,
    NULL AS pax_price,
    NULL AS pax_tax,
    NULL AS ex_pax_count,
    NULL AS ex_pax_price,
    NULL AS ex_pax_tax,
    NULL AS ex_pax_tax_percent,
    NULL AS ex_pax_total,
    NULL AS child_count,
    NULL AS child_price,
    NULL AS child_tax,
    NULL AS child_tax_percent,
    NULL AS child_total,
    NULL AS driver_count,
    NULL AS driver_price,
    NULL AS driver_tax,
    NULL AS driver_tax_percent,
    NULL AS driver_total,

    CASE
        WHEN cgfm.transaction_type IN ('Advance Addition', 'Allowance')
            THEN -COALESCE(cgfm.credit_amount, 0)
        WHEN cgfm.transaction_type IN ('Post Charges', 'Food', 'Bar', 'Laundry', 'Other Charges')
            THEN COALESCE(cgfm.debit_amount, 0)
        ELSE (COALESCE(cgfm.debit_amount, 0) - COALESCE(cgfm.credit_amount, 0))
    END AS total_amount,

    cgfm.transaction_datetime AS charge_checkin_datetime,
    cgfm.transaction_datetime AS charge_checkout_datetime,

    'FOLIO_ENTRY' AS source_type,
    
    0 AS room_sequence

FROM checkin_guest_folio_master cgfm

INNER JOIN checkin_master cm
    ON cm.checkin_id = cgfm.checkin_id

INNER JOIN checkin_detail_master cdm
    ON cdm.detail_id = cgfm.detail_id
   AND cdm.checkin_id = cgfm.checkin_id
   AND cdm.is_settle = 0

LEFT JOIN guest_master gm
    ON gm.guest_id = cdm.guest_id

WHERE cm.hotelid = p_hotel_id
  AND cgfm.checkin_id = p_checkin_id
  AND cgfm.transaction_type NOT IN ('Room Charges','Room Extension')
  AND (
        cgfm.description IS NULL
        OR cgfm.description NOT LIKE 'Discount%'
      )
ORDER BY 
    source_type DESC,
    room_id,
    detail_checkin_datetime,
    detail_id;

END