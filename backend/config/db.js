
const path = require('path');
const Database = require('better-sqlite3');

// ✅ Connect to SQLite DB (creates file if not exist)
// const db = new Database(path.join(__dirname, 'miresto.db'));
//const db = new Database(path.join('F:','newmidb', 'newmidb.db'));

  // const db = new Database(path.join('D:','Restrauntdb', 'miresto.db')); //sudarshan

  // const db = new Database(path.join('D:','Restrauntdb', 'miresto.db')); //sudarshan

//const db = new Database(path.join('D:', 'Restaurant_Database', 'miresto.db'));//Sharmin

db = new Database(path.join('E:', 'ReactHotelData', 'miresto.db'));

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
`);


module.exports = db;