const db = require('./backend/config/db');

const outlet1 = db.prepare('SELECT * FROM mst_outlets WHERE outletid = 1').get();
console.log('Outlet 1:', outlet1);

if (outlet1) {
  const insertStmt = db.prepare(`
    INSERT INTO mst_outlets (outletid, outlet_name, hotelid, marketid, status, created_by_id, created_date, updated_by_id, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertStmt.run(19, 'Test Outlet 19', outlet1.hotelid, outlet1.marketid, outlet1.status, outlet1.created_by_id, outlet1.created_date, outlet1.updated_by_id, outlet1.updated_date);
  console.log('Inserted outlet 19');
}

const outlet19 = db.prepare('SELECT * FROM mst_outlets WHERE outletid = 19').get();
console.log('Outlet 19 after insert:', outlet19);

// Now insert default KOT settings for outlet 19
const kotStmt = db.prepare(`
  INSERT INTO mstkot_print_settings (
    outletid,
    customer_on_kot_dine_in,
    customer_on_kot_pickup,
    customer_on_kot_delivery,
    customer_on_kot_quick_bill,
    customer_kot_display_option,
    group_kot_items_by_category,
    hide_table_name_quick_bill,
    show_new_order_tag,
    new_order_tag_label,
    show_running_order_tag,
    running_order_tag_label,
    dine_in_kot_no,
    pickup_kot_no,
    delivery_kot_no,
    quick_bill_kot_no,
    modifier_default_option,
    print_kot_both_languages,
    show_alternative_item,
    show_captain_username,
    show_covers_as_guest,
    show_item_price,
    show_kot_no_quick_bill,
    show_kot_note,
    show_online_order_otp,
    show_order_id_quick_bill,
    show_order_id_online_order,
    show_order_no_quick_bill_section,
    show_order_type_symbol,
    show_store_name,
    show_terminal_username,
    show_username,
    show_waiter
  ) VALUES (?, 0, 0, 0, 0, 'name', 0, 0, 0, 'NEW', 0, 'RUNNING', 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
`);
kotStmt.run(19);
console.log('Inserted KOT settings for outlet 19');

const kotSettings19 = db.prepare('SELECT * FROM mstkot_print_settings WHERE outletid = 19').get();
console.log('KOT Settings for 19:', kotSettings19);
