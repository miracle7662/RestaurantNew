
const path = require('path');
const Database = require('better-sqlite3');

// ✅ Connect to SQLite DB (creates file if not exist)
// const db = new Database(path.join(__dirname, 'miresto.db'));
//const db = new Database(path.join('F:','newmidb', 'newmidb.db'));

// const db = new Database(path.join('D:','Restrauntdb', 'miresto.db')); //sudarshan

const db = new Database(path.join('D:', 'Restaurant_Database', 'miresto.db'));//Sharmin

//db = new Database(path.join('E:', 'ReactHotelData', 'miresto.db'));

// ✅ Create tables (once)
db.exec(`
  CREATE TABLE IF NOT EXISTS mstcountrymaster (
    countryid INTEGER PRIMARY KEY AUTOINCREMENT,
    country_name TEXT NOT NULL,
    country_code TEXT NOT NULL,
    country_capital TEXT NOT NULL,
    status INTEGER DEFAULT 1,
    created_by_id INTEGER,
    created_date TEXT,
    updated_by_id INTEGER,
    updated_date TEXT
  );
  CREATE TABLE IF NOT EXISTS mststatemaster (
    stateid INTEGER PRIMARY KEY AUTOINCREMENT,
    state_name TEXT NOT NULL,
    state_code TEXT NOT NULL,
    state_capital TEXT NOT NULL,
    countryid INTEGER,
    status INTEGER DEFAULT 1,
    created_by_id INTEGER,
    created_date TEXT,
    updated_by_id INTEGER,
    updated_date TEXT
  );

  CREATE TABLE IF NOT EXISTS mstcitymaster (
    cityid INTEGER PRIMARY KEY AUTOINCREMENT,
    city_name TEXT NOT NULL,
    city_Code TEXT NOT NULL,
    stateId INTEGER,    
    iscoastal BOOLEAN DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_by_id INTEGER,
    created_date TEXT,
    updated_by_id INTEGER,
    updated_date TEXT
  );
 
 CREATE TABLE IF NOT EXISTS mstunitmaster (
    unitid INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_name TEXT NOT NULL,        
    status INTEGER DEFAULT 1,
    created_by_id INTEGER,
    created_date TEXT,
    updated_by_id INTEGER,
    updated_date TEXT,
    hotelid INTEGER,
    client_code TEXT
);
CREATE TABLE IF NOT EXISTS mstkitchencategory(
kitchencategoryid INTEGER PRIMARY KEY AUTOINCREMENT,
Kitchen_Category TEXT(200),
alternative_category_name TEXT(200),
Description text(400),
alternative_category_Description TEXT(400),
digital_order_image TEXT(200),
categorycolor  TEXT(200),
status INTEGER ,
created_by_id INTEGER,
created_date DATETIME,
updated_by_id INTEGER,
updated_date DATETIME,
hotelid INTEGER,
marketid INTEGER
);

CREATE TABLE IF NOT EXISTS mstkitchensubcategory (
    kitchensubcategoryid INTEGER PRIMARY KEY AUTOINCREMENT,
  Kitchen_sub_category text(200),
kitchencategoryid INTEGER,
kitchenmaingroupid INTEGER,
status INTEGER ,
created_by_id INTEGER,
created_date DATETIME,
updated_by_id INTEGER,
updated_date DATETIME,
hotelid INTEGER,
marketid INTEGER
);

CREATE TABLE IF NOT EXISTS mstkitchenmaingroup (
kitchenmaingroupid INTEGER PRIMARY KEY AUTOINCREMENT,
Kitchen_main_Group text(200),
status INTEGER ,
created_by_id INTEGER,
created_date DATETIME,
updated_by_id INTEGER,
updated_date DATETIME,
hotelid INTEGER,
marketid INTEGER
);

CREATE TABLE IF NOT EXISTS msthoteltype (
hoteltypeid INTEGER PRIMARY KEY AUTOINCREMENT,
hotel_type text(200),
status INTEGER ,
created_by_id INTEGER,
created_date DATETIME,
updated_by_id INTEGER,
updated_date DATETIME,
hotelid INTEGER,
marketid INTEGER
);
CREATE TABLE IF NOT EXISTS mstuserType (
usertypeid INTEGER PRIMARY KEY AUTOINCREMENT,
User_type text(200),
status INTEGER ,
created_by_id INTEGER,
created_date DATETIME,
updated_by_id INTEGER,
updated_date DATETIME,
hotelid INTEGER,
marketid INTEGER
);


CREATE TABLE IF NOT EXISTS mstdesignation (
designationid INTEGER PRIMARY KEY AUTOINCREMENT,
Designation text(200),
status INTEGER ,
created_by_id INTEGER,
created_date DATETIME,
updated_by_id INTEGER,
updated_date DATETIME

);

    CREATE TABLE IF NOT EXISTS msthotelmasters (
        hotelid INTEGER PRIMARY KEY AUTOINCREMENT,
hotel_name text(200),
marketid	INTEGER,
short_name	text(200),
phone	text(40),
email  text(200),
fssai_no	text(200),
trn_gstno	text(200),
panno	text(200),
website	text(200),
address	text(400),
stateid	INTEGER,
hoteltypeid	INTEGER,
status INTEGER ,
created_by_id INTEGER,
created_date DATETIME,
updated_by_id INTEGER,
updated_date DATETIME,
Masteruserid INTEGER
);


CREATE TABLE IF NOT EXISTS mst_Item_Main_Group (
item_maingroupid INTEGER PRIMARY KEY AUTOINCREMENT,
item_group_name text(200),
status INTEGER ,
created_by_id INTEGER,
created_date DATETIME,
updated_by_id INTEGER,
updated_date DATETIME,
hotelid INTEGER,
marketid INTEGER
);

CREATE TABLE IF NOT EXISTS mst_Item_Group (
item_groupid INTEGER PRIMARY KEY AUTOINCREMENT,
itemgroupname text(200),
code INTEGER,
kitchencategoryid INTEGER ,
status INTEGER ,
created_by_id INTEGER,
created_date DATETIME,
updated_by_id INTEGER,
updated_date DATETIME,
hotelid INTEGER,
marketid INTEGER


);
CREATE TABLE IF NOT EXISTS mstmarkets (
    marketid INTEGER PRIMARY KEY AUTOINCREMENT,
    market_name TEXT NOT NULL,        
    status INTEGER DEFAULT 1,
    created_by_id INTEGER,
    created_date TEXT,
    updated_by_id INTEGER,
    updated_date TEXT
   
);

-- New tables for hierarchical user management
CREATE TABLE IF NOT EXISTS mst_users (
    userid INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role_level TEXT NOT NULL, -- 'superadmin', 'brand_admin', 'hotel_admin', 'outlet_user'
    parent_user_id INTEGER, -- References the user who created this user
    brand_id INTEGER, -- References HotelMasters.Hotelid
    hotelid INTEGER, -- References HotelMasters.Hotelid (for hotel_admin and outlet_user)
   
    designation TEXT, -- Designation for outlet user
    user_type TEXT, -- User type for outlet user
    shift_time TEXT, -- Shift time for outlet user
    mac_address TEXT, -- MAC address for outlet user
    assign_warehouse TEXT, -- Assigned warehouse for outlet user
    language_preference TEXT DEFAULT 'English', -- Language preference for outlet user
    address TEXT, -- Address for outlet user
    city TEXT, -- City for outlet user
    sub_locality TEXT, -- Sub locality for outlet user
    web_access INTEGER DEFAULT 0, -- Web access permission
    self_order INTEGER DEFAULT 1, -- Self order permission
    captain_app INTEGER DEFAULT 1, -- Captain app permission
    kds_app INTEGER DEFAULT 1, -- KDS app permission
    captain_old_kot_access TEXT DEFAULT 'Enabled', -- Captain old KOT access
    verify_mac_ip INTEGER DEFAULT 0, -- Verify MAC/IP setting
    status INTEGER,
    last_login DATETIME,
    created_by_id INTEGER,
    created_date DATETIME,
    updated_by_id INTEGER,
    updated_date DATETIME,
    FOREIGN KEY (parent_user_id) REFERENCES mst_users(userid),
    FOREIGN KEY (brand_id) REFERENCES HotelMasters(Hotelid),
    FOREIGN KEY (hotelid) REFERENCES HotelMasters(Hotelid)
   
);

CREATE TABLE IF NOT EXISTS user_outlet_mapping (
    mapping_id INTEGER PRIMARY KEY AUTOINCREMENT,
    userid INTEGER NOT NULL,
    hotelid INTEGER NOT NULL,
    outletid INTEGER NOT NULL,
    FOREIGN KEY (userid) REFERENCES mst_users(userid),
    FOREIGN KEY (outletid) REFERENCES mst_outlets(outletid),
    UNIQUE (userid, outletid)
);

CREATE TABLE IF NOT EXISTS mst_user_permissions (
    permissionid INTEGER PRIMARY KEY AUTOINCREMENT,
    userid INTEGER NOT NULL,
    module_name TEXT NOT NULL, -- 'orders', 'customers', 'menu', 'reports', etc.
    can_view INTEGER DEFAULT 0,
    can_create INTEGER DEFAULT 0,
    can_edit INTEGER DEFAULT 0,
    can_delete INTEGER DEFAULT 0,
    created_by_id INTEGER,
    created_date DATETIME,
    FOREIGN KEY (userid) REFERENCES mst_users(userid)
);

CREATE TABLE IF NOT EXISTS mst_brand_structure (
    structureid INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER NOT NULL,
    structure_type TEXT NOT NULL, -- 'single_outlet', 'multiple_outlets'
    has_separate_hotel_admin INTEGER DEFAULT 0, -- 0: brand_admin acts as hotel_admin, 1: separate hotel_admin
    created_by_id INTEGER,
    created_date DATETIME,
    FOREIGN KEY (brand_id) REFERENCES HotelMasters(Hotelid)
);

CREATE TABLE IF NOT EXISTS mst_outlets (
    outletid INTEGER PRIMARY KEY AUTOINCREMENT,
    outlet_name TEXT NOT NULL,
    hotelid INTEGER,
    market_id TEXT,
    outlet_code TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    zip_code TEXT,
    country TEXT,
    timezone TEXT,
    start_day_time TEXT,
    close_day_time TEXT,
    next_reset_bill_date TEXT,
    next_reset_bill_days TEXT,
    next_reset_kot_date TEXT,
    next_reset_kot_days TEXT,
    contact_phone TEXT,
    notification_email TEXT,
    description TEXT,
    logo TEXT,
    gst_no TEXT,
    fssai_no TEXT,
    status INTEGER DEFAULT 1,
    digital_order INTEGER DEFAULT 0,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by_id INTEGER,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by_id INTEGER,
    updated_date DATETIME,
    FOREIGN KEY (brand_id) REFERENCES HotelMasters(Hotelid)
);

CREATE TABLE IF NOT EXISTS msttablemanagement (
    tableid INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    hotelid INTEGER,
    outletid INTEGER NOT NULL,
    status INTEGER DEFAULT 1,
    created_by_id INTEGER,
    created_date DATETIME,
    updated_by_id INTEGER,
    updated_date DATETIME,
    marketid INTEGER
  );

 CREATE TABLE IF NOT EXISTS mstcustomer (
    customerid INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    countryCode TEXT NOT NULL,
    mobile TEXT NOT NULL,
    mail TEXT NOT NULL, 
    cityid TEXT NOT NULL,
    address1 TEXT ,
    address2 TEXT,
    stateid TEXT,
    pincode TEXT,
    gstNo TEXT,
    fssai TEXT,
    panNo TEXT,
    aadharNo TEXT,
    birthday TEXT,
    anniversary TEXT,
    createWallet INTEGER DEFAULT 0,
    created_by_id INTEGER,
    created_date DATETIME,
    updated_by_id INTEGER,
    updated_date DATETIME
);

-- Insert default SuperAdmin user (password will be properly hashed by the checkSuperAdmin script)
-- This is just a placeholder, the actual SuperAdmin will be created by the script


  CREATE TABLE IF NOT EXISTS mst_resttaxmaster (
  resttaxid INTEGER PRIMARY KEY AUTOINCREMENT,
  hotelid INTEGER,
  outletid INTEGER,
  isapplicablealloutlet INTEGER,
  resttax_name TEXT,
  resttax_value TEXT,
  restcgst TEXT,
  restsgst TEXT,
  restigst TEXT,
  taxgroupid INTEGER,
  status INTEGER DEFAULT 1,
  created_by_id INTEGER,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by_id INTEGER,
  updated_date DATETIME,
  FOREIGN KEY (hotelid) REFERENCES msthotelmasters(hotelid),
  FOREIGN KEY (outletid) REFERENCES mst_outlets(outletid),
  FOREIGN KEY (taxgroupid) REFERENCES msttaxgroup(taxgroupid)
);

CREATE TABLE IF NOT EXISTS mstrestmenu (
    restitemid                   INTEGER PRIMARY KEY AUTOINCREMENT,
    hotelid                      INTEGER REFERENCES msthotelmasters (hotelid),
    item_no                      INTEGER,
    item_name                    TEXT (200) NOT NULL,
    print_name                   TEXT (200),
    short_name                   TEXT (200),
  kitchen_category_id            INTEGER,
    kitchen_sub_category_id      INTEGER,
    kitchen_main_group_id        INTEGER,
    item_group_id                INTEGER,
    item_main_group_id           INTEGER,
    stock_unit                   INTEGER (11),
    price                        NUMERIC (19, 2) NOT NULL,
    taxgroupid                   INTEGER REFERENCES msttaxgroup (taxgroupid),
    is_runtime_rates             INTEGER NOT NULL DEFAULT 0 CHECK (is_runtime_rates IN (0,1)),
    is_common_to_all_departments INTEGER NOT NULL DEFAULT 0 CHECK (is_common_to_all_departments IN (0,1)),
    item_description             TEXT (400),
    item_hsncode                 TEXT (100),
    status                       INTEGER DEFAULT 1 CHECK (status IN (0,1)),
    created_by_id                INTEGER REFERENCES mst_users (userid),
    created_date                 DATETIME,
    updated_by_id                INTEGER REFERENCES mst_users (userid),
    updated_date                 DATETIME
);

CREATE TABLE IF NOT EXISTS mstrestmenudetails (
    itemdetailsid INTEGER PRIMARY KEY AUTOINCREMENT,
    restitemid    INTEGER NOT NULL REFERENCES mstrestmenu (restitemid),
    outletid      INTEGER REFERENCES mst_outlets (outletid),
    item_rate     NUMERIC (19, 2) NOT NULL,
    unitid        INTEGER,
    servingunitid INTEGER,
    IsConversion  INTEGER DEFAULT 0,  -- 0 = No, 1 = Yes
    hotelid       INTEGER REFERENCES msthotelmasters (hotelid)
);

-- Bill Preview Settings, KOT Print Settings, Bill Print Settings, General Settings, Online Orders Settings

CREATE TABLE IF NOT EXISTS mstbill_preview_settings (
    billpreviewsetting_id INTEGER PRIMARY KEY AUTOINCREMENT,
    outletid INT NOT NULL,
    outlet_name VARCHAR(255),
    email VARCHAR(255),
    website VARCHAR(255),
    upi_id VARCHAR(50),
    bill_prefix VARCHAR(50),
    secondary_bill_prefix VARCHAR(50),
    bar_bill_prefix VARCHAR(50),
    show_upi_qr BOOLEAN,
    enabled_bar_section BOOLEAN ,
    show_phone_on_bill VARCHAR(20),
    note TEXT,
    footer_note TEXT,
    field1 VARCHAR(100),
    field2 VARCHAR(100),
    field3 VARCHAR(100),
    field4 VARCHAR(100),
    fssai_no VARCHAR(50),
    FOREIGN KEY (outletid) REFERENCES mst_outlets(outletid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mstkot_print_settings (
    kot_printsetting_id INTEGER PRIMARY KEY AUTOINCREMENT,
    outletid INT NOT NULL,
    customer_on_kot_dine_in BOOLEAN,
    customer_on_kot_pickup BOOLEAN,
    customer_on_kot_delivery BOOLEAN,
    customer_on_kot_quick_bill BOOLEAN,
    customer_kot_display_option VARCHAR(50),
    group_kot_items_by_category BOOLEAN,
    hide_table_name_quick_bill BOOLEAN,
    show_new_order_tag BOOLEAN,
    new_order_tag_label VARCHAR(50),
    show_running_order_tag BOOLEAN,
    running_order_tag_label VARCHAR(50),
    dine_in_kot_no VARCHAR(50),
    pickup_kot_no VARCHAR(50),
    delivery_kot_no VARCHAR(50),
    quick_bill_kot_no VARCHAR(50),
    modifier_default_option BOOLEAN,
    print_kot_both_languages BOOLEAN,
    show_alternative_item BOOLEAN,
    show_captain_username BOOLEAN,
    show_covers_as_guest BOOLEAN,
    show_item_price BOOLEAN,
    show_kot_no_quick_bill BOOLEAN,
    show_kot_note BOOLEAN,
    show_online_order_otp BOOLEAN,
    show_order_id_quick_bill BOOLEAN,
    show_order_id_online_order BOOLEAN,
    show_order_no_quick_bill_section BOOLEAN,
    show_order_type_symbol BOOLEAN,
    show_store_name BOOLEAN,
    show_terminal_username BOOLEAN,
    show_username BOOLEAN,
    show_waiter BOOLEAN,
    FOREIGN KEY (outletid) REFERENCES mst_outlets(outletid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mstbills_print_settings (
    bill_printsetting_id INTEGER PRIMARY KEY AUTOINCREMENT,
    outletid INTEGER NOT NULL,
    bill_title_dine_in INTEGER DEFAULT 1,
    bill_title_pickup INTEGER DEFAULT 1,
    bill_title_delivery INTEGER DEFAULT 1,
    bill_title_quick_bill INTEGER DEFAULT 1,
    mask_order_id INTEGER DEFAULT 0,
    modifier_default_option_bill INTEGER DEFAULT 0,
    print_bill_both_languages INTEGER DEFAULT 0,
    show_alt_item_title_bill INTEGER DEFAULT 0,
    show_alt_name_bill INTEGER DEFAULT 0,
    show_bill_amount_words INTEGER DEFAULT 0,
    show_bill_no_bill INTEGER DEFAULT 1,
    show_bill_number_prefix_bill INTEGER DEFAULT 1,
    show_bill_print_count INTEGER DEFAULT 0,
    show_brand_name_bill INTEGER DEFAULT 1,
    show_captain_bill INTEGER DEFAULT 0,
    show_covers_bill INTEGER DEFAULT 1,
    show_custom_qr_codes_bill INTEGER DEFAULT 0,
    show_customer_gst_bill INTEGER DEFAULT 0,
    show_customer_bill INTEGER DEFAULT 1,
    show_customer_paid_amount INTEGER DEFAULT 1,
    show_date_bill INTEGER DEFAULT 1,
    show_default_payment INTEGER DEFAULT 1,
    show_discount_reason_bill INTEGER DEFAULT 0,
    show_due_amount_bill INTEGER DEFAULT 1,
    show_ebill_invoice_qrcode INTEGER DEFAULT 0,
    show_item_hsn_code_bill INTEGER DEFAULT 0,
    show_item_level_charges_separately INTEGER DEFAULT 0,
    show_item_note_bill INTEGER DEFAULT 1,
    show_items_sequence_bill INTEGER DEFAULT 1,
    show_kot_number_bill INTEGER DEFAULT 0,
    show_logo_bill INTEGER DEFAULT 1,
    show_order_id_bill INTEGER DEFAULT 0,
    show_order_no_bill INTEGER DEFAULT 1,
    show_order_note_bill INTEGER DEFAULT 1,
    order_type_dine_in INTEGER DEFAULT 1,
    order_type_pickup INTEGER DEFAULT 1,
    order_type_delivery INTEGER DEFAULT 1,
    order_type_quick_bill INTEGER DEFAULT 1,
    show_outlet_name_bill INTEGER DEFAULT 1,
    payment_mode_dine_in INTEGER DEFAULT 1,
    payment_mode_pickup INTEGER DEFAULT 1,
    payment_mode_delivery INTEGER DEFAULT 1,
    payment_mode_quick_bill INTEGER DEFAULT 1,
    table_name_dine_in INTEGER DEFAULT 1,
    table_name_pickup INTEGER DEFAULT 0,
    table_name_delivery INTEGER DEFAULT 0,
    table_name_quick_bill INTEGER DEFAULT 0,
    show_tax_charge_bill INTEGER DEFAULT 1,
    show_username_bill INTEGER DEFAULT 0,
    show_waiter_bill INTEGER DEFAULT 1,
    show_zatca_invoice_qr INTEGER DEFAULT 0,
    show_customer_address_pickup_bill INTEGER DEFAULT 0,
    show_order_placed_time INTEGER DEFAULT 1,
    hide_item_quantity_column INTEGER DEFAULT 0,
    hide_item_rate_column INTEGER DEFAULT 0,
    hide_item_total_column INTEGER DEFAULT 0,
    hide_total_without_tax INTEGER DEFAULT 0,
    FOREIGN KEY (outletid) REFERENCES mst_outlets(outletid) ON DELETE CASCADE,
    UNIQUE (outletid)
);

CREATE TABLE IF NOT EXISTS mstgeneral_settings (
    general_setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
    outletid INT NOT NULL,
    allow_charges_after_bill_print BOOLEAN,
    allow_discount_after_bill_print BOOLEAN,
    allow_discount_before_save BOOLEAN,
    allow_pre_order_tahd BOOLEAN,
    ask_covers_dine_in BOOLEAN,
    ask_covers_pickup BOOLEAN,
    ask_covers_delivery BOOLEAN,
    ask_covers_quick_bill BOOLEAN,
    ask_covers_captain BOOLEAN,
    ask_custom_order_id_quick_bill BOOLEAN,
    ask_custom_order_type_quick_bill BOOLEAN,
    ask_payment_mode_on_save_bill BOOLEAN,
    ask_waiter_dine_in BOOLEAN,
    ask_waiter_pickup BOOLEAN,
    ask_waiter_delivery BOOLEAN,
    ask_waiter_quick_bill BOOLEAN,
    ask_otp_change_order_status_order_window BOOLEAN,
    ask_otp_change_order_status_receipt_section BOOLEAN,
    auto_accept_remote_kot BOOLEAN,
    auto_out_of_stock BOOLEAN,
    auto_sync BOOLEAN,
    category_time_for_pos VARCHAR(50),
    count_sales_after_midnight BOOLEAN,
    customer_mandatory_dine_in BOOLEAN,
    customer_mandatory_pickup BOOLEAN,
    customer_mandatory_delivery BOOLEAN,
    customer_mandatory_quick_bill BOOLEAN,
    default_ebill_check BOOLEAN,
    default_send_delivery_boy_check BOOLEAN,
    edit_customize_order_number VARCHAR(50),
    enable_backup_notification_service BOOLEAN,
    enable_customer_display_access BOOLEAN,
    filter_items_by_order_type BOOLEAN,
    generate_reports_start_close_dates BOOLEAN,
    hide_clear_data_check_logout BOOLEAN,
    hide_item_price_options BOOLEAN,
    hide_load_menu_button BOOLEAN,
    make_cancel_delete_reason_compulsory BOOLEAN,
    make_discount_reason_mandatory BOOLEAN,
    make_free_cancel_bill_reason_mandatory BOOLEAN,
    make_payment_ref_number_mandatory BOOLEAN,
    mandatory_delivery_boy_selection BOOLEAN,
    mark_order_as_transfer_order BOOLEAN,
    online_payment_auto_settle BOOLEAN,
    order_sync_settings_auto_sync_interval VARCHAR(10),
    order_sync_settings_sync_batch_packet_size INT,
    separate_billing_by_section BOOLEAN,
    set_entered_amount_as_opening BOOLEAN,
    show_alternative_item_report_print BOOLEAN,
    show_clear_sales_report_logout BOOLEAN,
    show_order_no_label_pos BOOLEAN,
    show_payment_history_button BOOLEAN,
    show_remote_kot_option BOOLEAN,
    show_send_payment_link BOOLEAN,
    stock_availability_display BOOLEAN,
    todays_report_sales_summary BOOLEAN,
    todays_report_order_type_summary BOOLEAN,
    todays_report_payment_type_summary BOOLEAN,
    todays_report_discount_summary BOOLEAN,
    todays_report_expense_summary BOOLEAN,
    todays_report_bill_summary BOOLEAN,
    todays_report_delivery_boy_summary BOOLEAN,
    todays_report_waiter_summary BOOLEAN,
    todays_report_kitchen_department_summary BOOLEAN,
    todays_report_category_summary BOOLEAN,
    todays_report_sold_items_summary BOOLEAN,
    todays_report_cancel_items_summary BOOLEAN,
    todays_report_wallet_summary BOOLEAN,
    todays_report_due_payment_received_summary BOOLEAN,
    todays_report_due_payment_receivable_summary BOOLEAN,
    todays_report_payment_variance_summary BOOLEAN,
    todays_report_currency_denominations_summary BOOLEAN,
    when_send_todays_report VARCHAR(50),
    enable_currency_conversion BOOLEAN,
    enable_user_login_validation BOOLEAN,
    allow_closing_shift_despite_bills BOOLEAN,
    show_real_time_kot_bill_notifications BOOLEAN,
    use_separate_bill_numbers_online BOOLEAN,
    FOREIGN KEY (outletid) REFERENCES mst_outlets(outletid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mstonline_orders_settings (
    online_ordersetting_id INTEGER PRIMARY KEY AUTOINCREMENT,
    outletid INT NOT NULL,
    show_in_preparation_kds BOOLEAN,
    auto_accept_online_order BOOLEAN,
    customize_order_preparation_time BOOLEAN,
    online_orders_time_delay INT,
    pull_order_on_accept BOOLEAN,
    show_addons_separately BOOLEAN,
    show_complete_online_order_id BOOLEAN,
    show_online_order_preparation_time BOOLEAN,
    update_food_ready_status_kds BOOLEAN,
    FOREIGN KEY (outletid) REFERENCES mst_outlets(outletid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mstoutlet_settings (
    outletid INTEGER PRIMARY KEY AUTOINCREMENT,
    send_order_notification VARCHAR(50) DEFAULT 'ALL',
    bill_number_length INT DEFAULT 2,
    next_reset_order_number_date DATETIME,
    next_reset_order_number_days VARCHAR(50) DEFAULT 'Reset Order Number Daily',
    decimal_points INT DEFAULT 2,
    bill_round_off BOOLEAN,
    enable_loyalty BOOLEAN,
    multiple_price_setting BOOLEAN,
    verify_pos_system_login BOOLEAN,
    table_reservation BOOLEAN,
    auto_update_pos BOOLEAN,
    send_report_email BOOLEAN,
    send_report_whatsapp BOOLEAN,
    allow_multiple_tax BOOLEAN,
    enable_call_center BOOLEAN,
    bharatpe_integration BOOLEAN,
    phonepe_integration BOOLEAN,
    reelo_integration BOOLEAN,
    tally_integration BOOLEAN,
    sunmi_integration BOOLEAN,
    zomato_pay_integration BOOLEAN,
    zomato_enabled BOOLEAN,
    swiggy_enabled BOOLEAN,
    rafeeq_enabled BOOLEAN,
    noon_food_enabled BOOLEAN,
    magicpin_enabled BOOLEAN,
    dotpe_enabled BOOLEAN,
    cultfit_enabled BOOLEAN,
    ubereats_enabled BOOLEAN,
    scooty_enabled BOOLEAN,
    dunzo_enabled BOOLEAN,
    foodpanda_enabled BOOLEAN,
    amazon_enabled BOOLEAN,
    talabat_enabled BOOLEAN,
    deliveroo_enabled BOOLEAN,
    careem_enabled BOOLEAN,
    jahez_enabled BOOLEAN,
    eazydiner_enabled BOOLEAN,
    radyes_enabled BOOLEAN,
    goshop_enabled BOOLEAN,
    chatfood_enabled BOOLEAN,
    cutfit_enabled BOOLEAN,
    jubeat_enabled BOOLEAN,
    thrive_enabled BOOLEAN,
    fidoo_enabled BOOLEAN,
    mrsool_enabled BOOLEAN,
    swiggystore_enabled BOOLEAN,
    zomatormarket_enabled BOOLEAN,
    hungerstation_enabled BOOLEAN,
    instashop_enabled BOOLEAN,
    eteasy_enabled BOOLEAN,
    smiles_enabled BOOLEAN,
    toyou_enabled BOOLEAN,
    dca_enabled BOOLEAN,
    ordable_enabled BOOLEAN,
    beanz_enabled BOOLEAN,
    cari_enabled BOOLEAN,
    the_chefz_enabled BOOLEAN,
    keeta_enabled BOOLEAN,
    notification_channel VARCHAR(50) DEFAULT 'SMS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
   FOREIGN KEY (outletid) REFERENCES mst_outlets(outletid)
);

`);


module.exports = db;