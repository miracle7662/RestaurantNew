const db = require('../config/db')

// Get brands/hotels based on user role
exports.getBrands = (req, res) => {
  try {
    const { role_level, hotelid } = req.query

    let query = 'SELECT hotelid, hotel_name FROM msthotelmasters' // status = 0 means status
    let params = []

    // If user is hotel_admin, only show their hotel
    if (role_level === 'hotel_admin' && hotelid) {
      query += ' WHERE hotelid = ?'
      params.push(hotelid)
    }
    // If user is superadmin, show all hotels (no additional WHERE clause)

    const brands = db.prepare(query).all(...params)
    res.json(brands)
  } catch (error) {
    console.error('Error fetching brands:', error)
    res.status(500).json({ error: 'Failed to fetch brands' })
  }
}

exports.getOutlets = (req, res) => { // Assuming this is the endpoint
  try {
    const { role_level, brandId, hotelid, userid } = req.query;
    const user = req.user || {};

    console.log('Received req.query:', req.query);

    let query = `
          SELECT o.*,o.outletid, o.outlet_name, o.outlet_code, 
             b.hotel_name as brand_name
      FROM mst_outlets o
      INNER JOIN msthotelmasters b ON o.hotelid = b.hotelid
      left JOIN user_outlet_mapping uom ON o.outletid = uom.outletid
      left JOIN mst_users u ON u.userid = uom.userid  
      where     
    `;
    
    const params = [];
    
    switch (role_level) {
      case 'superadmin':
        break; // All active outlets
      case 'brand_admin':
        query += '  o.brand_id = ?';
        params.push(brandId);
        break;
      case 'hotel_admin':
        query += '  o.hotelid = ?';
        params.push(hotelid);
        break;
      case 'outlet_user':
        query += '  o.hotelid = ? AND uom.userid = ?';
        params.push(hotelid, userid || user.userid);
        if (!params[params.length - 1]) {
          return res.status(400).json({ message: 'User ID is required for outlet_user' });
        }
        break;
      default:
        return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    query += ' ORDER BY o.outlet_name';
    
    console.log('Constructed query:', query, 'with params:', params);
    const outlets = db.prepare(query).all(...params);
    console.log('Found outlets:', outlets);
    
    if (outlets.length === 0) {
      return res.status(404).json({ message: 'No outlets found for the user' });
    }
    
    res.json(outlets);
  } catch (error) {
    console.error('Error fetching outlets:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
exports.addOutlet = (req, res) => {
  try {
    const {
      outlet_name,
      hotelid,
      market_id,
      outlet_code,
      phone,
      email,
      website,
      address,
      city,
      zip_code,
      country,
      timezone,
      start_day_time,
      close_day_time,
      next_reset_bill_date,
      next_reset_bill_days,
      next_reset_kot_date,
      next_reset_kot_days,
      contact_phone,
      notification_email,
      description,
      logo,
      gst_no,
      fssai_no,
      status,
      digital_order,
      created_by_id,
    } = req.body

    // Validate required fields
    if (!outlet_name) {
      return res.status(400).json({ error: 'Outlet name is required' })
    }

    // Start a transaction to ensure atomicity
    db.exec('BEGIN TRANSACTION');

    // Insert into mst_outlets
    const outletStmt = db.prepare(`
            INSERT INTO mst_outlets (
                outlet_name, hotelid, market_id, outlet_code, phone, email, website,
                address, city, zip_code, country, timezone, start_day_time, close_day_time,
                next_reset_bill_date, next_reset_bill_days, next_reset_kot_date, next_reset_kot_days,
                contact_phone, notification_email, description, logo, gst_no, fssai_no,
                status, digital_order, created_by_id, created_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)

    const outletResult = outletStmt.run(
      outlet_name,
      hotelid,
      market_id,
      outlet_code,
      phone,
      email,
      website,
      address,
      city,
      zip_code,
      country,
      timezone,
      start_day_time,
      close_day_time,
      next_reset_bill_date,
      next_reset_bill_days,
      next_reset_kot_date,
      next_reset_kot_days,
      contact_phone,
      notification_email,
      description,
      logo,
      gst_no,
      fssai_no,
      status,
      digital_order || 0,
      created_by_id,
      new Date().toISOString(),
    )

    const outletId = outletResult.lastInsertRowid;

    // Insert default settings into outlet_settings
    const settingsStmt = db.prepare(`
      INSERT INTO mstoutlet_settings (
        outletid,
        send_order_notification,
        bill_number_length,
        next_reset_order_number_date,
        next_reset_order_number_days,
        decimal_points,
        bill_round_off,
        enable_loyalty,
        multiple_price_setting,
        verify_pos_system_login,
        table_reservation,
        auto_update_pos,
        send_report_email,
        send_report_whatsapp,
        allow_multiple_tax,
        enable_call_center,
        bharatpe_integration,
        phonepe_integration,
        reelo_integration,
        tally_integration,
        sunmi_integration,
        zomato_pay_integration,
        zomato_enabled,
        swiggy_enabled,
        rafeeq_enabled,
        noon_food_enabled,
        magicpin_enabled,
        dotpe_enabled,
        cultfit_enabled,
        ubereats_enabled,
        scooty_enabled,
        dunzo_enabled,
        foodpanda_enabled,
        amazon_enabled,
        talabat_enabled,
        deliveroo_enabled,
        careem_enabled,
        jahez_enabled,
        eazydiner_enabled,
        radyes_enabled,
        goshop_enabled,
        chatfood_enabled,
        cutfit_enabled,
        jubeat_enabled,
        thrive_enabled,
        fidoo_enabled,
        mrsool_enabled,
        swiggystore_enabled,
        zomatormarket_enabled,
        hungerstation_enabled,
        instashop_enabled,
        eteasy_enabled,
        smiles_enabled,
        toyou_enabled,
        dca_enabled,
        ordable_enabled,
        beanz_enabled,
        cari_enabled,
        the_chefz_enabled,
        keeta_enabled,
        notification_channel
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?)
    `);

    settingsStmt.run(
      outletId,
      'ALL', // send_order_notification
      2, // bill_number_length
      null, // next_reset_order_number_date
      'Reset Order Number Daily', // next_reset_order_number_days
      2, // decimal_points
      0, // bill_round_off
      0, // enable_loyalty
      0, // multiple_price_setting
      0, // verify_pos_system_login
      0, // table_reservation
      0, // auto_update_pos
      0, // send_report_email
      0, // send_report_whatsapp
      0, // allow_multiple_tax
      0, // enable_call_center
      0, // bharatpe_integration
      0, // phonepe_integration
      0, // reelo_integration
      0, // tally_integration
      0, // sunmi_integration
      0, // zomato_pay_integration
      0, // zomato_enabled
      0, // swiggy_enabled
      0, // rafeeq_enabled
      0, // noon_food_enabled
      0, // magicpin_enabled
      0, // dotpe_enabled
      0, // cultfit_enabled
      0, // ubereats_enabled
      0, // scooty_enabled
      0, // dunzo_enabled
      0, // foodpanda_enabled
      0, // amazon_enabled
      0, // talabat_enabled
      0, // deliveroo_enabled
      0, // careem_enabled
      0, // jahez_enabled
      0, // eazydiner_enabled
      0, // radyes_enabled
      0, // goshop_enabled
      0, // chatfood_enabled
      0, // cutfit_enabled
      0, // jubeat_enabled
      0, // thrive_enabled
      0, // fidoo_enabled
      0, // mrsool_enabled
      0, // swiggystore_enabled
      0, // zomatormarket_enabled
      0, // hungerstation_enabled
      0, // instashop_enabled
      0, // eteasy_enabled
      0, // smiles_enabled
      0, // toyou_enabled
      0, // dca_enabled
      0, // ordable_enabled
      0, // beanz_enabled
      0, // cari_enabled
      0, // the_chefz_enabled
      0, // keeta_enabled
      'SMS' // notification_channel
    );

    // Insert default settings into mstbill_preview_settings
    const billPreviewStmt = db.prepare(`
      INSERT INTO mstbill_preview_settings (
        outletid,
        outlet_name,
        email,
        website,
        upi_id,
        bill_prefix,
        secondary_bill_prefix,
        bar_bill_prefix,
        show_upi_qr,
        enabled_bar_section,
        show_phone_on_bill,
        note,
        footer_note,
        field1,
        field2,
        field3,
        field4,
        fssai_no
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    billPreviewStmt.run(
      outletId,
      outlet_name || '', // outlet_name
      email || '', // email
      website || '', // website
      '', // upi_id
      'BILL-', // bill_prefix
      'SEC-', // secondary_bill_prefix
      'BAR-', // bar_bill_prefix
      0, // show_upi_qr
      0, // enabled_bar_section
      contact_phone || '', // show_phone_on_bill
      '', // note
      '', // footer_note
      '', // field1
      '', // field2
      '', // field3
      '', // field4
      fssai_no || '' // fssai_no
    );

    // Insert default settings into mstkot_print_settings
    const kotPrintStmt = db.prepare(`
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    kotPrintStmt.run(
      outletId,
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
    );

    // Insert default settings into mstbill_print_settings
    const billPrintStmt = db.prepare(`
      INSERT INTO mstbills_print_settings (
        outletid,
        bill_title_dine_in,
        bill_title_pickup,
        bill_title_delivery,
        bill_title_quick_bill,
        mask_order_id,
        modifier_default_option_bill,
        print_bill_both_languages,
        show_alt_item_title_bill,
        show_alt_name_bill,
        show_bill_amount_words,
        show_bill_no_bill,
        show_bill_number_prefix_bill,
        show_bill_print_count,
        show_brand_name_bill,
        show_captain_bill,
        show_covers_bill,
        show_custom_qr_codes_bill,
        show_customer_gst_bill,
        show_customer_bill,
        show_customer_paid_amount,
        show_date_bill,
        show_default_payment,
        show_discount_reason_bill,
        show_due_amount_bill,
        show_ebill_invoice_qrcode,
        show_item_hsn_code_bill,
        show_item_level_charges_separately,
        show_item_note_bill,
        show_items_sequence_bill,
        show_kot_number_bill,
        show_logo_bill,
        show_order_id_bill,
        show_order_no_bill,
        show_order_note_bill,
        order_type_dine_in,
        order_type_pickup,
        order_type_delivery,
        order_type_quick_bill,
        show_outlet_name_bill,
        payment_mode_dine_in,
        payment_mode_pickup,
        payment_mode_delivery,
        payment_mode_quick_bill,
        table_name_dine_in,
        table_name_pickup,
        table_name_delivery,
        table_name_quick_bill,
        show_tax_charge_bill,
        show_username_bill,
        show_waiter_bill,
        show_zatca_invoice_qr,
        show_customer_address_pickup_bill,
        show_order_placed_time,
        hide_item_quantity_column,
        hide_item_rate_column,
        hide_item_total_column,
        hide_total_without_tax
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    billPrintStmt.run(
      outletId,
      1, // bill_title_dine_in
      1, // bill_title_pickup
      1, // bill_title_delivery
      1, // bill_title_quick_bill
      0, // mask_order_id
      0, // modifier_default_option_bill
      0, // print_bill_both_languages
      0, // show_alt_item_title_bill
      0, // show_alt_name_bill
      1, // show_bill_amount_words
      1, // show_bill_no_bill
      1, // show_bill_number_prefix_bill
      0, // show_bill_print_count
      1, // show_brand_name_bill
      0, // show_captain_bill
      0, // show_covers_bill
      0, // show_custom_qr_codes_bill
      0, // show_customer_gst_bill
      1, // show_customer_bill
      1, // show_customer_paid_amount
      1, // show_date_bill
      1, // show_default_payment
      0, // show_discount_reason_bill
      1, // show_due_amount_bill
      0, // show_ebill_invoice_qrcode
      0, // show_item_hsn_code_bill
      0, // show_item_level_charges_separately
      1, // show_item_note_bill
      1, // show_items_sequence_bill
      0, // show_kot_number_bill
      1, // show_logo_bill
      0, // show_order_id_bill
      1, // show_order_no_bill
      1, // show_order_note_bill
      1, // order_type_dine_in
      1, // order_type_pickup
      1, // order_type_delivery
      1, // order_type_quick_bill
      1, // show_outlet_name_bill
      1, // payment_mode_dine_in
      1, // payment_mode_pickup
      1, // payment_mode_delivery
      1, // payment_mode_quick_bill
      1, // table_name_dine_in
      0, // table_name_pickup
      0, // table_name_delivery
      0, // table_name_quick_bill
      1, // show_tax_charge_bill
      0, // show_username_bill
      1, // show_waiter_bill
      0, // show_zatca_invoice_qr
      0, // show_customer_address_pickup_bill
      1, // show_order_placed_time
      0, // hide_item_quantity_column
      0, // hide_item_rate_column
      0, // hide_item_total_column
      0 // hide_total_without_tax
    );

    // Insert default settings into mstgeneral_settings
    const generalSettingsStmt = db.prepare(`
  INSERT INTO mstgeneral_settings (
    outletid,
    customize_url_links,
    allow_charges_after_bill_print,
    allow_discount_after_bill_print,
    allow_discount_before_save,
    allow_pre_order_tahd,
    ask_covers,
    ask_covers_captain,
    ask_custom_order_id_quick_bill,
    ask_custom_order_type_quick_bill,
    ask_payment_mode_on_save_bill,
    ask_waiter,
    ask_otp_change_order_status_order_window,
    ask_otp_change_order_status_receipt_section,
    auto_accept_remote_kot,
    auto_out_of_stock,
    auto_sync,
    category_time_for_pos,
    count_sales_after_midnight,
    customer_display,
    customer_mandatory,
    default_ebill_check,
    default_send_delivery_boy_check,
    edit_customize_order_number,
    enable_backup_notification_service,
    enable_customer_display_access,
    filter_items_by_order_type,
    generate_reports_start_close_dates,
    hide_clear_data_check_logout,
    hide_item_price_options,
    hide_load_menu_button,
    make_cancel_delete_reason_compulsory,
    make_discount_reason_mandatory,
    make_free_cancel_bill_reason_mandatory,
    make_payment_ref_number_mandatory,
    mandatory_delivery_boy_selection,
    mark_order_as_transfer_order,
    online_payment_auto_settle,
    order_sync_settings,
    separate_billing_by_section,
    set_entered_amount_as_opening,
    show_alternative_item_report_print,
    show_clear_sales_report_logout,
    show_order_no_label_pos,
    show_payment_history_button,
    show_remote_kot_option,
    show_send_payment_link,
    stock_availability_display,
    todays_report,
    upi_payment_sound_notification,
    use_separate_bill_numbers_online,
    when_send_todays_report,
    enable_currency_conversion,
    enable_user_login_validation,
    allow_closing_shift_despite_bills,
    show_real_time_kot_bill_notifications,
    created_at,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

generalSettingsStmt.run(
  outletId,
  JSON.stringify([]), // customize_url_links
  0, // allow_charges_after_bill_print
  0, // allow_discount_after_bill_print
  1, // allow_discount_before_save
  0, // allow_pre_order_tahd
  JSON.stringify({ dineIn: true, pickup: false, delivery: false, quickBill: false }), // ask_covers
  0, // ask_covers_captain
  0, // ask_custom_order_id_quick_bill
  0, // ask_custom_order_type_quick_bill
  1, // ask_payment_mode_on_save_bill
  JSON.stringify({ dineIn: true, pickup: false, delivery: false, quickBill: false }), // ask_waiter
  0, // ask_otp_change_order_status_order_window
  0, // ask_otp_change_order_status_receipt_section
  0, // auto_accept_remote_kot
  0, // auto_out_of_stock
  1, // auto_sync
  '', // category_time_for_pos
  0, // count_sales_after_midnight
  JSON.stringify({ media: [] }), // customer_display
  JSON.stringify({ dineIn: true, pickup: true, delivery: true, quickBill: false }), // customer_mandatory
  1, // default_ebill_check
  0, // default_send_delivery_boy_check
  '', // edit_customize_order_number
  0, // enable_backup_notification_service
  0, // enable_customer_display_access
  0, // filter_items_by_order_type
  0, // generate_reports_start_close_dates
  0, // hide_clear_data_check_logout
  0, // hide_item_price_options
  0, // hide_load_menu_button
  1, // make_cancel_delete_reason_compulsory
  1, // make_discount_reason_mandatory
  1, // make_free_cancel_bill_reason_mandatory
  0, // make_payment_ref_number_mandatory
  0, // mandatory_delivery_boy_selection
  0, // mark_order_as_transfer_order
  0, // online_payment_auto_settle
  JSON.stringify({ autoSyncInterval: '300', syncBatchPacketSize: '100' }), // order_sync_settings
  0, // separate_billing_by_section
  0, // set_entered_amount_as_opening
  0, // show_alternative_item_report_print
  0, // show_clear_sales_report_logout
  1, // show_order_no_label_pos
  1, // show_payment_history_button
  0, // show_remote_kot_option
  0, // show_send_payment_link
  1, // stock_availability_display
  JSON.stringify({
    salesSummary: true,
    orderTypeSummary: true,
    paymentTypeSummary: true,
    discountSummary: true,
    expenseSummary: true,
    billSummary: true,
    deliveryBoySummary: true,
    waiterSummary: true,
    kitchenDepartmentSummary: true,
    categorySummary: true,
    soldItemsSummary: true,
    cancelItemsSummary: true,
    walletSummary: true,
    duePaymentReceivedSummary: true,
    duePaymentReceivableSummary: true,
    paymentVarianceSummary: true,
    currencyDenominationsSummary: true
  }), // todays_report
  0, // upi_payment_sound_notification
  0, // use_separate_bill_numbers_online
  'END_OF_DAY', // when_send_todays_report
  0, // enable_currency_conversion
  1, // enable_user_login_validation
  0, // allow_closing_shift_despite_bills
  1, // show_real_time_kot_bill_notifications
  new Date().toISOString(), // created_at
  new Date().toISOString() // updated_at
);

    // Insert default settings into mstonline_orders_settings
    const onlineOrdersStmt = db.prepare(`
      INSERT INTO mstonline_orders_settings (
        outletid,
        show_in_preparation_kds,
        auto_accept_online_order,
        customize_order_preparation_time,
        online_orders_time_delay,
        pull_order_on_accept,
        show_addons_separately,
        show_complete_online_order_id,
        show_online_order_preparation_time,
        update_food_ready_status_kds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    onlineOrdersStmt.run(
      outletId,
      1, // show_in_preparation_kds
      0, // auto_accept_online_order
      0, // customize_order_preparation_time
      0, // online_orders_time_delay
      0, // pull_order_on_accept
      0, // show_addons_separately
      1, // show_complete_online_order_id
      1, // show_online_order_preparation_time
      1 // update_food_ready_status_kds
    );

    // Commit the transaction
    db.exec('COMMIT');

    res.json({
      id: outletId,
      outlet_name,
      hotelid,
      market_id,
      outlet_code,
      phone,
      email,
      website,
      address,
      city,
      zip_code,
      country,
      timezone,
      start_day_time,
      close_day_time,
      next_reset_bill_date,
      next_reset_bill_days,
      next_reset_kot_date,
      next_reset_kot_days,
      contact_phone,
      notification_email,
      description,
      logo,
      gst_no,
      fssai_no,
      status,
      digital_order: digital_order || 0,
      created_by_id,
      created_date: new Date().toISOString(),
    })
  } catch (error) {
    // Rollback the transaction on error
    db.exec('ROLLBACK');
    console.error('Error adding outlet:', error)
    res.status(500).json({ error: 'Failed to add outlet' })
  }
}
exports.updateOutlet = (req, res) => {
  try {
    const { id } = req.params
    const {
      outlet_name,
      hotelid,
      market_id,
      outlet_code,
      phone,
      email,
      website,
      address,
      city,
      zip_code,
      country,
      timezone,
      start_day_time,
      close_day_time,
      next_reset_bill_date,
      next_reset_bill_days,
      next_reset_kot_date,
      next_reset_kot_days,
      contact_phone,
      notification_email,
      description,
      logo,
      gst_no,
      fssai_no,
      status,
      digital_order,
      updated_by_id,
    } = req.body

    // Validate required fields
    if (!outlet_name) {
      return res.status(400).json({ error: 'Outlet name is required' })
    }

    const stmt = db.prepare(`
            UPDATE mst_outlets SET 
                outlet_name = ?, hotelid = ?, market_id = ?, outlet_code = ?, phone = ?, 
                email = ?, website = ?, address = ?, city = ?, zip_code = ?, country = ?, 
                timezone = ?, start_day_time = ?, close_day_time = ?, next_reset_bill_date = ?, 
                next_reset_bill_days = ?, next_reset_kot_date = ?, next_reset_kot_days = ?, 
                contact_phone = ?, notification_email = ?, description = ?, logo = ?, 
                gst_no = ?, fssai_no = ?, status = ?, digital_order = ?, updated_by_id = ?, 
                updated_date = ? 
            WHERE outletid = ?
        `)

    stmt.run(
      outlet_name,
      hotelid,
      market_id,
      outlet_code,
      phone,
      email,
      website,
      address,
      city,
      zip_code,
      country,
      timezone,
      start_day_time,
      close_day_time,
      next_reset_bill_date,
      next_reset_bill_days,
      next_reset_kot_date,
      next_reset_kot_days,
      contact_phone,
      notification_email,
      description,
      logo,
      gst_no,
      fssai_no,
      status,
      digital_order,
      updated_by_id,
      new Date().toISOString(),
      id,
    )

    res.json({
      id,
      outlet_name,
      hotelid,
      market_id,
      outlet_code,
      phone,
      email,
      website,
      address,
      city,
      zip_code,
      country,
      timezone,
      start_day_time,
      close_day_time,
      next_reset_bill_date,
      next_reset_bill_days,
      next_reset_kot_date,
      next_reset_kot_days,
      contact_phone,
      notification_email,
      description,
      logo,
      gst_no,
      fssai_no,
      status,
      digital_order,
      updated_by_id,
      updated_date: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error updating outlet:', error)
    res.status(500).json({ error: 'Failed to update outlet' })
  }
}

exports.deleteOutlet = (req, res) => {
  try {
    const { id } = req.params
    const stmt = db.prepare('DELETE FROM mst_outlets WHERE outletid = ?')
    stmt.run(id)
    res.json({ message: 'Outlet deleted successfully' })
  } catch (error) {
    console.error('Error deleting outlet:', error)
    res.status(500).json({ error: 'Failed to delete outlet' })
  }
}

exports.getOutletById = (req, res) => {
  try {
    const { id } = req.params
    const outlet = db
      .prepare(
        `
            SELECT o.*, h.hotel_name as brand_name 
            FROM mst_outlets o 
            LEFT JOIN msthotelmasters h ON o.hotelid = h.hotelid 
            WHERE o.outletid = ?
        `,
      )
      .get(id)

    if (!outlet) {
      return res.status(404).json({ error: 'Outlet not found' })
    }

    res.json(outlet)
  } catch (error) {
    console.error('Error fetching outlet:', error)
    res.status(500).json({ error: 'Failed to fetch outlet' })
  }
}

// Get outlet settings by outletid
exports.getOutletSettings = (req, res) => {
  try {
    const { outletid } = req.params

    // Validate outletid
    if (!outletid || isNaN(outletid)) {
      return res.status(400).json({ error: 'Valid outlet ID is required' })
    }

    const settings = db
      .prepare(
        `
        SELECT * FROM mstoutlet_settings 
        WHERE outletid = ?
        `
      )
      .get(outletid)

    if (!settings) {
      return res.status(404).json({ error: 'Outlet settings not found' })
    }

    res.json(settings)
  } catch (error) {
    console.error('Error fetching outlet settings:', error)
    res.status(500).json({ error: 'Failed to fetch outlet settings' })
  }
}

// Update outlet settings by outletid
exports.updateOutletSettings = (req, res) => {
  try {
    const { outletid } = req.params
    const {
      send_order_notification,
      bill_number_length,
      next_reset_order_number_date,
      next_reset_order_number_days,
      decimal_points,
      bill_round_off,
      enable_loyalty,
      multiple_price_setting,
      verify_pos_system_login,
      table_reservation,
      auto_update_pos,
      send_report_email,
      send_report_whatsapp,
      allow_multiple_tax,
      enable_call_center,
      bharatpe_integration,
      phonepe_integration,
      reelo_integration,
      tally_integration,
      sunmi_integration,
      zomato_pay_integration,
      zomato_enabled,
      swiggy_enabled,
      rafeeq_enabled,
      noon_food_enabled,
      magicpin_enabled,
      dotpe_enabled,
      cultfit_enabled,
      ubereats_enabled,
      scooty_enabled,
      dunzo_enabled,
      foodpanda_enabled,
      amazon_enabled,
      talabat_enabled,
      deliveroo_enabled,
      careem_enabled,
      jahez_enabled,
      eazydiner_enabled,
      radyes_enabled,
      goshop_enabled,
      chatfood_enabled,
      cutfit_enabled,
      jubeat_enabled,
      thrive_enabled,
      fidoo_enabled,
      mrsool_enabled,
      swiggystore_enabled,
      zomatormarket_enabled,
      hungerstation_enabled,
      instashop_enabled,
      eteasy_enabled,
      smiles_enabled,
      toyou_enabled,
      dca_enabled,
      ordable_enabled,
      beanz_enabled,
      cari_enabled,
      the_chefz_enabled,
      keeta_enabled,
      notification_channel
    } = req.body

    // Validate outletid
    if (!outletid || isNaN(outletid)) {
      return res.status(400).json({ error: 'Valid outlet ID is required' })
    }

    // Check if outlet exists
    const outletExists = db
      .prepare('SELECT outletid FROM mst_outlets WHERE outletid = ?')
      .get(outletid)

    if (!outletExists) {
      return res.status(404).json({ error: 'Outlet not found' })
    }

    // Start transaction
    db.exec('BEGIN TRANSACTION')

    // Check if settings already exist for this outlet
    const existingSettings = db
      .prepare('SELECT outletid FROM mstoutlet_settings WHERE outletid = ?')
      .get(outletid)

    if (existingSettings) {
      // Update existing settings
      const updateStmt = db.prepare(`
        UPDATE mstoutlet_settings SET
          send_order_notification = ?,
          bill_number_length = ?,
          next_reset_order_number_date = ?,
          next_reset_order_number_days = ?,
          decimal_points = ?,
          bill_round_off = ?,
          enable_loyalty = ?,
          multiple_price_setting = ?,
          verify_pos_system_login = ?,
          table_reservation = ?,
          auto_update_pos = ?,
          send_report_email = ?,
          send_report_whatsapp = ?,
          allow_multiple_tax = ?,
          enable_call_center = ?,
          bharatpe_integration = ?,
          phonepe_integration = ?,
          reelo_integration = ?,
          tally_integration = ?,
          sunmi_integration = ?,
          zomato_pay_integration = ?,
          zomato_enabled = ?,
          swiggy_enabled = ?,
          rafeeq_enabled = ?,
          noon_food_enabled = ?,
          magicpin_enabled = ?,
          dotpe_enabled = ?,
          cultfit_enabled = ?,
          ubereats_enabled = ?,
          scooty_enabled = ?,
          dunzo_enabled = ?,
          foodpanda_enabled = ?,
          amazon_enabled = ?,
          talabat_enabled = ?,
          deliveroo_enabled = ?,
          careem_enabled = ?,
          jahez_enabled = ?,
          eazydiner_enabled = ?,
          radyes_enabled = ?,
          goshop_enabled = ?,
          chatfood_enabled = ?,
          cutfit_enabled = ?,
          jubeat_enabled = ?,
          thrive_enabled = ?,
          fidoo_enabled = ?,
          mrsool_enabled = ?,
          swiggystore_enabled = ?,
          zomatormarket_enabled = ?,
          hungerstation_enabled = ?,
          instashop_enabled = ?,
          eteasy_enabled = ?,
          smiles_enabled = ?,
          toyou_enabled = ?,
          dca_enabled = ?,
          ordable_enabled = ?,
          beanz_enabled = ?,
          cari_enabled = ?,
          the_chefz_enabled = ?,
          keeta_enabled = ?,
          notification_channel = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE outletid = ?
      `)

      updateStmt.run(
        send_order_notification,
        bill_number_length,
        next_reset_order_number_date,
        next_reset_order_number_days,
        decimal_points,
        bill_round_off,
        enable_loyalty,
        multiple_price_setting,
        verify_pos_system_login,
        table_reservation,
        auto_update_pos,
        send_report_email,
        send_report_whatsapp,
        allow_multiple_tax,
        enable_call_center,
        bharatpe_integration,
        phonepe_integration,
        reelo_integration,
        tally_integration,
        sunmi_integration,
        zomato_pay_integration,
        zomato_enabled,
        swiggy_enabled,
        rafeeq_enabled,
        noon_food_enabled,
        magicpin_enabled,
        dotpe_enabled,
        cultfit_enabled,
        ubereats_enabled,
        scooty_enabled,
        dunzo_enabled,
        foodpanda_enabled,
        amazon_enabled,
        talabat_enabled,
        deliveroo_enabled,
        careem_enabled,
        jahez_enabled,
        eazydiner_enabled,
        radyes_enabled,
        goshop_enabled,
        chatfood_enabled,
        cutfit_enabled,
        jubeat_enabled,
        thrive_enabled,
        fidoo_enabled,
        mrsool_enabled,
        swiggystore_enabled,
        zomatormarket_enabled,
        hungerstation_enabled,
        instashop_enabled,
        eteasy_enabled,
        smiles_enabled,
        toyou_enabled,
        dca_enabled,
        ordable_enabled,
        beanz_enabled,
        cari_enabled,
        the_chefz_enabled,
        keeta_enabled,
        notification_channel,
        outletid
      )
    } else {
      // Insert new settings
      const insertStmt = db.prepare(`
        INSERT INTO mstoutlet_settings (
          outletid,
          send_order_notification,
          bill_number_length,
          next_reset_order_number_date,
          next_reset_order_number_days,
          decimal_points,
          bill_round_off,
          enable_loyalty,
          multiple_price_setting,
          verify_pos_system_login,
          table_reservation,
          auto_update_pos,
          send_report_email,
          send_report_whatsapp,
          allow_multiple_tax,
          enable_call_center,
          bharatpe_integration,
          phonepe_integration,
          reelo_integration,
          tally_integration,
          sunmi_integration,
          zomato_pay_integration,
          zomato_enabled,
          swiggy_enabled,
          rafeeq_enabled,
          noon_food_enabled,
          magicpin_enabled,
          dotpe_enabled,
          cultfit_enabled,
          ubereats_enabled,
          scooty_enabled,
          dunzo_enabled,
          foodpanda_enabled,
          amazon_enabled,
          talabat_enabled,
          deliveroo_enabled,
          careem_enabled,
          jahez_enabled,
          eazydiner_enabled,
          radyes_enabled,
          goshop_enabled,
          chatfood_enabled,
          cutfit_enabled,
          jubeat_enabled,
          thrive_enabled,
          fidoo_enabled,
          mrsool_enabled,
          swiggystore_enabled,
          zomatormarket_enabled,
          hungerstation_enabled,
          instashop_enabled,
          eteasy_enabled,
          smiles_enabled,
          toyou_enabled,
          dca_enabled,
          ordable_enabled,
          beanz_enabled,
          cari_enabled,
          the_chefz_enabled,
          keeta_enabled,
          notification_channel
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      insertStmt.run(
        outletid,
        send_order_notification,
        bill_number_length,
        next_reset_order_number_date,
        next_reset_order_number_days,
        decimal_points,
        bill_round_off,
        enable_loyalty,
        multiple_price_setting,
        verify_pos_system_login,
        table_reservation,
        auto_update_pos,
        send_report_email,
        send_report_whatsapp,
        allow_multiple_tax,
        enable_call_center,
        bharatpe_integration,
        phonepe_integration,
        reelo_integration,
        tally_integration,
        sunmi_integration,
        zomato_pay_integration,
        zomato_enabled,
        swiggy_enabled,
        rafeeq_enabled,
        noon_food_enabled,
        magicpin_enabled,
        dotpe_enabled,
        cultfit_enabled,
        ubereats_enabled,
        scooty_enabled,
        dunzo_enabled,
        foodpanda_enabled,
        amazon_enabled,
        talabat_enabled,
        deliveroo_enabled,
        careem_enabled,
        jahez_enabled,
        eazydiner_enabled,
        radyes_enabled,
        goshop_enabled,
        chatfood_enabled,
        cutfit_enabled,
        jubeat_enabled,
        thrive_enabled,
        fidoo_enabled,
        mrsool_enabled,
        swiggystore_enabled,
        zomatormarket_enabled,
        hungerstation_enabled,
        instashop_enabled,
        eteasy_enabled,
        smiles_enabled,
        toyou_enabled,
        dca_enabled,
        ordable_enabled,
        beanz_enabled,
        cari_enabled,
        the_chefz_enabled,
        keeta_enabled,
        notification_channel
      )
    }

    // Commit transaction
    db.exec('COMMIT')

    // Return updated settings
    const updatedSettings = db
      .prepare('SELECT * FROM mstoutlet_settings WHERE outletid = ?')
      .get(outletid)

    res.json({
      message: 'Outlet settings updated successfully',
      settings: updatedSettings
    })

  } catch (error) {
    // Rollback transaction on error
    db.exec('ROLLBACK')
    console.error('Error updating outlet settings:', error)
    res.status(500).json({ error: 'Failed to update outlet settings' })
  }
}



