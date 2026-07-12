DELIMITER $$

CREATE PROCEDURE `sp_daily_sales_summary`(
    IN p_hotelid INT,
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        DATE(cd.checkout_datetime) AS sale_date,
        DAYNAME(cd.checkout_datetime) AS day_name,
        MONTHNAME(cd.checkout_datetime) AS month_name,
        YEAR(cd.checkout_datetime) AS year,
        
        -- Guest Statistics
        COUNT(DISTINCT cd.guest_id) AS unique_guests,
        COUNT(DISTINCT cd.checkout_id) AS total_checkouts,
        COUNT(DISTINCT cd.checkin_id) AS total_checkins,
        
        -- Room Statistics
        SUM(cd.no_of_days) AS total_room_nights,
        AVG(cd.no_of_days) AS avg_stay_duration,
        COUNT(DISTINCT cd.room_id) AS unique_rooms_used,
        
        -- Revenue
        ROUND(SUM(cd.room_tariff), 2) AS total_room_revenue,
        ROUND(SUM(cd.ex_pax_charge), 2) AS total_extra_pax,
        ROUND(SUM(cd.child_paid_amount), 2) AS total_child_charges,
        ROUND(SUM(cd.driver_charge), 2) AS total_driver_charges,
        ROUND(SUM(cd.service_charge_amount), 2) AS total_service_charge,
        ROUND(SUM(cd.cess_amount), 2) AS total_cess,
        
        -- Discounts
        ROUND(SUM(cd.discount_amount), 2) AS total_discounts,
        
        -- GST
        ROUND(SUM(cd.cgst_amount + cd.ex_cgst_amount + cd.child_cgst_amount + cd.driver_cgst_amount), 2) AS total_cgst,
        ROUND(SUM(cd.sgst_amount + cd.ex_sgst_amount + cd.child_sgst_amount + cd.driver_sgst_amount), 2) AS total_sgst,
        ROUND(SUM(cd.igst_amount + cd.ex_igst_amount + cd.child_igst_amount + cd.driver_igst_amount), 2) AS total_igst,
        ROUND(SUM(cd.cgst_amount + cd.sgst_amount + cd.igst_amount +
              cd.ex_cgst_amount + cd.ex_sgst_amount + cd.ex_igst_amount +
              cd.child_cgst_amount + cd.child_sgst_amount + cd.child_igst_amount +
              cd.driver_cgst_amount + cd.driver_sgst_amount + cd.driver_igst_amount), 2) AS total_gst,
        
        -- Grand Total
        ROUND(SUM(cd.room_tariff + cd.ex_pax_charge + cd.child_paid_amount + cd.driver_charge + 
              cd.service_charge_amount + cd.cess_amount + cd.cgst_amount + cd.sgst_amount + cd.igst_amount +
              cd.ex_cgst_amount + cd.ex_sgst_amount + cd.ex_igst_amount +
              cd.child_cgst_amount + cd.child_sgst_amount + cd.child_igst_amount +
              cd.driver_cgst_amount + cd.driver_sgst_amount + cd.driver_igst_amount - cd.discount_amount), 2) AS net_sales,
        
        -- Advance
        ROUND(SUM(cm.tot_advance), 2) AS total_advance_applied,
        
        -- Payment Summary
        ROUND(SUM(s.Amount), 2) AS total_payment_received,
        ROUND(SUM(s.TipAmount), 2) AS total_tips,
        ROUND(SUM(s.Refund), 2) AS total_refunds,
        
        -- LDG Bills
        COUNT(DISTINCT cm.ldg_bill_no) AS total_ldg_bills,
        
        -- Top Room Category
        (SELECT cd2.room_category_name 
         FROM checkout_detail cd2 
         WHERE DATE(cd2.checkout_datetime) = DATE(cd.checkout_datetime)
         AND cd2.is_checkout = 1
         GROUP BY cd2.room_category_name 
         ORDER BY SUM(cd2.room_tariff) DESC 
         LIMIT 1) AS top_room_category,
        
        -- Top Guest
        (SELECT g2.name 
         FROM checkout_detail cd2 
         JOIN guest_master g2 ON cd2.guest_id = g2.guest_id
         WHERE DATE(cd2.checkout_datetime) = DATE(cd.checkout_datetime)
         AND cd2.is_checkout = 1
         GROUP BY cd2.guest_id 
         ORDER BY SUM(cd2.room_tariff) DESC 
         LIMIT 1) AS top_guest
        
    FROM checkout_detail cd
    LEFT JOIN checkout_master cm ON cd.checkout_id = cm.checkout_id AND cm.status = 'checked_out'
    LEFT JOIN ldgsettlement s ON cd.checkout_id = s.checkout_id
    WHERE cd.is_checkout = 1
        AND cd.hotelid = p_hotelid
        AND DATE(cd.checkout_datetime) BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(cd.checkout_datetime)
    ORDER BY sale_date DESC;
END$$

DELIMITER ;