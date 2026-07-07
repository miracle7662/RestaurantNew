CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_checkins`(
    IN p_hotel_id INT,
    IN p_checkin_id INT
)
BEGIN

SELECT

/* ===========================================================
   CHECKIN MASTER
=========================================================== */

    cm.checkin_id,
    cm.guest_id,
    cm.reg_no,
    cm.booking,
    cm.plan_name,
    cm.checkin_datetime,
    cm.hotelid,
    cm.checkout_id,

    /* Room NO - Detail वरून घ्या */
    cdm.room_number AS room_no,
    cdm.room_id,
    
    cm.is_settle,

    cm.total_amount AS checkin_grand_total,  /* Right side - सर्व rooms ची एकूण रक्कम */
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
    
    COALESCE(cm.payment_method, 'Cash') AS payment_method,  /* <-- ADDED payment_method */

/* ===========================================================
   ROOM DETAILS
=========================================================== */

    cdm.detail_id,
    cdm.room_category_id,
    cdm.room_category_name,

    cdm.converted_category_id,
    cdm.converted_category_name,

    cdm.parent_detail_id,

    cdm.checkin_datetime AS detail_checkin_datetime,
    cdm.checkout_datetime AS detail_checkout_datetime,

    cdm.no_of_days,

    cdm.guest_id AS detail_guest_id,

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
    cdm.discount_amount,

    cdm.cgst_percent,
    cdm.cgst_amount,

    cdm.sgst_percent,
    cdm.sgst_amount,

    cdm.igst_percent,
    cdm.igst_amount,

    cdm.ex_cgst_percent,
    cdm.ex_cgst_amount,

    cdm.ex_sgst_percent,
    cdm.ex_sgst_amount,

    cdm.ex_igst_percent,
    cdm.ex_igst_amount,

    cdm.child_cgst_percent,
    cdm.child_cgst_amount,

    cdm.child_sgst_percent,
    cdm.child_sgst_amount,

    cdm.child_igst_percent,
    cdm.child_igst_amount,

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

    cdm.tax,

    cdm.is_checkout,
    cdm.merged,
    cdm.is_settle AS detail_is_settle,
    
/* ===========================================================
   ROOM NET AMOUNT (Left side - Debit - Credit)
=========================================================== */

    /* Left side - Room Net Amount (Debit - Credit) */
    COALESCE(
        (room_folio.total_debit - room_folio.total_credit), 
        0
    ) AS room_net_amount,

    /* Room Basic Charges */
    COALESCE(
        cdm.room_tariff + 
        cdm.ex_pax_charge + 
        cdm.child_paid_amount + 
        cdm.driver_charge - 
        cdm.discount_amount, 
        0
    ) AS room_basic_amount,

/* ===========================================================
   GUEST DETAILS
=========================================================== */

    COALESCE(gm.name, cdm.guest_name) AS guest_name,
    COALESCE(gm.mobile, cdm.mobile) AS mobile,
    COALESCE(gm.address, cdm.address) AS address,
    COALESCE(gm.email, cdm.emailed) AS email,
    COALESCE(comp.company_name, cdm.company_name) AS company_name,

/* ===========================================================
   FOLIO SUMMARY (Room-wise)
=========================================================== */

    COALESCE(room_folio.total_debit, 0) AS room_total_debit,
    COALESCE(room_folio.total_credit, 0) AS room_total_credit,
    COALESCE(room_folio.balance, 0) AS room_balance,

/* ===========================================================
   CHECKIN FOLIO SUMMARY (Overall)
=========================================================== */

    COALESCE(cgfm.total_debit, 0) AS checkin_total_debit,
    COALESCE(cgfm.total_credit, 0) AS checkin_total_credit,
    COALESCE(cgfm.balance, 0) AS checkin_balance,

/* ===========================================================
   ROOM CHARGES SUMMARY
=========================================================== */

    COALESCE(cdm.pax, 0) AS pax_count,
    COALESCE(cdm.room_tariff, 0) AS pax_price,
    COALESCE(cdm.cgst_amount + cdm.sgst_amount + cdm.igst_amount, 0) AS pax_tax,

    COALESCE(cdm.ex_pax, 0) AS ex_pax_count,
    COALESCE(cdm.ex_pax_charge, 0) AS ex_pax_price,
    COALESCE(cdm.ex_cgst_amount + cdm.ex_sgst_amount + cdm.ex_igst_amount, 0) AS ex_pax_tax,
    COALESCE(cdm.ex_pax_charge, 0) AS ex_pax_total,

    COALESCE(cdm.child_paid, 0) AS child_count,
    COALESCE(cdm.child_paid_amount, 0) AS child_price,
    COALESCE(cdm.child_cgst_amount + cdm.child_sgst_amount + cdm.child_igst_amount, 0) AS child_tax,
    COALESCE(cdm.child_paid_amount, 0) AS child_total,

    COALESCE(cdm.driver, 0) AS driver_count,
    COALESCE(cdm.driver_charge, 0) AS driver_price,
    COALESCE(cdm.driver_cgst_amount + cdm.driver_sgst_amount + cdm.driver_igst_amount, 0) AS driver_tax,
    COALESCE(cdm.driver_charge, 0) AS driver_total,

/* ===========================================================
   CHECKOUT SUMMARY
=========================================================== */

    cm.total_amount AS grand_total,
    cm.tot_discount_amount AS total_discount,
    cm.tot_advance AS total_advance,
    COALESCE(cgfm.balance, 0) AS balance_payable,

/* ===========================================================
   ROOM COUNT
=========================================================== */

    /* एकूण rooms count */
    room_count.total_rooms

FROM checkin_master cm

/* ===========================================================
   LATEST ROOM DETAIL - प्रत्येक room साठी स्वतंत्र row
=========================================================== */

INNER JOIN checkin_detail_master cdm
    ON cm.checkin_id = cdm.checkin_id
    AND cdm.is_settle = 0

/* ===========================================================
   ROOM WISE FOLIO SUMMARY
=========================================================== */

LEFT JOIN
(
    SELECT
        checkin_id,
        room_id,
        SUM(debit_amount) AS total_debit,
        SUM(credit_amount) AS total_credit,
        SUM(debit_amount - credit_amount) AS balance
    FROM checkin_guest_folio_master
    GROUP BY checkin_id, room_id

) room_folio
    ON room_folio.checkin_id = cdm.checkin_id
    AND room_folio.room_id = cdm.room_id

/* ===========================================================
   CHECKIN WISE FOLIO SUMMARY
=========================================================== */

LEFT JOIN
(
    SELECT
        checkin_id,
        SUM(debit_amount) AS total_debit,
        SUM(credit_amount) AS total_credit,
        SUM(debit_amount - credit_amount) AS balance
    FROM checkin_guest_folio_master
    GROUP BY checkin_id

) cgfm
    ON cgfm.checkin_id = cm.checkin_id

/* ===========================================================
   GUEST MASTER
=========================================================== */

LEFT JOIN guest_master gm
    ON gm.guest_id = cdm.guest_id

/* ===========================================================
   COMPANY MASTER
=========================================================== */

LEFT JOIN company_master comp
    ON comp.company_id = gm.company_id

/* ===========================================================
   ROOM COUNT
=========================================================== */

LEFT JOIN
(
    SELECT
        checkin_id,
        COUNT(*) AS total_rooms
    FROM checkin_detail_master
    WHERE is_settle = 0
    GROUP BY checkin_id

) room_count
    ON room_count.checkin_id = cm.checkin_id

/* ===========================================================
   FILTER
=========================================================== */

WHERE cm.hotelid = p_hotel_id

AND
(
    p_checkin_id = 0
    OR
    cm.checkin_id = p_checkin_id
)

/* ===========================================================
   ORDER
=========================================================== */

ORDER BY
    cm.checkin_id DESC,
    cdm.room_number;

END