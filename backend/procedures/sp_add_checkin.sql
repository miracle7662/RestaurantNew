CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_checkins`(
    IN p_hotel_id INT,
    IN p_checkin_id INT
)
BEGIN

/* ===========================================================
   CTE 1: Latest Room Record from checkin_detail_master
=========================================================== */
WITH latest_room_detail AS (
    SELECT 
        d1.*
    FROM checkin_detail_master d1
    INNER JOIN (
        SELECT
            d2.checkin_id,
            d2.room_id,
            MAX(d2.detail_id) AS detail_id
        FROM checkin_detail_master d2
        WHERE 1=1
        GROUP BY d2.checkin_id, d2.room_id
    ) x ON d1.detail_id = x.detail_id
),

/* ===========================================================
   CTE 2: Room-wise Folio Summary - Simple Debit/Credit
=========================================================== */
room_folio_summary AS (
    SELECT
        f.checkin_id,
        f.room_id,
        
        -- Total Debit (All debit transactions)
        SUM(f.debit_amount) AS total_debit,
        
        -- Total Credit (All credit transactions)
        SUM(f.credit_amount) AS total_credit,
        
        -- Net = Debit - Credit
        SUM(f.debit_amount) - SUM(f.credit_amount) AS net_balance,
        
        -- Room Charges (Debit)
        SUM(CASE 
            WHEN f.transaction_type IN ('Room Charges', 'Room Extension', 'Room Tariff', 'Room Rent') 
            THEN f.debit_amount 
            ELSE 0 
        END) AS room_charges,
        
        -- Restaurant Charges (Debit)
        SUM(CASE 
            WHEN f.transaction_type = 'Restaurant' 
            THEN f.debit_amount 
            ELSE 0 
        END) AS restaurant_charges,
        
        -- Laundry Charges (Debit)
        SUM(CASE 
            WHEN f.transaction_type = 'Laundry' 
            THEN f.debit_amount 
            ELSE 0 
        END) AS laundry_charges,
        
        -- Post/Extra Charges (Debit) - ALL other debit charges
        SUM(CASE 
            WHEN f.transaction_type IN ('Extra Charges', 'Post Charges', 'Misc Charge', 'Service Charge', 
                                        'Post Charge', 'Extra', 'Misc') 
            THEN f.debit_amount 
            ELSE 0 
        END) AS post_charges,
        
        -- Advance (Credit)
        SUM(CASE 
            WHEN f.transaction_type IN ('Advance', 'Advance Addition', 'Booking Receipt', 'Advance Payment', 'Advance Receipt') 
            THEN f.credit_amount 
            ELSE 0 
        END) AS advance,
        
        -- Allowance (Credit)
        SUM(CASE 
            WHEN f.transaction_type IN ('Allowance', 'Discount', 'Comp', 'Allowances') 
            THEN f.credit_amount 
            ELSE 0 
        END) AS allowance
        
    FROM checkin_guest_folio_master f
    WHERE 1=1
    GROUP BY f.checkin_id, f.room_id
),

/* ===========================================================
   CTE 3: Room-wise Financial Calculations
=========================================================== */
room_calculations AS (
    SELECT
        cm.checkin_id,
        cm.guest_id,
        cm.reg_no,
        cm.booking,
        cm.plan_name,
        cm.checkin_datetime,
        cm.hotelid,
        cm.checkout_id,
        cm.is_settle AS master_is_settle,
        cm.total_amount,
        cm.total_nights,
        cm.tot_room_tariff,
        cm.tot_ex_pax_charge,
        cm.tot_child_paid_amount,
        cm.tot_driver_charge,
        cm.tot_discount_amount,
        cm.tot_cgst_amount,
        cm.tot_sgst_amount,
        cm.tot_igst_amount,
        cm.tot_ex_cgst_amount,
        cm.tot_ex_sgst_amount,
        cm.tot_ex_igst_amount,
        cm.tot_child_cgst_amount,
        cm.tot_child_sgst_amount,
        cm.tot_child_igst_amount,
        cm.tot_driver_cgst_amount,
        cm.tot_driver_sgst_amount,
        cm.tot_driver_igst_amount,
        cm.tot_service_charge_amount,
        cm.tot_cess_amount,
        cm.tot_advance,
        cm.id_type,
        cm.id_number,
        cm.department_id,
        cm.department_name,
        cm.special_instruction,
        cm.message,
        cm.status,
        
        -- Room Detail Fields
        lrd.detail_id,
        lrd.room_id,
        lrd.room_number,
        lrd.room_category_id,
        lrd.room_category_name,
        lrd.converted_category_id,
        lrd.converted_category_name,
        lrd.parent_detail_id,
        lrd.checkin_datetime AS detail_checkin_datetime,
        lrd.checkout_datetime AS detail_checkout_datetime,
        lrd.no_of_days,
        lrd.guest_id AS detail_guest_id,
        lrd.adults,
        lrd.pax,
        lrd.ex_pax,
        lrd.child_paid,
        lrd.child_unpaid,
        lrd.driver,
        
        -- Room Charges from checkin_detail_master
        lrd.room_tariff,
        lrd.ex_pax_charge,
        lrd.child_paid_amount,
        lrd.driver_charge,
        lrd.discount_percent,
        lrd.discount_amount,
        lrd.cgst_percent,
        lrd.cgst_amount,
        lrd.sgst_percent,
        lrd.sgst_amount,
        lrd.igst_percent,
        lrd.igst_amount,
        lrd.ex_cgst_percent,
        lrd.ex_cgst_amount,
        lrd.ex_sgst_percent,
        lrd.ex_sgst_amount,
        lrd.ex_igst_percent,
        lrd.ex_igst_amount,
        lrd.child_cgst_percent,
        lrd.child_cgst_amount,
        lrd.child_sgst_percent,
        lrd.child_sgst_amount,
        lrd.child_igst_percent,
        lrd.child_igst_amount,
        lrd.driver_cgst_percent,
        lrd.driver_cgst_amount,
        lrd.driver_sgst_percent,
        lrd.driver_sgst_amount,
        lrd.driver_igst_percent,
        lrd.driver_igst_amount,
        lrd.service_charge,
        lrd.service_charge_amount,
        lrd.cess_percent,
        lrd.cess_amount,
        lrd.tax,
        lrd.is_checkout,
        lrd.merged,
        lrd.is_settle AS detail_is_settle,
        
        -- Guest Information
        COALESCE(gm.name, lrd.guest_name) AS guest_name,
        COALESCE(gm.mobile, lrd.mobile) AS mobile,
        COALESCE(gm.address, lrd.address) AS address,
        COALESCE(gm.email, '') AS email,
        COALESCE(comp.company_name, lrd.company_name) AS company_name,
        
        -- Room-wise Calculations (from checkin_detail_master)
        (COALESCE(lrd.room_tariff, 0) + 
         COALESCE(lrd.ex_pax_charge, 0) + 
         COALESCE(lrd.child_paid_amount, 0) + 
         COALESCE(lrd.driver_charge, 0)) AS room_basic_amount,
        
        COALESCE(lrd.discount_amount, 0) AS room_discount_amount,
        
        (COALESCE(lrd.cgst_amount, 0) + 
         COALESCE(lrd.sgst_amount, 0) + 
         COALESCE(lrd.igst_amount, 0) +
         COALESCE(lrd.ex_cgst_amount, 0) +
         COALESCE(lrd.ex_sgst_amount, 0) +
         COALESCE(lrd.ex_igst_amount, 0) +
         COALESCE(lrd.child_cgst_amount, 0) +
         COALESCE(lrd.child_sgst_amount, 0) +
         COALESCE(lrd.child_igst_amount, 0) +
         COALESCE(lrd.driver_cgst_amount, 0) +
         COALESCE(lrd.driver_sgst_amount, 0) +
         COALESCE(lrd.driver_igst_amount, 0)) AS room_tax_amount,
        
        COALESCE(lrd.service_charge_amount, 0) AS room_service_charge,
        COALESCE(lrd.cess_amount, 0) AS room_cess_amount,
        
        -- Room Total = Basic - Discount + Tax + Service Charge + Cess
        (COALESCE(lrd.room_tariff, 0) + 
         COALESCE(lrd.ex_pax_charge, 0) + 
         COALESCE(lrd.child_paid_amount, 0) + 
         COALESCE(lrd.driver_charge, 0) - 
         COALESCE(lrd.discount_amount, 0) + 
         COALESCE(lrd.cgst_amount, 0) + 
         COALESCE(lrd.sgst_amount, 0) + 
         COALESCE(lrd.igst_amount, 0) +
         COALESCE(lrd.ex_cgst_amount, 0) +
         COALESCE(lrd.ex_sgst_amount, 0) +
         COALESCE(lrd.ex_igst_amount, 0) +
         COALESCE(lrd.child_cgst_amount, 0) +
         COALESCE(lrd.child_sgst_amount, 0) +
         COALESCE(lrd.child_igst_amount, 0) +
         COALESCE(lrd.driver_cgst_amount, 0) +
         COALESCE(lrd.driver_sgst_amount, 0) +
         COALESCE(lrd.driver_igst_amount, 0) +
         COALESCE(lrd.service_charge_amount, 0) +
         COALESCE(lrd.cess_amount, 0)) AS room_total,
         
        -- Folio Data from checkin_guest_folio_master
        COALESCE(rfs.room_charges, 0) AS folio_room_charges,
        COALESCE(rfs.restaurant_charges, 0) AS folio_restaurant_charges,
        COALESCE(rfs.laundry_charges, 0) AS folio_laundry_charges,
        COALESCE(rfs.post_charges, 0) AS folio_post_charges,
        COALESCE(rfs.advance, 0) AS folio_advance,
        COALESCE(rfs.allowance, 0) AS folio_allowance,
        COALESCE(rfs.total_debit, 0) AS folio_total_debit,
        COALESCE(rfs.total_credit, 0) AS folio_total_credit,
        COALESCE(rfs.net_balance, 0) AS folio_net_balance
        
    FROM checkin_master cm
    
    INNER JOIN latest_room_detail lrd
        ON cm.checkin_id = lrd.checkin_id
        
    LEFT JOIN guest_master gm
        ON gm.guest_id = lrd.guest_id
        
    LEFT JOIN company_master comp
        ON comp.company_id = gm.company_id
        
    LEFT JOIN room_folio_summary rfs
        ON rfs.checkin_id = lrd.checkin_id
        AND rfs.room_id = lrd.room_id
    
    WHERE cm.hotelid = p_hotel_id
    AND (p_checkin_id = 0 OR cm.checkin_id = p_checkin_id)
),

/* ===========================================================
   CTE 4: Checkin-wise Aggregation
   ⚠️ Using simple Debit - Credit = Net
=========================================================== */
checkin_aggregation AS (
    SELECT
        rc.checkin_id,
        
        -- Room Totals
        SUM(rc.room_total) AS total_room_charges,
        SUM(rc.room_basic_amount) AS total_basic,
        SUM(rc.room_discount_amount) AS total_discount,
        SUM(rc.room_tax_amount) AS total_tax,
        SUM(rc.room_service_charge) AS total_service_charge,
        SUM(rc.room_cess_amount) AS total_cess,
        
        -- Folio Totals (Aggregated from room level)
        SUM(rc.folio_room_charges) AS total_folio_room_charges,
        SUM(rc.folio_restaurant_charges) AS total_restaurant_charges,
        SUM(rc.folio_laundry_charges) AS total_laundry_charges,
        SUM(rc.folio_post_charges) AS total_post_charges,
        SUM(rc.folio_advance) AS total_advance,
        SUM(rc.folio_allowance) AS total_allowance,
        SUM(rc.folio_total_debit) AS total_folio_debit,
        SUM(rc.folio_total_credit) AS total_folio_credit,
        
        -- ⚠️ SIMPLE FORMULA: Net = Total Debit - Total Credit
        SUM(rc.folio_total_debit) - SUM(rc.folio_total_credit) AS total_net,
        
        -- Number of Rooms
        COUNT(DISTINCT rc.room_id) AS total_rooms,
        
        -- Room Numbers (comma separated)
        GROUP_CONCAT(DISTINCT rc.room_number ORDER BY rc.room_number ASC SEPARATOR ', ') AS room_numbers,
        
        -- Room IDs (comma separated)
        GROUP_CONCAT(DISTINCT rc.room_id ORDER BY rc.room_id ASC SEPARATOR ', ') AS room_ids
        
    FROM room_calculations rc
    GROUP BY rc.checkin_id
)

/* ===========================================================
   FINAL SELECT: One row per room with all data
=========================================================== */
SELECT
    -- Checkin Master Fields
    rc.checkin_id,
    rc.guest_id,
    rc.reg_no,
    rc.booking,
    rc.plan_name,
    rc.checkin_datetime,
    rc.hotelid,
    rc.checkout_id,
    rc.master_is_settle AS is_settle,
    rc.total_amount,
    rc.total_nights,
    rc.tot_room_tariff,
    rc.tot_ex_pax_charge,
    rc.tot_child_paid_amount,
    rc.tot_driver_charge,
    rc.tot_discount_amount,
    rc.tot_cgst_amount,
    rc.tot_sgst_amount,
    rc.tot_igst_amount,
    rc.tot_ex_cgst_amount,
    rc.tot_ex_sgst_amount,
    rc.tot_ex_igst_amount,
    rc.tot_child_cgst_amount,
    rc.tot_child_sgst_amount,
    rc.tot_child_igst_amount,
    rc.tot_driver_cgst_amount,
    rc.tot_driver_sgst_amount,
    rc.tot_driver_igst_amount,
    rc.tot_service_charge_amount,
    rc.tot_cess_amount,
    rc.tot_advance,
    rc.id_type,
    rc.id_number,
    rc.department_id,
    rc.department_name,
    rc.special_instruction,
    rc.message,
    rc.status,

    -- Room Detail Fields
    rc.detail_id,
    rc.room_id,
    rc.room_number,
    rc.room_category_id,
    rc.room_category_name,
    rc.converted_category_id,
    rc.converted_category_name,
    rc.parent_detail_id,
    rc.detail_checkin_datetime,
    rc.detail_checkout_datetime,
    rc.no_of_days,
    rc.detail_guest_id,
    rc.adults,
    rc.pax,
    rc.ex_pax,
    rc.child_paid,
    rc.child_unpaid,
    rc.driver,
    
    -- Room Charges (from checkin_detail_master)
    rc.room_tariff,
    rc.ex_pax_charge,
    rc.child_paid_amount,
    rc.driver_charge,
    rc.discount_percent,
    rc.discount_amount,
    rc.cgst_percent,
    rc.cgst_amount,
    rc.sgst_percent,
    rc.sgst_amount,
    rc.igst_percent,
    rc.igst_amount,
    rc.ex_cgst_percent,
    rc.ex_cgst_amount,
    rc.ex_sgst_percent,
    rc.ex_sgst_amount,
    rc.ex_igst_percent,
    rc.ex_igst_amount,
    rc.child_cgst_percent,
    rc.child_cgst_amount,
    rc.child_sgst_percent,
    rc.child_sgst_amount,
    rc.child_igst_percent,
    rc.child_igst_amount,
    rc.driver_cgst_percent,
    rc.driver_cgst_amount,
    rc.driver_sgst_percent,
    rc.driver_sgst_amount,
    rc.driver_igst_percent,
    rc.driver_igst_amount,
    rc.service_charge,
    rc.service_charge_amount,
    rc.cess_percent,
    rc.cess_amount,
    rc.tax,
    rc.is_checkout,
    rc.merged,
    rc.detail_is_settle,

    -- Guest Fields
    rc.guest_name,
    rc.mobile,
    rc.address,
    rc.email,
    rc.company_name,

    -- Room-wise Calculations (LEFT SIDE)
    rc.room_basic_amount,
    rc.room_discount_amount,
    rc.room_tax_amount,
    rc.room_service_charge,
    rc.room_cess_amount,
    rc.room_total AS room_total,
    
    -- Room-wise Folio Data
    rc.folio_room_charges,
    rc.folio_restaurant_charges,
    rc.folio_laundry_charges,
    rc.folio_post_charges AS room_post_charges,
    rc.folio_advance AS room_advance,
    rc.folio_allowance AS room_allowances,
    rc.folio_total_debit AS room_total_debit,
    rc.folio_total_credit AS room_total_credit,
    
    -- ⚠️ Room Net = Room Total Debit - Room Total Credit
    rc.folio_total_debit - rc.folio_total_credit AS room_net_balance,
    
    -- Checkin-wise Summary (RIGHT SIDE)
    ca.total_rooms AS checkin_total_rooms,
    ca.room_numbers AS checkin_room_numbers,
    ca.room_ids AS checkin_room_ids,
    ca.total_room_charges AS checkin_total_room_charges,
    ca.total_basic AS checkin_total_basic,
    ca.total_discount AS checkin_total_discount,
    ca.total_tax AS checkin_total_tax,
    ca.total_service_charge AS checkin_total_service_charge,
    ca.total_cess AS checkin_total_cess,
    
    -- Checkin-wise Folio Summary
    ca.total_folio_room_charges AS checkin_total_folio_room_charges,
    ca.total_restaurant_charges AS checkin_total_restaurant_charges,
    ca.total_laundry_charges AS checkin_total_laundry_charges,
    ca.total_post_charges AS checkin_total_post_charges,
    ca.total_advance AS checkin_total_advance,
    ca.total_allowance AS checkin_total_allowances,
    ca.total_folio_debit AS checkin_total_folio_debit,
    ca.total_folio_credit AS checkin_total_folio_credit,
    
    -- ⚠️ Checkin Net = Total Debit - Total Credit (Simple Accounting Formula)
    ca.total_net AS checkin_total_net

FROM room_calculations rc
LEFT JOIN checkin_aggregation ca
    ON ca.checkin_id = rc.checkin_id

ORDER BY rc.checkin_id DESC, rc.room_number;

END