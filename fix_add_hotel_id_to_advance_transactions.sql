CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_add_checkin`(

-- Guest
IN p_guest_id INT,

-- Booking
IN p_booking VARCHAR(100),
IN p_plan_name VARCHAR(100),

-- Dates
IN p_checkin_datetime DATETIME,
IN p_checkout_datetime DATETIME,

-- Room
IN p_room_no VARCHAR(5000),
IN p_room_id VARCHAR(255),

-- Totals
IN p_tot_room_tariff DECIMAL(10,2),
IN p_tot_ex_pax_charge DECIMAL(10,2),
IN p_tot_child_paid_amount DECIMAL(10,2),
IN p_tot_driver_charge DECIMAL(10,2),
IN p_tot_discount_amount DECIMAL(10,2),

IN p_tot_cgst_amount DECIMAL(10,2),
IN p_tot_sgst_amount DECIMAL(10,2),
IN p_tot_igst_amount DECIMAL(10,2),

IN p_tot_ex_cgst_amount DECIMAL(10,2),
IN p_tot_ex_sgst_amount DECIMAL(10,2),
IN p_tot_ex_igst_amount DECIMAL(10,2),

IN p_tot_child_cgst_amount DECIMAL(10,2),
IN p_tot_child_sgst_amount DECIMAL(10,2),
IN p_tot_child_igst_amount DECIMAL(10,2),

IN p_tot_driver_cgst_amount DECIMAL(10,2),
IN p_tot_driver_sgst_amount DECIMAL(10,2),
IN p_tot_driver_igst_amount DECIMAL(10,2),

IN p_tot_service_charge_amount DECIMAL(10,2),
IN p_tot_cess_amount DECIMAL(10,2),
IN p_tot_advance DECIMAL(10,2),

-- Other
IN p_hotelid INT,
IN p_outletid INT,

IN p_id_type VARCHAR(50),
IN p_id_number VARCHAR(100),

IN p_department_id INT,
IN p_department_name VARCHAR(100),

IN p_special_instruction TEXT,
IN p_message TEXT,

IN p_total_nights INT,
IN p_total_amount DECIMAL(10,2),

IN p_status VARCHAR(20),
IN p_created_by_id INT,

-- Payment Method
IN p_payment_method VARCHAR(50),

-- ========== NEW AGENT PARAMETERS ==========
IN p_travel_agent_id INT,
IN p_travel_agent_name VARCHAR(255),
IN p_agent_code VARCHAR(50),
IN p_commission_type VARCHAR(20),          -- e.g. 'PERCENTAGE' or 'FIXED'
IN p_commission_value DECIMAL(10,2),
IN p_agent_commission_amount DECIMAL(10,2),
IN p_agent_cgst_percent DECIMAL(10,2),
IN p_agent_cgst_amount DECIMAL(10,2),
IN p_agent_sgst_percent DECIMAL(10,2),
IN p_agent_sgst_amount DECIMAL(10,2),
IN p_agent_igst_percent DECIMAL(10,2),
IN p_agent_igst_amount DECIMAL(10,2),
IN p_agent_cess_percent DECIMAL(10,2),
IN p_agent_cess_amount DECIMAL(10,2),
IN p_agent_tds_percent DECIMAL(10,2),
IN p_agent_tds_amount DECIMAL(10,2),
IN p_agent_tcs_percent DECIMAL(10,2),
IN p_agent_tcs_amount DECIMAL(10,2),
IN p_agent_service_fee DECIMAL(10,2),
IN p_agent_total_commission DECIMAL(10,2),
IN p_agent_pay_to_hotel DECIMAL(10,2),
IN p_booking_id VARCHAR(100),
IN p_booking_date DATE,
-- ==========================================

-- JSON
IN p_details JSON,
IN p_room_charges JSON,
IN p_folio_entries JSON

)
sp_add_checkin:BEGIN

DECLARE v_checkin_id INT;
DECLARE v_first_detail_id INT DEFAULT NULL;
DECLARE v_current_reg_no VARCHAR(50);
DECLARE v_next_reg_no INT;
DECLARE v_formatted_reg_no VARCHAR(20);
DECLARE v_now DATETIME;
DECLARE v_hotel_exists INT DEFAULT 0;
DECLARE v_error_msg VARCHAR(500);
DECLARE v_debug_msg VARCHAR(1000);
DECLARE v_affected_rooms INT DEFAULT 0;

DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN

GET DIAGNOSTICS CONDITION 1
@sqlstate = RETURNED_SQLSTATE,
@errno = MYSQL_ERRNO,
@text = MESSAGE_TEXT;

ROLLBACK;

SELECT JSON_OBJECT(
'success',FALSE,
'message',CONCAT('Database Error : ',COALESCE(v_error_msg,'')),
'error',@text,
'sqlstate',@sqlstate,
'errno',@errno
) AS result;

END;

START TRANSACTION;

SET v_now=NOW();

/*--------------------------------------------------
Validation
--------------------------------------------------*/

IF p_hotelid IS NULL OR p_hotelid=0 THEN

SELECT JSON_OBJECT(
'success',FALSE,
'message','Hotel Id Required'
) AS result;

ROLLBACK;
LEAVE sp_add_checkin;

END IF;

IF p_checkin_datetime IS NULL THEN

SELECT JSON_OBJECT(
'success',FALSE,
'message','Checkin Date Required'
) AS result;

ROLLBACK;
LEAVE sp_add_checkin;

END IF;

/*--------------------------------------------------
REG NO
--------------------------------------------------*/

SELECT COUNT(*)
INTO v_hotel_exists
FROM ldg_bill_settings
WHERE hotelid=p_hotelid;

IF v_hotel_exists=0 THEN

INSERT INTO ldg_bill_settings
(
bill_no,
ldg_bill_no,
reg_no,
hotelid,
outletid
)
VALUES
(
1,
1,
'0',
p_hotelid,
COALESCE(p_outletid,1)
);

SET v_current_reg_no='0';

ELSE

SELECT reg_no
INTO v_current_reg_no
FROM ldg_bill_settings
WHERE hotelid=p_hotelid
FOR UPDATE;

END IF;

SET v_next_reg_no=CAST(v_current_reg_no AS UNSIGNED)+1;

SET v_formatted_reg_no=
CONCAT(
'REG',
LPAD(v_next_reg_no,4,'0')
);

/*--------------------------------------------------
INSERT CHECKIN MASTER
--------------------------------------------------*/

INSERT INTO checkin_master
(

guest_id,
reg_no,

booking,
plan_name,

checkin_datetime,

room_no,
room_id,

tot_room_tariff,
tot_ex_pax_charge,
tot_child_paid_amount,
tot_driver_charge,
tot_discount_amount,

tot_cgst_amount,
tot_sgst_amount,
tot_igst_amount,

tot_ex_cgst_amount,
tot_ex_sgst_amount,
tot_ex_igst_amount,

tot_child_cgst_amount,
tot_child_sgst_amount,
tot_child_igst_amount,

tot_driver_cgst_amount,
tot_driver_sgst_amount,
tot_driver_igst_amount,

tot_service_charge_amount,
tot_cess_amount,
tot_advance,

hotelid,
outletid, 

total_amount,
total_nights,

id_type,
id_number,

department_id,
department_name,

special_instruction,
message,

created_by_id,
created_date,
updated_by_id,
updated_date,

status,

payment_method,  -- <-- NEW FIELD ADDED

is_settle

)

VALUES
(

p_guest_id,
v_formatted_reg_no,

p_booking,
p_plan_name,

p_checkin_datetime,

p_room_no,
p_room_id,

p_tot_room_tariff,
p_tot_ex_pax_charge,
p_tot_child_paid_amount,
p_tot_driver_charge,
p_tot_discount_amount,

p_tot_cgst_amount,
p_tot_sgst_amount,
p_tot_igst_amount,

p_tot_ex_cgst_amount,
p_tot_ex_sgst_amount,
p_tot_ex_igst_amount,

p_tot_child_cgst_amount,
p_tot_child_sgst_amount,
p_tot_child_igst_amount,

p_tot_driver_cgst_amount,
p_tot_driver_sgst_amount,
p_tot_driver_igst_amount,

p_tot_service_charge_amount,
p_tot_cess_amount,
p_tot_advance,

p_hotelid,
p_outletid,

p_total_amount,
p_total_nights,

p_id_type,
p_id_number,

p_department_id,
p_department_name,

p_special_instruction,
p_message,

p_created_by_id,
v_now,
p_created_by_id,
v_now,

COALESCE(p_status,'active'),

p_payment_method,  -- <-- NEW VALUE

0

);

SET v_checkin_id=LAST_INSERT_ID();

UPDATE ldg_bill_settings
SET reg_no=CAST(v_next_reg_no AS CHAR)
WHERE hotelid=p_hotelid;

/*==========================================
PROCESS DETAILS JSON
===========================================*/

IF p_details IS NOT NULL
AND JSON_LENGTH(p_details) > 0 THEN

SET v_error_msg='Insert Checkin Detail';

SET @detail_index=0;

WHILE @detail_index<JSON_LENGTH(p_details) DO

SET @detail=
JSON_EXTRACT(
p_details,
CONCAT('$[',@detail_index,']')
);

INSERT INTO checkin_detail_master
(

checkin_id,
hotelid,

guest_id,
guest_name,
address,
mobile,

company_id,
company_name,
emailed,

room_id,
room_number,

room_category_id,
room_category_name,

converted_category_id,
converted_category_name,

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

tax,

created_date,
updated_date,
created_by_id,
updated_by_id,

is_settle

)

VALUES
(

v_checkin_id,
p_hotelid,

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.guest_id')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.guest_name')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.address')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.mobile')),

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.company_id')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.company_name')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.emailed')),

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.room_id')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.room_number')),

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.room_category_id')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.room_category_name')),

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.converted_category_id')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.converted_category_name')),

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.checkin_datetime')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.checkout_datetime')),

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.no_of_days')),

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.adults')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.pax')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.ex_pax')),

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.child_paid')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.child_unpaid')),

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.driver')),

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.room_tariff')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.ex_pax_charge')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.child_paid_amount')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.driver_charge')),

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.discount_percent')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.discount_amount')),

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.tax_percen_room')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.cgst_percent')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.cgst_amount')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.sgst_percent')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.sgst_amount')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.igst_percent')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.igst_amount')),

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.tax_percen_ex')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.ex_cgst_percent')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.ex_cgst_amount')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.ex_sgst_percent')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.ex_sgst_amount')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.ex_igst_percent')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.ex_igst_amount')),

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.tax_percen_child')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.child_cgst_percent')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.child_cgst_amount')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.child_sgst_percent')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.child_sgst_amount')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.child_igst_percent')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.child_igst_amount')),

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.tax_percen_driver')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.driver_cgst_percent')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.driver_cgst_amount')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.driver_sgst_percent')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.driver_sgst_amount')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.driver_igst_percent')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.driver_igst_amount')),

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.service_charge')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.service_charge_amount')),

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.cess_percent')),
JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.cess_amount')),

JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.tax')),

v_now,
v_now,

p_created_by_id,
p_created_by_id,

0

);

-- =========================================================
-- INSERT INTO agent_room_checkin FOR THIS ROOM
-- =========================================================
SET @v_room_tariff = JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.room_tariff'));
SET @v_no_of_days = JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.no_of_days'));
SET @v_discount_amount = JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.discount_amount'));
SET @v_ex_pax_charge = JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.ex_pax_charge'));
SET @v_child_paid_amount = JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.child_paid_amount'));
SET @v_driver_charge = JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.driver_charge'));
SET @v_tax = JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.tax'));

SET @v_total_room_charges = (@v_room_tariff * @v_no_of_days) - @v_discount_amount;
SET @v_total_extra_charges = @v_ex_pax_charge + @v_child_paid_amount + @v_driver_charge;
SET @v_grand_total = @v_total_room_charges + @v_total_extra_charges + @v_tax;

INSERT INTO agent_room_checkin (
    checkin_id,
    reg_no,
    hotelid,
    guest_id,
    agent_id,
    agent_name,
    agent_code,
    commission_type,
    commission_value,
    commission_amount,
    agent_cgst_percent,
    agent_cgst_amount,
    agent_sgst_percent,
    agent_sgst_amount,
    agent_igst_percent,
    agent_igst_amount,
    agent_cess_percent,
    agent_cess_amount,
    agent_tds_percent,
    agent_tds_amount,
    agent_tcs_percent,
    agent_tcs_amount,
    agent_service_fee,
    agent_total_commission,
    agent_pay_to_hotel,
    room_id,
    room_number,
    room_category_id,
    converted_category_id,
    total_room_charges,
    total_extra_charges,
    grand_total_amount,
    payment_method,
    plan_name,
    booking_id,
    booking_date,
    status,
    is_billed,
    is_dayend,
    created_by_id,
    created_date,
    updated_by_id,
    updated_date
)
VALUES (
    v_checkin_id,
    v_formatted_reg_no,
    p_hotelid,
    JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.guest_id')),
    p_travel_agent_id,
    p_travel_agent_name,
    p_agent_code,
    p_commission_type,
    p_commission_value,
    p_agent_commission_amount,
    p_agent_cgst_percent,
    p_agent_cgst_amount,
    p_agent_sgst_percent,
    p_agent_sgst_amount,
    p_agent_igst_percent,
    p_agent_igst_amount,
    p_agent_cess_percent,
    p_agent_cess_amount,
    p_agent_tds_percent,
    p_agent_tds_amount,
    p_agent_tcs_percent,
    p_agent_tcs_amount,
    p_agent_service_fee,
    p_agent_total_commission,
    p_agent_pay_to_hotel,
    JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.room_id')),
    JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.room_number')),
    JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.room_category_id')),
    JSON_UNQUOTE(JSON_EXTRACT(@detail,'$.converted_category_id')),
    @v_total_room_charges,
    @v_total_extra_charges,
    @v_grand_total,
    p_payment_method,
    p_plan_name,
    p_booking_id,
    p_booking_date,
    'active',
    0,
    0,
    p_created_by_id,
    v_now,
    p_created_by_id,
    v_now
);

IF v_first_detail_id IS NULL THEN
SET v_first_detail_id=LAST_INSERT_ID();
END IF;

SET @detail_index=@detail_index+1;

END WHILE;

END IF;
/*=========================================================
UPDATE ROOM STATUS
=========================================================*/

IF p_room_id IS NOT NULL
AND p_room_id <> ''
AND p_room_id <> '0'
THEN

    UPDATE room_master
    SET room_status_id = 2
    WHERE FIND_IN_SET(room_id, p_room_id) > 0
    AND hotelid = p_hotelid;

    SET v_affected_rooms = ROW_COUNT();

END IF;


/*=========================================================
UPDATE msttablemanagement STATUS
=========================================================*/


SET v_error_msg = 'Update Table Management Status';

UPDATE msttablemanagement
SET status = 0
WHERE hotelid = p_hotelid
  AND department_name = 'Room Service'
  AND FIND_IN_SET(
        TRIM(table_name COLLATE utf8mb4_general_ci),
        REPLACE(p_room_no COLLATE utf8mb4_general_ci, ' ', '')
      ) > 0;



/*=========================================================
PROCESS ROOM CHARGES
=========================================================*/

IF p_room_charges IS NOT NULL
AND JSON_LENGTH(p_room_charges) > 0
THEN

SET @charge_index=0;

WHILE @charge_index<JSON_LENGTH(p_room_charges) DO

SET @charge=
JSON_EXTRACT(
p_room_charges,
CONCAT('$[',@charge_index,']')
);

INSERT INTO checkin_guest_room_charges
(

checkin_id,
guest_id,
room_id,
category_id,

pax_count,
pax_price,
pax_tax,

ex_pax_count,
ex_pax_price,
ex_pax_tax,
ex_pax_tax_percent,
ex_pax_total,

child_count,
child_price,
child_tax,
child_tax_percent,
child_total,

driver_count,
driver_price,
driver_tax,
driver_tax_percent,
driver_total,

total_amount,

checkin_datetime,
checkout_datetime,

created_at,
updated_at

)

VALUES
(

v_checkin_id,

JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.guest_id')),
JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.room_id')),
JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.category_id')),

JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.pax_count')),
JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.pax_price')),
JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.pax_tax')),

JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.ex_pax_count')),
JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.ex_pax_price')),
JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.ex_pax_tax')),
JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.ex_pax_tax_percent')),
JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.ex_pax_total')),

JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.child_count')),
JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.child_price')),
JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.child_tax')),
JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.child_tax_percent')),
JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.child_total')),

JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.driver_count')),
JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.driver_price')),
JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.driver_tax')),
JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.driver_tax_percent')),
JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.driver_total')),

JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.total_amount')),

JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.checkin_datetime')),
JSON_UNQUOTE(JSON_EXTRACT(@charge,'$.checkout_datetime')),

v_now,
v_now

);

SET @charge_index=@charge_index+1;

END WHILE;

END IF;


/*=========================================================
PROCESS FOLIO
=========================================================*/

IF p_folio_entries IS NOT NULL
AND JSON_LENGTH(p_folio_entries)>0
THEN

SET @folio_index=0;

WHILE @folio_index<JSON_LENGTH(p_folio_entries) DO

SET @folio=
JSON_EXTRACT(
p_folio_entries,
CONCAT('$[',@folio_index,']')
);

INSERT INTO checkin_guest_folio_master
(

checkin_id,
hotel_id,
detail_id,
room_id,

transaction_type,
transaction_datetime,
description,

debit_amount,
credit_amount,

reference_number,
payment_method,

created_by_id,
created_date

)

VALUES
(

v_checkin_id,

p_hotelid,

v_first_detail_id,

JSON_UNQUOTE(JSON_EXTRACT(@folio,'$.room_id')),

JSON_UNQUOTE(JSON_EXTRACT(@folio,'$.transaction_type')),

JSON_UNQUOTE(JSON_EXTRACT(@folio,'$.transaction_datetime')),

JSON_UNQUOTE(JSON_EXTRACT(@folio,'$.description')),

JSON_UNQUOTE(JSON_EXTRACT(@folio,'$.debit_amount')),

JSON_UNQUOTE(JSON_EXTRACT(@folio,'$.credit_amount')),

JSON_UNQUOTE(JSON_EXTRACT(@folio,'$.reference_number')),

JSON_UNQUOTE(JSON_EXTRACT(@folio,'$.payment_method')),

p_created_by_id,

v_now

);

SET @folio_index=@folio_index+1;

END WHILE;

END IF;

/*=========================================================
COMMIT TRANSACTION
=========================================================*/

SET v_error_msg = 'Commit Transaction';

COMMIT;


/*=========================================================
SUCCESS RESPONSE
=========================================================*/

SELECT JSON_OBJECT(

    'success', TRUE,

    'message',
    CONCAT(
        'Check-In Created Successfully (',
        v_affected_rooms,
        ' Room(s))'
    ),

    'checkin_id', v_checkin_id,

    'reg_no', v_formatted_reg_no,

    'payment_method', p_payment_method,  -- <-- NEW

    'rooms_updated', v_affected_rooms,

    'created_datetime', DATE_FORMAT(v_now,'%Y-%m-%d %H:%i:%s')

) AS result;

END