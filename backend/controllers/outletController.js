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

exports.getOutlets = (req, res) => {
  try {
    const { role_level, brandId, hotelid, userid } = req.query;
    const user = req.user || {};

    console.log('Received req.query:', req.query);

    let query = `
      SELECT DISTINCT o.*,
             b.hotel_name as brand_name
      FROM mst_outlets o
      INNER JOIN msthotelmasters b ON o.hotelid = b.hotelid
      WHERE 1=1
    `;

    const params = [];

    switch (role_level) {
      case 'superadmin':
        break; // All outlets (active and inactive)
      case 'brand_admin':
        query += ' AND o.brand_id = ?';
        params.push(brandId);
        break;
      case 'hotel_admin':
        query += ' AND o.hotelid = ?';
        params.push(hotelid);
        break;
      case 'outlet_user':
        query += ' AND o.hotelid = ?';
        params.push(hotelid);
        if (!hotelid) {
          return res.status(400).json({ message: 'Hotel ID is required for outlet_user' });
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
        notification_channel,
        ReverseQtyMode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?)
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
      'SMS', // notification_channel
      0 // ReverseQtyMode
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
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?)
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
      service_charges,
      invoice_message,
      include_tax_in_invoice,
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
      ReverseQtyMode
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
          include_tax_in_invoice = ?,
          service_charges = ?,
          invoice_message = ?,
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
          ReverseQtyMode = ?,
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
        include_tax_in_invoice,
        service_charges,
        invoice_message,
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
        ReverseQtyMode,
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
          include_tax_in_invoice,
          service_charges,
          invoice_message,
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
          ReverseQtyMode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);


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
        include_tax_in_invoice,
        service_charges,
        invoice_message,
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
        ReverseQtyMode
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


exports.updateBillPreviewSettings = (req, res) => {
  try {
    const { outletid } = req.params;
    const {
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
      fssai_no,
    } = req.body;

    // Validate required fields
    if (!outletid) {
      return res.status(400).json({ error: "Outlet ID is required" });
    }
    if (!outlet_name) {
      return res.status(400).json({ error: "Outlet name is required" });
    }

    const stmt = db.prepare(`
      UPDATE mstbill_preview_settings SET
        outlet_name = ?,
        email = ?,
        website = ?,
        upi_id = ?,
        bill_prefix = ?,
        secondary_bill_prefix = ?,
        bar_bill_prefix = ?,
        show_upi_qr = ?,
        enabled_bar_section = ?,
        show_phone_on_bill = ?,
        note = ?,
        footer_note = ?,
        field1 = ?,
        field2 = ?,
        field3 = ?,
        field4 = ?,
        fssai_no = ?
       
      WHERE outletid = ?
    `);

    stmt.run(
      outlet_name,
      email,
      website,
      upi_id,
      bill_prefix,
      secondary_bill_prefix,
      bar_bill_prefix,
      show_upi_qr ? 1 : 0,
      enabled_bar_section ? 1 : 0,
      show_phone_on_bill,
      note,
      footer_note,
      field1,
      field2,
      field3,
      field4,
      fssai_no,
     
      outletid
    );

    res.json({
      outletid,
      outlet_name,
      email,
      website,
      upi_id,
      bill_prefix,
      secondary_bill_prefix,
      bar_bill_prefix,
      show_upi_qr: !!show_upi_qr,
      enabled_bar_section: !!enabled_bar_section,
      show_phone_on_bill,
      note,
      footer_note,
      field1,
      field2,
      field3,
      field4,
      fssai_no,
      
    });
  } catch (error) {
    console.error("Error updating bill preview settings:", error);
    res
      .status(500)
      .json({ error: "Failed to update bill preview settings" });
  }
};



exports.updateKotPrintSettings = (req, res) => {
  try {
    const { outletid } = req.params;
    const {
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
      show_waiter,
    
    } = req.body;

    // Validate required fields
    if (!outletid) {
      return res.status(400).json({ error: "Outlet ID is required" });
    }

    const stmt = db.prepare(`
      UPDATE mstkot_print_settings SET
        customer_on_kot_dine_in = ?,
        customer_on_kot_pickup = ?,
        customer_on_kot_delivery = ?,
        customer_on_kot_quick_bill = ?,
        customer_kot_display_option = ?,
        group_kot_items_by_category = ?,
        hide_table_name_quick_bill = ?,
        show_new_order_tag = ?,
        new_order_tag_label = ?,
        show_running_order_tag = ?,
        running_order_tag_label = ?,
        dine_in_kot_no = ?,
        pickup_kot_no = ?,
        delivery_kot_no = ?,
        quick_bill_kot_no = ?,
        modifier_default_option = ?,
        print_kot_both_languages = ?,
        show_alternative_item = ?,
        show_captain_username = ?,
        show_covers_as_guest = ?,
        show_item_price = ?,
        show_kot_no_quick_bill = ?,
        show_kot_note = ?,
        show_online_order_otp = ?,
        show_order_id_quick_bill = ?,
        show_order_id_online_order = ?,
        show_order_no_quick_bill_section = ?,
        show_order_type_symbol = ?,
        show_store_name = ?,
        show_terminal_username = ?,
        show_username = ?,
        show_waiter = ?
       
      WHERE outletid = ?
    `);

    stmt.run(
      customer_on_kot_dine_in ? 1 : 0,
      customer_on_kot_pickup ? 1 : 0,
      customer_on_kot_delivery ? 1 : 0,
      customer_on_kot_quick_bill ? 1 : 0,
      customer_kot_display_option,
      group_kot_items_by_category ? 1 : 0,
      hide_table_name_quick_bill ? 1 : 0,
      show_new_order_tag ? 1 : 0,
      new_order_tag_label,
      show_running_order_tag ? 1 : 0,
      running_order_tag_label,
      dine_in_kot_no,
      pickup_kot_no,
      delivery_kot_no,
      quick_bill_kot_no,
      modifier_default_option ? 1 : 0,
      print_kot_both_languages ? 1 : 0,
      show_alternative_item ? 1 : 0,
      show_captain_username ? 1 : 0,
      show_covers_as_guest ? 1 : 0,
      show_item_price ? 1 : 0,
      show_kot_no_quick_bill ? 1 : 0,
      show_kot_note ? 1 : 0,
      show_online_order_otp ? 1 : 0,
      show_order_id_quick_bill ? 1 : 0,
      show_order_id_online_order ? 1 : 0,
      show_order_no_quick_bill_section ? 1 : 0,
      show_order_type_symbol ? 1 : 0,
      show_store_name ? 1 : 0,
      show_terminal_username ? 1 : 0,
      show_username ? 1 : 0,
      show_waiter ? 1 : 0,
   
      outletid
    );

    res.json({
      outletid,
      customer_on_kot_dine_in: !!customer_on_kot_dine_in,
      customer_on_kot_pickup: !!customer_on_kot_pickup,
      customer_on_kot_delivery: !!customer_on_kot_delivery,
      customer_on_kot_quick_bill: !!customer_on_kot_quick_bill,
      customer_kot_display_option,
      group_kot_items_by_category: !!group_kot_items_by_category,
      hide_table_name_quick_bill: !!hide_table_name_quick_bill,
      show_new_order_tag: !!show_new_order_tag,
      new_order_tag_label,
      show_running_order_tag: !!show_running_order_tag,
      running_order_tag_label,
      dine_in_kot_no,
      pickup_kot_no,
      delivery_kot_no,
      quick_bill_kot_no,
      modifier_default_option: !!modifier_default_option,
      print_kot_both_languages: !!print_kot_both_languages,
      show_alternative_item: !!show_alternative_item,
      show_captain_username: !!show_captain_username,
      show_covers_as_guest: !!show_covers_as_guest,
      show_item_price: !!show_item_price,
      show_kot_no_quick_bill: !!show_kot_no_quick_bill,
      show_kot_note: !!show_kot_note,
      show_online_order_otp: !!show_online_order_otp,
      show_order_id_quick_bill: !!show_order_id_quick_bill,
      show_order_id_online_order: !!show_order_id_online_order,
      show_order_no_quick_bill_section: !!show_order_no_quick_bill_section,
      show_order_type_symbol: !!show_order_type_symbol,
      show_store_name: !!show_store_name,
      show_terminal_username: !!show_terminal_username,
      show_username: !!show_username,
      show_waiter: !!show_waiter,
     
    });
  } catch (error) {
    console.error("Error updating KOT print settings:", error);
    res.status(500).json({ error: "Failed to update KOT print settings" });
  }
};

exports.updateBillPrintSettings = (req, res) => {
  try {
    const { outletid } = req.params;
    const data = req.body;

    const stmt = db.prepare(`
      UPDATE mstbills_print_settings SET
        bill_title_dine_in = ?,
        bill_title_pickup = ?,
        bill_title_delivery = ?,
        bill_title_quick_bill = ?,
        mask_order_id = ?,
        modifier_default_option_bill = ?,
        print_bill_both_languages = ?,
        show_alt_item_title_bill = ?,
        show_alt_name_bill = ?,
        show_bill_amount_words = ?,
        show_bill_no_bill = ?,
        show_bill_number_prefix_bill = ?,
        show_bill_print_count = ?,
        show_brand_name_bill = ?,
        show_captain_bill = ?,
        show_covers_bill = ?,
        show_custom_qr_codes_bill = ?,
        show_customer_gst_bill = ?,
        show_customer_bill = ?,
        show_customer_paid_amount = ?,
        show_date_bill = ?,
        show_default_payment = ?,
        show_discount_reason_bill = ?,
        show_due_amount_bill = ?,
        show_ebill_invoice_qrcode = ?,
        show_item_hsn_code_bill = ?,
        show_item_level_charges_separately = ?,
        show_item_note_bill = ?,
        show_items_sequence_bill = ?,
        show_kot_number_bill = ?,
        show_logo_bill = ?,
        show_order_id_bill = ?,
        show_order_no_bill = ?,
        show_order_note_bill = ?,
        order_type_dine_in = ?,
        order_type_pickup = ?,
        order_type_delivery = ?,
        order_type_quick_bill = ?,
        show_outlet_name_bill = ?,
        payment_mode_dine_in = ?,
        payment_mode_pickup = ?,
        payment_mode_delivery = ?,
        payment_mode_quick_bill = ?,
        table_name_dine_in = ?,
        table_name_pickup = ?,
        table_name_delivery = ?,
        table_name_quick_bill = ?,
        show_tax_charge_bill = ?,
        show_username_bill = ?,
        show_waiter_bill = ?,
        show_zatca_invoice_qr = ?,
        show_customer_address_pickup_bill = ?,
        show_order_placed_time = ?,
        hide_item_quantity_column = ?,
        hide_item_rate_column = ?,
        hide_item_total_column = ?,
        hide_total_without_tax = ?
      WHERE outletid = ?
    `);

    stmt.run([
      data.bill_title_dine_in,
      data.bill_title_pickup,
      data.bill_title_delivery,
      data.bill_title_quick_bill,
      data.mask_order_id,
      data.modifier_default_option_bill,
      data.print_bill_both_languages,
      data.show_alt_item_title_bill,
      data.show_alt_name_bill,
      data.show_bill_amount_words,
      data.show_bill_no_bill,
      data.show_bill_number_prefix_bill,
      data.show_bill_print_count,
      data.show_brand_name_bill,
      data.show_captain_bill,
      data.show_covers_bill,
      data.show_custom_qr_codes_bill,
      data.show_customer_gst_bill,
      data.show_customer_bill,
      data.show_customer_paid_amount,
      data.show_date_bill,
      data.show_default_payment,
      data.show_discount_reason_bill,
      data.show_due_amount_bill,
      data.show_ebill_invoice_qrcode,
      data.show_item_hsn_code_bill,
      data.show_item_level_charges_separately,
      data.show_item_note_bill,
      data.show_items_sequence_bill,
      data.show_kot_number_bill,
      data.show_logo_bill,
      data.show_order_id_bill,
      data.show_order_no_bill,
      data.show_order_note_bill,
      data.order_type_dine_in,
      data.order_type_pickup,
      data.order_type_delivery,
      data.order_type_quick_bill,
      data.show_outlet_name_bill,
      data.payment_mode_dine_in,
      data.payment_mode_pickup,
      data.payment_mode_delivery,
      data.payment_mode_quick_bill,
      data.table_name_dine_in,
      data.table_name_pickup,
      data.table_name_delivery,
      data.table_name_quick_bill,
      data.show_tax_charge_bill,
      data.show_username_bill,
      data.show_waiter_bill,
      data.show_zatca_invoice_qr,
      data.show_customer_address_pickup_bill,
      data.show_order_placed_time,
      data.hide_item_quantity_column,
      data.hide_item_rate_column,
      data.hide_item_total_column,
      data.hide_total_without_tax,
      outletid
    ]);

    res.json({ message: "Bill Print Settings updated successfully!" });
  } catch (err) {
    console.error("Error updating Bill Print Settings:", err);
    res.status(500).json({ error: "Failed to update Bill Print Settings" });
  }
};


// controllers/outletController.js
// controllers/outletController.js
// Update General Settings
exports.updateGeneralSettings = (req, res) => {
  try {
    const { outletid } = req.params;
    const data = req.body;

    const stmt = db.prepare(`
      UPDATE mstgeneral_settings SET
        customize_url_links = ?,
        allow_charges_after_bill_print = ?,
        allow_discount_after_bill_print = ?,
        allow_discount_before_save = ?,
        allow_pre_order_tahd = ?,
        ask_covers = ?,
        ask_covers_captain = ?,
        ask_custom_order_id_quick_bill = ?,
        ask_custom_order_type_quick_bill = ?,
        ask_payment_mode_on_save_bill = ?,
        ask_waiter = ?,
        ask_otp_change_order_status_order_window = ?,
        ask_otp_change_order_status_receipt_section = ?,
        auto_accept_remote_kot = ?,
        auto_out_of_stock = ?,
        auto_sync = ?,
        category_time_for_pos = ?,
        count_sales_after_midnight = ?,
        customer_display = ?,
        customer_mandatory = ?,
        default_ebill_check = ?,
        default_send_delivery_boy_check = ?,
        edit_customize_order_number = ?,
        enable_backup_notification_service = ?,
        enable_customer_display_access = ?,
        filter_items_by_order_type = ?,
        generate_reports_start_close_dates = ?,
        hide_clear_data_check_logout = ?,
        hide_item_price_options = ?,
        hide_load_menu_button = ?,
        make_cancel_delete_reason_compulsory = ?,
        make_discount_reason_mandatory = ?,
        make_free_cancel_bill_reason_mandatory = ?,
        make_payment_ref_number_mandatory = ?,
        mandatory_delivery_boy_selection = ?,
        mark_order_as_transfer_order = ?,
        online_payment_auto_settle = ?,
        order_sync_settings = ?,
        separate_billing_by_section = ?,
        set_entered_amount_as_opening = ?,
        show_alternative_item_report_print = ?,
        show_clear_sales_report_logout = ?,
        show_order_no_label_pos = ?,
        show_payment_history_button = ?,
        show_remote_kot_option = ?,
        show_send_payment_link = ?,
        stock_availability_display = ?,
        todays_report = ?,
        upi_payment_sound_notification = ?,
        use_separate_bill_numbers_online = ?,
        when_send_todays_report = ?,
        enable_currency_conversion = ?,
        enable_user_login_validation = ?,
        allow_closing_shift_despite_bills = ?,
        show_real_time_kot_bill_notifications = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE outletid = ?
    `);

    stmt.run(
      data.customize_url_links,
      data.allow_charges_after_bill_print,
      data.allow_discount_after_bill_print,
      data.allow_discount_before_save,
      data.allow_pre_order_tahd,
      JSON.stringify(data.ask_covers),
      data.ask_covers_captain,
      data.ask_custom_order_id_quick_bill,
      data.ask_custom_order_type_quick_bill,
      data.ask_payment_mode_on_save_bill,
      JSON.stringify(data.ask_waiter),
      data.ask_otp_change_order_status_order_window,
      data.ask_otp_change_order_status_receipt_section,
      data.auto_accept_remote_kot,
      data.auto_out_of_stock,
      data.auto_sync,
      data.category_time_for_pos,
      data.count_sales_after_midnight,
      JSON.stringify(data.customer_display),
      JSON.stringify(data.customer_mandatory),
      data.default_ebill_check,
      data.default_send_delivery_boy_check,
      data.edit_customize_order_number,
      data.enable_backup_notification_service,
      data.enable_customer_display_access,
      data.filter_items_by_order_type,
      data.generate_reports_start_close_dates,
      data.hide_clear_data_check_logout,
      data.hide_item_price_options,
      data.hide_load_menu_button,
      data.make_cancel_delete_reason_compulsory,
      data.make_discount_reason_mandatory,
      data.make_free_cancel_bill_reason_mandatory,
      data.make_payment_ref_number_mandatory,
      data.mandatory_delivery_boy_selection,
      data.mark_order_as_transfer_order,
      data.online_payment_auto_settle,
      JSON.stringify(data.order_sync_settings),
      data.separate_billing_by_section,
      data.set_entered_amount_as_opening,
      data.show_alternative_item_report_print,
      data.show_clear_sales_report_logout,
      data.show_order_no_label_pos,
      data.show_payment_history_button,
      data.show_remote_kot_option,
      data.show_send_payment_link,
      data.stock_availability_display,
      JSON.stringify(data.todays_report),
      data.upi_payment_sound_notification,
      data.use_separate_bill_numbers_online,
      data.when_send_todays_report,
      data.enable_currency_conversion,
      data.enable_user_login_validation,
      data.allow_closing_shift_despite_bills,
      data.show_real_time_kot_bill_notifications,
      outletid
    );

    res.json({ success: true, message: "General settings updated successfully" });
  } catch (err) {
    console.error("Error updating general settings:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


exports.updateOnlineOrdersSettings = (req, res) => {
  try {
    const { outletid } = req.params;
    const {
      show_in_preparation_kds,
      auto_accept_online_order,
      customize_order_preparation_time,
      online_orders_time_delay,
      pull_order_on_accept,
      show_addons_separately,
      show_complete_online_order_id,
      show_online_order_preparation_time,
      update_food_ready_status_kds,
    } = req.body;

    // Validate required fields
    if (!outletid) {
      return res.status(400).json({ error: "Outlet ID is required" });
    }

    // Validate online_orders_time_delay
    if (
      online_orders_time_delay !== undefined &&
      (!Number.isInteger(online_orders_time_delay) ||
        online_orders_time_delay < 0)
    ) {
      return res.status(400).json({
        error: "online_orders_time_delay must be a non-negative integer",
      });
    }

    const stmt = db.prepare(`
      UPDATE mstonline_orders_settings SET
        show_in_preparation_kds = ?,
        auto_accept_online_order = ?,
        customize_order_preparation_time = ?,
        online_orders_time_delay = ?,
        pull_order_on_accept = ?,
        show_addons_separately = ?,
        show_complete_online_order_id = ?,
        show_online_order_preparation_time = ?,
        update_food_ready_status_kds = ?
       
      WHERE outletid = ?
    `);

    stmt.run(
      show_in_preparation_kds ? 1 : 0,
      auto_accept_online_order ? 1 : 0,
      customize_order_preparation_time ? 1 : 0,
      online_orders_time_delay ?? null,
      pull_order_on_accept ? 1 : 0,
      show_addons_separately ? 1 : 0,
      show_complete_online_order_id ? 1 : 0,
      show_online_order_preparation_time ? 1 : 0,
      update_food_ready_status_kds ? 1 : 0,
   
      outletid
    );

    res.json({
      outletid,
      show_in_preparation_kds: !!show_in_preparation_kds,
      auto_accept_online_order: !!auto_accept_online_order,
      customize_order_preparation_time: !!customize_order_preparation_time,
      online_orders_time_delay: online_orders_time_delay ?? null,
      pull_order_on_accept: !!pull_order_on_accept,
      show_addons_separately: !!show_addons_separately,
      show_complete_online_order_id: !!show_complete_online_order_id,
      show_online_order_preparation_time: !!show_online_order_preparation_time,
      update_food_ready_status_kds: !!update_food_ready_status_kds
     
    });
  } catch (error) {
    console.error("Error updating online orders settings:", error);
    res
      .status(500)
      .json({ error: "Failed to update online orders settings" });
  }
};


// controllers/outletController.js
exports.getOutletBillingSettings = (req, res) => {
  try {
    const { outletid } = req.params;

    // Validate outletid
    if (!outletid || isNaN(outletid)) {
      return res.status(400).json({ error: 'Valid outlet ID is required' });
    }

    const settings = db.prepare(`
      SELECT 
        o.outletid,
        o.outlet_name,
        o.outlet_code,
        o.hotelid,
       
        bps.bill_printsetting_id,
        bps.bill_title_dine_in,
        bps.bill_title_pickup,
        bps.bill_title_delivery,
        bps.bill_title_quick_bill,
        bps.mask_order_id,
        bps.modifier_default_option_bill,
        bps.print_bill_both_languages,
        bps.show_alt_item_title_bill,
        bps.show_alt_name_bill,
        bps.show_bill_amount_words,
        bps.show_bill_no_bill,
        bps.show_bill_number_prefix_bill,
        bps.show_bill_print_count,
        bps.show_brand_name_bill,
        bps.show_captain_bill,
        bps.show_covers_bill,
        bps.show_custom_qr_codes_bill,
        bps.show_customer_gst_bill,
        bps.show_customer_bill,
        bps.show_customer_paid_amount,
        bps.show_date_bill,
        bps.show_default_payment,
        bps.show_discount_reason_bill,
        bps.show_due_amount_bill,
        bps.show_ebill_invoice_qrcode,
        bps.show_item_hsn_code_bill,
        bps.show_item_level_charges_separately,
        bps.show_item_note_bill,
        bps.show_items_sequence_bill,
        bps.show_kot_number_bill,
        bps.show_logo_bill,
        bps.show_order_id_bill,
        bps.show_order_no_bill,
        bps.show_order_note_bill,
        bps.order_type_dine_in,
        bps.order_type_pickup,
        bps.order_type_delivery,
        bps.order_type_quick_bill,
        bps.show_outlet_name_bill,
        bps.payment_mode_dine_in,
        bps.payment_mode_pickup,
        bps.payment_mode_delivery,
        bps.payment_mode_quick_bill,
        bps.table_name_dine_in,
        bps.table_name_pickup,
        bps.table_name_delivery,
        bps.table_name_quick_bill,
        bps.show_tax_charge_bill,
        bps.show_username_bill,
        bps.show_waiter_bill,
        bps.show_zatca_invoice_qr,
        bps.show_customer_address_pickup_bill,
        bps.show_order_placed_time,
        bps.hide_item_quantity_column,
        bps.hide_item_rate_column,
        bps.hide_item_total_column,
        bps.hide_total_without_tax,
        gs.customize_url_links,
        gs.allow_charges_after_bill_print,
        gs.allow_discount_after_bill_print,
        gs.allow_discount_before_save,
        gs.allow_pre_order_tahd,
        gs.ask_covers,
        gs.ask_covers_captain,
        gs.ask_custom_order_id_quick_bill,
        gs.ask_custom_order_type_quick_bill,
        gs.ask_payment_mode_on_save_bill,
        gs.ask_waiter,
        gs.ask_otp_change_order_status_order_window,
        gs.ask_otp_change_order_status_receipt_section,
        gs.auto_accept_remote_kot,
        gs.auto_out_of_stock,
        gs.auto_sync,
        gs.category_time_for_pos,
        gs.count_sales_after_midnight,
        gs.customer_display,
        gs.customer_mandatory,
        gs.default_ebill_check,
        gs.default_send_delivery_boy_check,
        gs.edit_customize_order_number,
        gs.enable_backup_notification_service,
        gs.enable_customer_display_access,
        gs.filter_items_by_order_type,
        gs.generate_reports_start_close_dates,
        gs.hide_clear_data_check_logout,
        gs.hide_item_price_options,
        gs.hide_load_menu_button,
        gs.make_cancel_delete_reason_compulsory,
        gs.make_discount_reason_mandatory,
        gs.make_free_cancel_bill_reason_mandatory,
        gs.make_payment_ref_number_mandatory,
        gs.mandatory_delivery_boy_selection,
        gs.mark_order_as_transfer_order,
        gs.online_payment_auto_settle,
        gs.order_sync_settings,
        gs.separate_billing_by_section,
        gs.set_entered_amount_as_opening,
        gs.show_alternative_item_report_print,
        gs.show_clear_sales_report_logout,
        gs.show_order_no_label_pos,
        gs.show_payment_history_button,
        gs.show_remote_kot_option,
        gs.show_send_payment_link,
        gs.stock_availability_display,
        gs.todays_report,
        gs.upi_payment_sound_notification,
        gs.use_separate_bill_numbers_online,
        gs.when_send_todays_report,
        gs.enable_currency_conversion,
        gs.enable_user_login_validation,
        gs.allow_closing_shift_despite_bills,
        gs.show_real_time_kot_bill_notifications,
        gs.created_at AS gs_created_at,
        gs.updated_at AS gs_updated_at,
        oos.online_ordersetting_id,
        oos.show_in_preparation_kds,
        oos.auto_accept_online_order,
        oos.customize_order_preparation_time,
        oos.online_orders_time_delay,
        oos.pull_order_on_accept,
        oos.show_addons_separately,
        oos.show_complete_online_order_id,
        oos.show_online_order_preparation_time,
        oos.update_food_ready_status_kds,
        bpsv.billpreviewsetting_id,
        bpsv.outlet_name AS bpsv_outlet_name,
        bpsv.email,
        bpsv.website,
        bpsv.upi_id,
        bpsv.bill_prefix,
        bpsv.secondary_bill_prefix,
        bpsv.bar_bill_prefix,
        bpsv.show_upi_qr,
        bpsv.enabled_bar_section,
        bpsv.show_phone_on_bill,
        bpsv.note,
        bpsv.footer_note,
        bpsv.field1,
        bpsv.field2,
        bpsv.field3,
        bpsv.field4,
        bpsv.fssai_no,
        kps.kot_printsetting_id,
        kps.customer_on_kot_dine_in,
        kps.customer_on_kot_pickup,
        kps.customer_on_kot_delivery,
        kps.customer_on_kot_quick_bill,
        kps.customer_kot_display_option,
        kps.group_kot_items_by_category,
        kps.hide_table_name_quick_bill,
        kps.show_new_order_tag,
        kps.new_order_tag_label,
        kps.show_running_order_tag,
        kps.running_order_tag_label,
        kps.dine_in_kot_no,
        kps.pickup_kot_no,
        kps.delivery_kot_no,
        kps.quick_bill_kot_no,
        kps.modifier_default_option,
        kps.print_kot_both_languages,
        kps.show_alternative_item,
        kps.show_captain_username,
        kps.show_covers_as_guest,
        kps.show_item_price,
        kps.show_kot_no_quick_bill,
        kps.show_kot_note,
        kps.show_online_order_otp,
        kps.show_order_id_quick_bill,
        kps.show_order_id_online_order,
        kps.show_order_type_symbol,
        kps.show_store_name,
        kps.show_terminal_username,
        kps.show_username,
        kps.show_waiter
      FROM mst_outlets o
      LEFT JOIN mstbills_print_settings bps ON o.outletid = bps.outletid
      LEFT JOIN mstgeneral_settings gs ON o.outletid = gs.outletid
      LEFT JOIN mstonline_orders_settings oos ON o.outletid = oos.outletid
      LEFT JOIN mstbill_preview_settings bpsv ON o.outletid = bpsv.outletid
      LEFT JOIN mstkot_print_settings kps ON o.outletid = kps.outletid
      WHERE o.outletid = ?
    `).get(outletid);

    if (!settings) {
      return res.status(404).json({ error: 'Outlet settings not found' });
    }

    // Convert INTEGER (0/1) to boolean for frontend and structure response
    const response = {
      outletid: settings.outletid,
      outlet_name: settings.outlet_name,
      outlet_code: settings.outlet_code,
      hotelid: settings.hotelid,
     
      bill_print_settings: settings.bill_printsetting_id ? {
        bill_printsetting_id: settings.bill_printsetting_id,
        bill_title_dine_in: !!settings.bill_title_dine_in,
        bill_title_pickup: !!settings.bill_title_pickup,
        bill_title_delivery: !!settings.bill_title_delivery,
        bill_title_quick_bill: !!settings.bill_title_quick_bill,
        mask_order_id: !!settings.mask_order_id,
        modifier_default_option_bill: !!settings.modifier_default_option_bill,
        print_bill_both_languages: !!settings.print_bill_both_languages,
        show_alt_item_title_bill: !!settings.show_alt_item_title_bill,
        show_alt_name_bill: !!settings.show_alt_name_bill,
        show_bill_amount_words: !!settings.show_bill_amount_words,
        show_bill_no_bill: !!settings.show_bill_no_bill,
        show_bill_number_prefix_bill: !!settings.show_bill_number_prefix_bill,
        show_bill_print_count: !!settings.show_bill_print_count,
        show_brand_name_bill: !!settings.show_brand_name_bill,
        show_captain_bill: !!settings.show_captain_bill,
        show_covers_bill: !!settings.show_covers_bill,
        show_custom_qr_codes_bill: !!settings.show_custom_qr_codes_bill,
        show_customer_gst_bill: !!settings.show_customer_gst_bill,
        show_customer_bill: !!settings.show_customer_bill,
        show_customer_paid_amount: !!settings.show_customer_paid_amount,
        show_date_bill: !!settings.show_date_bill,
        show_default_payment: !!settings.show_default_payment,
        show_discount_reason_bill: !!settings.show_discount_reason_bill,
        show_due_amount_bill: !!settings.show_due_amount_bill,
        show_ebill_invoice_qrcode: !!settings.show_ebill_invoice_qrcode,
        show_item_hsn_code_bill: !!settings.show_item_hsn_code_bill,
        show_item_level_charges_separately: !!settings.show_item_level_charges_separately,
        show_item_note_bill: !!settings.show_item_note_bill,
        show_items_sequence_bill: !!settings.show_items_sequence_bill,
        show_kot_number_bill: !!settings.show_kot_number_bill,
        show_logo_bill: !!settings.show_logo_bill,
        show_order_id_bill: !!settings.show_order_id_bill,
        show_order_no_bill: !!settings.show_order_no_bill,
        show_order_note_bill: !!settings.show_order_note_bill,
        order_type_dine_in: !!settings.order_type_dine_in,
        order_type_pickup: !!settings.order_type_pickup,
        order_type_delivery: !!settings.order_type_delivery,
        order_type_quick_bill: !!settings.order_type_quick_bill,
        show_outlet_name_bill: !!settings.show_outlet_name_bill,
        payment_mode_dine_in: !!settings.payment_mode_dine_in,
        payment_mode_pickup: !!settings.payment_mode_pickup,
        payment_mode_delivery: !!settings.payment_mode_delivery,
        payment_mode_quick_bill: !!settings.payment_mode_quick_bill,
        table_name_dine_in: !!settings.table_name_dine_in,
        table_name_pickup: !!settings.table_name_pickup,
        table_name_delivery: !!settings.table_name_delivery,
        table_name_quick_bill: !!settings.table_name_quick_bill,
        show_tax_charge_bill: !!settings.show_tax_charge_bill,
        show_username_bill: !!settings.show_username_bill,
        show_waiter_bill: !!settings.show_waiter_bill,
        show_zatca_invoice_qr: !!settings.show_zatca_invoice_qr,
        show_customer_address_pickup_bill: !!settings.show_customer_address_pickup_bill,
        show_order_placed_time: !!settings.show_order_placed_time,
        hide_item_quantity_column: !!settings.hide_item_quantity_column,
        hide_item_rate_column: !!settings.hide_item_rate_column,
        hide_item_total_column: !!settings.hide_item_total_column,
        hide_total_without_tax: !!settings.hide_total_without_tax,
      } : null,
      general_settings: settings.gs_created_at ? {
        customize_url_links: settings.customize_url_links,
        allow_charges_after_bill_print: !!settings.allow_charges_after_bill_print,
        allow_discount_after_bill_print: !!settings.allow_discount_after_bill_print,
        allow_discount_before_save: !!settings.allow_discount_before_save,
        allow_pre_order_tahd: !!settings.allow_pre_order_tahd,
        ask_covers: settings.ask_covers,
        ask_covers_captain: !!settings.ask_covers_captain,
        ask_custom_order_id_quick_bill: !!settings.ask_custom_order_id_quick_bill,
        ask_custom_order_type_quick_bill: !!settings.ask_custom_order_type_quick_bill,
        ask_payment_mode_on_save_bill: !!settings.ask_payment_mode_on_save_bill,
        ask_waiter: settings.ask_waiter,
        ask_otp_change_order_status_order_window: !!settings.ask_otp_change_order_status_order_window,
        ask_otp_change_order_status_receipt_section: !!settings.ask_otp_change_order_status_receipt_section,
        auto_accept_remote_kot: !!settings.auto_accept_remote_kot,
        auto_out_of_stock: !!settings.auto_out_of_stock,
        auto_sync: !!settings.auto_sync,
        category_time_for_pos: settings.category_time_for_pos,
        count_sales_after_midnight: !!settings.count_sales_after_midnight,
        customer_display: settings.customer_display,
        customer_mandatory: settings.customer_mandatory,
        default_ebill_check: !!settings.default_ebill_check,
        default_send_delivery_boy_check: !!settings.default_send_delivery_boy_check,
        edit_customize_order_number: settings.edit_customize_order_number,
        enable_backup_notification_service: !!settings.enable_backup_notification_service,
        enable_customer_display_access: !!settings.enable_customer_display_access,
        filter_items_by_order_type: !!settings.filter_items_by_order_type,
        generate_reports_start_close_dates: !!settings.generate_reports_start_close_dates,
        hide_clear_data_check_logout: !!settings.hide_clear_data_check_logout,
        hide_item_price_options: !!settings.hide_item_price_options,
        hide_load_menu_button: !!settings.hide_load_menu_button,
        make_cancel_delete_reason_compulsory: !!settings.make_cancel_delete_reason_compulsory,
        make_discount_reason_mandatory: !!settings.make_discount_reason_mandatory,
        make_free_cancel_bill_reason_mandatory: !!settings.make_free_cancel_bill_reason_mandatory,
        make_payment_ref_number_mandatory: !!settings.make_payment_ref_number_mandatory,
        mandatory_delivery_boy_selection: !!settings.mandatory_delivery_boy_selection,
        mark_order_as_transfer_order: !!settings.mark_order_as_transfer_order,
        online_payment_auto_settle: !!settings.online_payment_auto_settle,
        order_sync_settings: settings.order_sync_settings,
        separate_billing_by_section: !!settings.separate_billing_by_section,
        set_entered_amount_as_opening: !!settings.set_entered_amount_as_opening,
        show_alternative_item_report_print: !!settings.show_alternative_item_report_print,
        show_clear_sales_report_logout: !!settings.show_clear_sales_report_logout,
        show_order_no_label_pos: !!settings.show_order_no_label_pos,
        show_payment_history_button: !!settings.show_payment_history_button,
        show_remote_kot_option: !!settings.show_remote_kot_option,
        show_send_payment_link: !!settings.show_send_payment_link,
        stock_availability_display: !!settings.stock_availability_display,
        todays_report: settings.todays_report,
        upi_payment_sound_notification: !!settings.upi_payment_sound_notification,
        use_separate_bill_numbers_online: !!settings.use_separate_bill_numbers_online,
        when_send_todays_report: settings.when_send_todays_report,
        enable_currency_conversion: !!settings.enable_currency_conversion,
        enable_user_login_validation: !!settings.enable_user_login_validation,
        allow_closing_shift_despite_bills: !!settings.allow_closing_shift_despite_bills,
        show_real_time_kot_bill_notifications: !!settings.show_real_time_kot_bill_notifications,
        created_at: settings.gs_created_at,
        updated_at: settings.gs_updated_at,
      } : null,
      online_orders_settings: settings.online_ordersetting_id ? {
        online_ordersetting_id: settings.online_ordersetting_id,
        show_in_preparation_kds: !!settings.show_in_preparation_kds,
        auto_accept_online_order: !!settings.auto_accept_online_order,
        customize_order_preparation_time: !!settings.customize_order_preparation_time,
        online_orders_time_delay: settings.online_orders_time_delay,
        pull_order_on_accept: !!settings.pull_order_on_accept,
        show_addons_separately: !!settings.show_addons_separately,
        show_complete_online_order_id: !!settings.show_complete_online_order_id,
        show_online_order_preparation_time: !!settings.show_online_order_preparation_time,
        update_food_ready_status_kds: !!settings.update_food_ready_status_kds,
      } : null,
      bill_preview_settings: settings.billpreviewsetting_id ? {
        billpreviewsetting_id: settings.billpreviewsetting_id,
        outlet_name: settings.bpsv_outlet_name,
        email: settings.email,
        website: settings.website,
        upi_id: settings.upi_id,
        
        bill_prefix: settings.bill_prefix,
        secondary_bill_prefix: settings.secondary_bill_prefix,
        bar_bill_prefix: settings.bar_bill_prefix,
        show_upi_qr: !!settings.show_upi_qr,
        enabled_bar_section: !!settings.enabled_bar_section,
        show_phone_on_bill: settings.show_phone_on_bill,
        note: settings.note,
        footer_note: settings.footer_note,
        field1: settings.field1,
        field2: settings.field2,
        field3: settings.field3,
        field4: settings.field4,
        fssai_no: settings.fssai_no,
      } : null,
      kot_print_settings: settings.kot_printsetting_id ? {
        kot_printsetting_id: settings.kot_printsetting_id,
        customer_on_kot_dine_in: !!settings.customer_on_kot_dine_in,
        customer_on_kot_pickup: !!settings.customer_on_kot_pickup,
        customer_on_kot_delivery: !!settings.customer_on_kot_delivery,
        customer_on_kot_quick_bill: !!settings.customer_on_kot_quick_bill,
        customer_kot_display_option: settings.customer_kot_display_option,
        group_kot_items_by_category: !!settings.group_kot_items_by_category,
        hide_table_name_quick_bill: !!settings.hide_table_name_quick_bill,
        show_new_order_tag: !!settings.show_new_order_tag,
        new_order_tag_label: settings.new_order_tag_label,
        show_running_order_tag: !!settings.show_running_order_tag,
        running_order_tag_label: settings.running_order_tag_label,
        dine_in_kot_no: settings.dine_in_kot_no,
        pickup_kot_no: settings.pickup_kot_no,
        delivery_kot_no: settings.delivery_kot_no,
        quick_bill_kot_no: settings.quick_bill_kot_no,
        modifier_default_option: !!settings.modifier_default_option,
        print_kot_both_languages: !!settings.print_kot_both_languages,
        show_alternative_item: !!settings.show_alternative_item,
        show_captain_username: !!settings.show_captain_username,
        show_covers_as_guest: !!settings.show_covers_as_guest,
        show_item_price: !!settings.show_item_price,
        show_kot_no_quick_bill: !!settings.show_kot_no_quick_bill,
        show_kot_note: !!settings.show_kot_note,
        show_online_order_otp: !!settings.show_online_order_otp,
        show_order_id_quick_bill: !!settings.show_order_id_quick_bill,
        show_order_id_online_order: !!settings.show_order_id_online_order,
        show_order_type_symbol: !!settings.show_order_type_symbol,
        show_store_name: !!settings.show_store_name,
        show_terminal_username: !!settings.show_terminal_username,
        show_username: !!settings.show_username,
        show_waiter: !!settings.show_waiter,
      } : null,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching outlet billing settings:', error);
    res.status(500).json({ error: 'Failed to fetch outlet billing settings' });
  }
};

// Get Bill Preview Settings by outletid
exports.getBillPreviewSettings = (req, res) => {
  try {
    const { outletid } = req.params;

    // Validate outletid
    if (!outletid || isNaN(outletid)) {
      return res.status(400).json({ error: 'Valid outlet ID is required' });
    }

    const settings = db
      .prepare('SELECT * FROM mstbill_preview_settings WHERE outletid = ?')
      .get(outletid);

    if (!settings) {
      return res.status(404).json({ error: 'Bill preview settings not found' });
    }

    // Convert integers to booleans
    const response = {
      billpreviewsetting_id: settings.billpreviewsetting_id,
      outletid: settings.outletid,
      outlet_name: settings.outlet_name,
      email: settings.email,
      website: settings.website,
      upi_id: settings.upi_id,
      bill_prefix: settings.bill_prefix,
      secondary_bill_prefix: settings.secondary_bill_prefix,
      bar_bill_prefix: settings.bar_bill_prefix,
      show_upi_qr: !!settings.show_upi_qr,
      enabled_bar_section: !!settings.enabled_bar_section,
      show_phone_on_bill: settings.show_phone_on_bill,
      note: settings.note,
      footer_note: settings.footer_note,
      field1: settings.field1,
      field2: settings.field2,
      field3: settings.field3,
      field4: settings.field4,
      fssai_no: settings.fssai_no,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching bill preview settings:', error);
    res.status(500).json({ error: 'Failed to fetch bill preview settings' });
  }
};

// Get KOT Print Settings by outletid
exports.getKotPrintSettings = (req, res) => {
  try {
    const { outletid } = req.params;

    // Validate outletid
    if (!outletid || isNaN(outletid)) {
      return res.status(400).json({ error: 'Valid outlet ID is required' });
    }

    const settings = db
      .prepare('SELECT * FROM mstkot_print_settings WHERE outletid = ?')
      .get(outletid);

    if (!settings) {
      return res.status(404).json({ error: 'KOT print settings not found' });
    }

    // Convert integers to booleans
    const response = {
      kot_printsetting_id: settings.kot_printsetting_id,
      outletid: settings.outletid,
      customer_on_kot_dine_in: !!settings.customer_on_kot_dine_in,
      customer_on_kot_pickup: !!settings.customer_on_kot_pickup,
      customer_on_kot_delivery: !!settings.customer_on_kot_delivery,
      customer_on_kot_quick_bill: !!settings.customer_on_kot_quick_bill,
      customer_kot_display_option: settings.customer_kot_display_option,
      group_kot_items_by_category: !!settings.group_kot_items_by_category,
      hide_table_name_quick_bill: !!settings.hide_table_name_quick_bill,
      show_new_order_tag: !!settings.show_new_order_tag,
      new_order_tag_label: settings.new_order_tag_label,
      show_running_order_tag: !!settings.show_running_order_tag,
      running_order_tag_label: settings.running_order_tag_label,
      dine_in_kot_no: settings.dine_in_kot_no,
      pickup_kot_no: settings.pickup_kot_no,
      delivery_kot_no: settings.delivery_kot_no,
      quick_bill_kot_no: settings.quick_bill_kot_no,
      modifier_default_option: !!settings.modifier_default_option,
      print_kot_both_languages: !!settings.print_kot_both_languages,
      show_alternative_item: !!settings.show_alternative_item,
      show_captain_username: !!settings.show_captain_username,
      show_covers_as_guest: !!settings.show_covers_as_guest,
      show_item_price: !!settings.show_item_price,
      show_kot_no_quick_bill: !!settings.show_kot_no_quick_bill,
      show_kot_note: !!settings.show_kot_note,
      show_online_order_otp: !!settings.show_online_order_otp,
      show_order_id_quick_bill: !!settings.show_order_id_quick_bill,
      show_order_id_online_order: !!settings.show_order_id_online_order,
      show_order_no_quick_bill_section: !!settings.show_order_no_quick_bill_section,
      show_order_type_symbol: !!settings.show_order_type_symbol,
      show_store_name: !!settings.show_store_name,
      show_terminal_username: !!settings.show_terminal_username,
      show_username: !!settings.show_username,
      show_waiter: !!settings.show_waiter,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching KOT print settings:', error);
    res.status(500).json({ error: 'Failed to fetch KOT print settings' });
  }
};
