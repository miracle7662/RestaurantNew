const db = require('./backend/config/db');

// Get the structure of the KOT print settings table
const tableInfo = db.prepare("PRAGMA table_info(mstkot_print_settings)").all();
console.log('KOT Print Settings Table Structure:');
tableInfo.forEach(col => {
  console.log(`${col.name}: ${col.type}`);
});

// Check if outlet 107 exists
const outlet = db.prepare('SELECT outletid, outlet_name FROM mst_outlets WHERE outletid = 107').get();
console.log('Outlet 107:', outlet);

// Check if KOT settings exist for outlet 107
const existingKotSettings = db.prepare('SELECT * FROM mstkot_print_settings WHERE outletid = 107').get();
console.log('Existing KOT Settings for outlet 107:', existingKotSettings);

if (!existingKotSettings) {
  console.log('Creating KOT print settings for outlet 107...');

  // Count the number of columns
  const columnCount = tableInfo.length;
  console.log('Number of columns:', columnCount);

  // Create placeholders for the INSERT statement
  const placeholders = Array(columnCount - 1).fill('?').join(', '); // -1 because outletid is the first column
  const columns = tableInfo.slice(1).map(col => col.name).join(', '); // Skip outletid

  console.log('Columns:', columns);
  console.log('Placeholders:', placeholders);

  // Insert default KOT print settings
  const insertStmt = db.prepare(`
    INSERT INTO mstkot_print_settings (outletid, ${columns})
    VALUES (?, ${placeholders})
  `);

  // Create default values array (all 0s or default strings)
  const defaultValues = [
    107, // outletid
    0, // customer_on_kot_dine_in
    0, // customer_on_kot_pickup
    0, // customer_on_kot_delivery
    0, // customer_on_kot_quick_bill
    'NAME_ONLY', // customer_kot_display_option
    0, // group_kot_items_by_category
    0, // hide_table_name_quick_bill
    1, // show_new_order_tag
    'New', // new_order_tag_label
    1, // show_running_order_tag
    'Running', // running_order_tag_label
    'DIN-', // dine_in_kot_no
    'PUP-', // pickup_kot_no
    'DEL-', // delivery_kot_no
    'QBL-', // quick_bill_kot_no
    0, // modifier_default_option
    0, // print_kot_both_languages
    0, // show_alternative_item
    0, // show_captain_username
    0, // show_covers_as_guest
    1, // show_item_price
    0, // show_kot_no_quick_bill
    1, // show_kot_note
    0, // show_online_order_otp
    0, // show_order_id_quick_bill
    0, // show_order_id_online_order
    0, // show_order_no_quick_bill_section
    1, // show_order_type_symbol
    1, // show_store_name
    0, // show_terminal_username
    0, // show_username
    1 // show_waiter
  ];

  console.log('Number of values to insert:', defaultValues.length);

  try {
    insertStmt.run(...defaultValues);
    console.log('Successfully created KOT print settings for outlet 107');
  } catch (error) {
    console.error('Error creating KOT settings:', error);
  }
} else {
  console.log('KOT settings already exist for outlet 107');
}

// Verify the KOT settings were created
const verifyKotSettings = db.prepare('SELECT outletid FROM mstkot_print_settings WHERE outletid = 107').get();
console.log('Verification - KOT Settings for outlet 107:', verifyKotSettings);
