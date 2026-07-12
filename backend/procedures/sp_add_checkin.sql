CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_daily_sales_summary`(
    IN p_hotelid INT,
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_limit INT
)
BEGIN
    SELECT 
        g.guest_id,
        g.name AS guest_name,
        g.mobile,
        g.email,
        g.organisation,
        g.guest_type,
        g.gender,
        
        -- Company Details
        cd.company_id,
        comp.company_name AS company_name,
        comp.gst_no AS company_gst,
        comp.mobile1 AS company_mobile,
        comp.email AS company_email,
        comp.credit_limit AS company_credit_limit,
        comp.credit_allowed AS company_credit_allowed,
        
        -- Room Details
        COUNT(DISTINCT cd.room_id) AS unique_rooms_used,
        GROUP_CONCAT(DISTINCT cd.room_number SEPARATOR ', ') AS room_numbers_used,
        GROUP_CONCAT(DISTINCT cd.room_category_name SEPARATOR ', ') AS room_categories_used,
        GROUP_CONCAT(DISTINCT CONCAT(cd.room_number, ' (', cd.room_category_name, ')') SEPARATOR ', ') AS room_details,
        
        -- Most Used Room
        (SELECT cd2.room_number 
         FROM checkout_detail cd2 
         WHERE cd2.guest_id = g.guest_id AND cd2.is_checkout = 1
         AND DATE(cd2.checkout_datetime) BETWEEN p_start_date AND p_end_date
         GROUP BY cd2.room_number 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) AS most_used_room,
        
        -- Preferred Room Category
        (SELECT cd2.room_category_name 
         FROM checkout_detail cd2 
         WHERE cd2.guest_id = g.guest_id AND cd2.is_checkout = 1
         AND DATE(cd2.checkout_datetime) BETWEEN p_start_date AND p_end_date
         GROUP BY cd2.room_category_name 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) AS preferred_room_category,
        
        -- LDG Bill Details
        COUNT(DISTINCT cm.ldg_bill_no) AS total_ldg_bills,
        GROUP_CONCAT(DISTINCT cm.ldg_bill_no SEPARATOR ', ') AS ldg_bill_numbers,
        GROUP_CONCAT(DISTINCT cm.reg_no SEPARATOR ', ') AS registration_numbers,
        GROUP_CONCAT(DISTINCT cm.booking SEPARATOR ', ') AS booking_references,
        
        -- Check-in/Check-out Statistics
        COUNT(DISTINCT cd.checkin_id) AS total_stays,
        COUNT(DISTINCT cd.checkout_id) AS total_checkouts,
        SUM(cd.no_of_days) AS total_room_nights,
        AVG(cd.no_of_days) AS avg_stay_duration,
        
        -- Revenue
        SUM(cd.room_tariff) AS total_room_revenue,
        SUM(cd.ex_pax_charge) AS total_extra_charges,
        SUM(cd.child_paid_amount) AS total_child_charges,
        SUM(cd.driver_charge) AS total_driver_charges,
        SUM(cd.service_charge_amount) AS total_service_charge,
        SUM(cd.cess_amount) AS total_cess,
        
        -- Discounts & GST
        SUM(cd.discount_amount) AS total_discounts_received,
        SUM(cd.cgst_amount + cd.ex_cgst_amount + cd.child_cgst_amount + cd.driver_cgst_amount) AS total_cgst,
        SUM(cd.sgst_amount + cd.ex_sgst_amount + cd.child_sgst_amount + cd.driver_sgst_amount) AS total_sgst,
        SUM(cd.igst_amount + cd.ex_igst_amount + cd.child_igst_amount + cd.driver_igst_amount) AS total_igst,
        
        -- Net Amount
        ROUND(SUM(cd.room_tariff + cd.ex_pax_charge + cd.child_paid_amount + cd.driver_charge + 
              cd.service_charge_amount + cd.cess_amount + cd.cgst_amount + cd.sgst_amount + cd.igst_amount +
              cd.ex_cgst_amount + cd.ex_sgst_amount + cd.ex_igst_amount +
              cd.child_cgst_amount + cd.child_sgst_amount + cd.child_igst_amount +
              cd.driver_cgst_amount + cd.driver_sgst_amount + cd.driver_igst_amount - cd.discount_amount), 2) AS total_spent,
        
        -- Advance
        SUM(cm.tot_advance) AS total_advance_paid,
        
        -- First & Last Visit
        MIN(cd.checkin_datetime) AS first_visit,
        MAX(cd.checkout_datetime) AS last_visit,
        DATEDIFF(MAX(cd.checkout_datetime), MIN(cd.checkin_datetime)) AS customer_lifecycle_days,
        
        -- Average per stay
        ROUND(AVG(cd.room_tariff + cd.ex_pax_charge + cd.child_paid_amount + cd.driver_charge + 
              cd.service_charge_amount + cd.cess_amount - cd.discount_amount), 2) AS avg_amount_per_stay,
        
        -- Loyalty Score
        CASE 
            WHEN COUNT(DISTINCT cd.checkin_id) >= 10 THEN 'Platinum'
            WHEN COUNT(DISTINCT cd.checkin_id) >= 5 THEN 'Gold'
            WHEN COUNT(DISTINCT cd.checkin_id) >= 3 THEN 'Silver'
            WHEN COUNT(DISTINCT cd.checkin_id) >= 1 THEN 'Bronze'
            ELSE 'New'
        END AS loyalty_level,
        
        -- Payment Summary
        SUM(s.Amount) AS total_payment_received,
        SUM(s.TipAmount) AS total_tips_given,
        SUM(s.Refund) AS total_refunds_received
        
    FROM guest_master g
    LEFT JOIN checkout_detail cd ON g.guest_id = cd.guest_id AND cd.is_checkout = 1
        AND DATE(cd.checkout_datetime) BETWEEN p_start_date AND p_end_date
    LEFT JOIN checkout_master cm ON cd.checkout_id = cm.checkout_id AND cm.status = 'checked_out'
    LEFT JOIN company_master comp ON cd.company_id = comp.company_id
    LEFT JOIN ldgsettlement s ON cd.checkout_id = s.checkout_id
    WHERE g.hotelid = p_hotelid
    GROUP BY g.guest_id, cd.company_id, comp.company_id
    HAVING total_spent > 0 OR total_checkouts > 0
    ORDER BY total_spent DESC
    LIMIT p_limit;
END