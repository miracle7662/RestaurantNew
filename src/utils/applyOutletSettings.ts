


export interface OutletSettings {
  customer_on_kot_dine_in?: boolean;
  customer_on_kot_pickup?: boolean;
  customer_on_kot_delivery?: boolean;
  customer_on_kot_quick_bill?: boolean;
  customer_kot_display_option?: string;
  group_kot_items_by_category?: boolean;
  hide_table_name_quick_bill?: boolean;
  show_new_order_tag?: boolean;
  new_order_tag_label?: string;
  show_running_order_tag?: boolean;
  running_order_tag_label?: string;
  dine_in_kot_no?: string;
  pickup_kot_no?: string;
  delivery_kot_no?: string;
  quick_bill_kot_no?: string;
  modifier_default_option?: boolean;
  print_kot_both_languages?: boolean;
  show_alternative_item?: boolean;
  show_captain_username?: boolean;
  show_covers_as_guest?: boolean;
  show_item_price?: boolean;
  show_kot_no_quick_bill?: boolean;
  show_kot_note?: boolean;
  show_online_order_otp?: boolean;
  show_order_id_quick_bill?: boolean;
  show_order_id_online_order?: boolean;
  show_order_no_quick_bill_section?: boolean;
  show_order_type_symbol?: boolean;
  show_store_name?: boolean;
  show_terminal_username?: boolean;
  show_username?: boolean;
  show_waiter?: boolean;
  bill_title_dine_in?: boolean;
  bill_title_pickup?: boolean;
  bill_title_delivery?: boolean;
  bill_title_quick_bill?: boolean;
  mask_order_id?: boolean;
  modifier_default_option_bill?: boolean;
  print_bill_both_languages?: boolean;
  show_alt_item_title_bill?: boolean;
  show_alt_name_bill?: boolean;
  show_bill_amount_words?: boolean;
  show_bill_no_bill?: boolean;
  show_bill_number_prefix_bill?: boolean;
  show_bill_print_count?: boolean;
  show_brand_name_bill?: boolean;
  show_captain_bill?: boolean;
  show_covers_bill?: boolean;
  show_custom_qr_codes_bill?: boolean;
  show_customer_gst_bill?: boolean;
  show_customer_bill?: boolean;
  show_customer_paid_amount?: boolean;
  show_date_bill?: boolean;
  show_default_payment?: boolean;
  show_discount_reason_bill?: boolean;
  show_due_amount_bill?: boolean;
  show_ebill_invoice_qrcode?: boolean;
  show_item_hsn_code_bill?: boolean;
  show_item_level_charges_separately?: boolean;
  show_item_note_bill?: boolean;
  show_items_sequence_bill?: boolean;
  show_kot_number_bill?: boolean;
  show_logo_bill?: boolean;
  show_order_id_bill?: boolean;
  show_order_no_bill?: boolean;
  show_order_note_bill?: boolean;
  order_type_dine_in?: boolean;
  order_type_pickup?: boolean;
  order_type_delivery?: boolean;
  order_type_quick_bill?: boolean;
  show_outlet_name_bill?: boolean;
  payment_mode_dine_in?: boolean;
  payment_mode_pickup?: boolean;
  payment_mode_delivery?: boolean;
  payment_mode_quick_bill?: boolean;
  table_name_dine_in?: boolean;
  table_name_pickup?: boolean;
  table_name_delivery?: boolean;
  table_name_quick_bill?: boolean;
  show_tax_charge_bill?: boolean;
  show_username_bill?: boolean;
  show_waiter_bill?: boolean;
  show_zatca_invoice_qr?: boolean;
  show_customer_address_pickup_bill?: boolean;
  show_order_placed_time?: boolean;
  hide_item_quantity_column?: boolean;
  hide_item_rate_column?: boolean;
  hide_item_total_column?: boolean;
  hide_total_without_tax?: boolean;
  
  outlet_name?: string;
  email?: string;
  website?: string;
  show_phone_on_bill?: boolean;
  note?: string;
  footer_note?: string;
  field1?: string;
  field2?: string;
  field3?: string;
  field4?: string;
  fssai_no?: string;
  bar_bill_prefix?: string;
  secondary_bill_prefix?: string;
  bill_prefix?: string;
  upi_id?: string;
  show_upi_qr?: boolean;
  enabled_bar_section?: boolean;
  enabled_secondary_section?: boolean;
  enabled_bill_section?: boolean;
  enabled_upi_section?: boolean;
  [key: string]: any; // For other properties
}

export const applyKotSettings = (prev: any, data: any) => ({
  ...prev,
  show_store_name: data.show_store_name ?? prev.show_store_name,
  dine_in_kot_no: data.dine_in_kot_no ?? prev.dine_in_kot_no,
  pickup_kot_no: data.pickup_kot_no ?? prev.pickup_kot_no,
  delivery_kot_no: data.delivery_kot_no ?? prev.delivery_kot_no,
  quick_bill_kot_no: data.quick_bill_kot_no ?? prev.quick_bill_kot_no,

  show_new_order_tag: data.show_new_order_tag ?? prev.show_new_order_tag,
  new_order_tag_label: data.new_order_tag_label ?? prev.new_order_tag_label,
  show_running_order_tag: data.show_running_order_tag ?? prev.show_running_order_tag,
  running_order_tag_label: data.running_order_tag_label ?? prev.running_order_tag_label,

  customer_on_kot_dine_in: data.customer_on_kot_dine_in ?? prev.customer_on_kot_dine_in,
  customer_on_kot_pickup: data.customer_on_kot_pickup ?? prev.customer_on_kot_pickup,
  customer_on_kot_delivery: data.customer_on_kot_delivery ?? prev.customer_on_kot_delivery,
  customer_on_kot_quick_bill: data.customer_on_kot_quick_bill ?? prev.customer_on_kot_quick_bill,

  customer_kot_display_option: data.customer_kot_display_option ?? prev.customer_kot_display_option,
  show_order_type_symbol: data.show_order_type_symbol ?? prev.show_order_type_symbol,
  show_waiter: data.show_waiter ?? prev.show_waiter,
  show_username: data.show_username ?? prev.show_username,
  show_terminal_username: data.show_terminal_username ?? prev.show_terminal_username,

  show_item_price: data.show_item_price ?? prev.show_item_price,
  show_kot_note: data.show_kot_note ?? prev.show_kot_note,
  group_kot_items_by_category: data.group_kot_items_by_category ?? prev.group_kot_items_by_category,

  show_kot_no_quick_bill: data.show_kot_no_quick_bill ?? prev.show_kot_no_quick_bill,
  hide_table_name_quick_bill: data.hide_table_name_quick_bill ?? prev.hide_table_name_quick_bill,
  show_order_id_quick_bill: data.show_order_id_quick_bill ?? prev.show_order_id_quick_bill,
  show_online_order_otp: data.show_online_order_otp ?? prev.show_online_order_otp,
  show_covers_as_guest: data.show_covers_as_guest ?? prev.show_covers_as_guest,
  show_captain_username: data.show_captain_username ?? prev.show_captain_username,
  modifier_default_option: data.modifier_default_option ?? prev.modifier_default_option,
  show_alternative_item: data.show_alternative_item ?? prev.show_alternative_item,
  print_kot_both_languages: data.print_kot_both_languages ?? prev.print_kot_both_languages,
  show_order_placed_time: data.show_order_placed_time ?? prev.show_order_placed_time,
  hide_item_quantity_column: data.hide_item_quantity_column ?? prev.hide_item_quantity_column,
  hide_item_rate_column: data.hide_item_rate_column ?? prev.hide_item_rate_column,
  hide_item_total_column: data.hide_item_total_column ?? prev.hide_item_total_column,
});

export const applyBillSettings = (prev: any, preview: any, print: any) => ({
  ...prev,

  // PREVIEW
  outlet_name: preview.outlet_name ?? prev.outlet_name,
  email: preview.email ?? prev.email,
  website: preview.website ?? prev.website,
  show_phone_on_bill: preview.show_phone_on_bill ?? prev.show_phone_on_bill,
  note: preview.note ?? prev.note,
  footer_note: preview.footer_note ?? prev.footer_note,
  field1: preview.field1 ?? prev.field1,
  field2: preview.field2 ?? prev.field2,
  field3: preview.field3 ?? prev.field3,
  field4: preview.field4 ?? prev.field4,
  fssai_no: preview.fssai_no ?? prev.fssai_no,
  bar_bill_prefix: preview.bar_bill_prefix ?? prev.bar_bill_prefix,
  secondary_bill_prefix: preview.secondary_bill_prefix ?? prev.secondary_bill_prefix,
  bill_prefix: preview.bill_prefix ?? prev.bill_prefix,
  upi_id: preview.upi_id ?? prev.upi_id,
  show_upi_qr: preview.show_upi_qr ?? prev.show_upi_qr,
  enabled_bar_section: preview.enabled_bar_section ?? prev.enabled_bar_section,
  enabled_secondary_section: preview.enabled_secondary_section ?? prev.enabled_secondary_section,
  enabled_upi_section: preview.enabled_upi_section ?? prev.enabled_upi_section,

  // PRINT
  bill_title_dine_in: print.bill_title_dine_in ?? prev.bill_title_dine_in,
  bill_title_pickup: print.bill_title_pickup ?? prev.bill_title_pickup,
  bill_title_delivery: print.bill_title_delivery ?? prev.bill_title_delivery,
  bill_title_quick_bill: print.bill_title_quick_bill ?? prev.bill_title_quick_bill,
  mask_order_id: print.mask_order_id ?? prev.mask_order_id,
  modifier_default_option_bill: print.modifier_default_option_bill ?? prev.modifier_default_option_bill,
  print_bill_both_languages: print.print_bill_both_languages ?? prev.print_bill_both_languages,
  show_alt_item_title_bill: print.show_alt_item_title_bill ?? prev.show_alt_item_title_bill,
  show_alt_name_bill: print.show_alt_name_bill ?? prev.show_alt_name_bill,
  show_bill_amount_words: print.show_bill_amount_words ?? prev.show_bill_amount_words,
  show_bill_no_bill: print.show_bill_no_bill ?? prev.show_bill_no_bill,
  show_bill_number_prefix_bill: print.show_bill_number_prefix_bill ?? prev.show_bill_number_prefix_bill,
  show_bill_print_count: print.show_bill_print_count ?? prev.show_bill_print_count,
  show_brand_name_bill: print.show_brand_name_bill ?? prev.show_brand_name_bill,
  show_captain_bill: print.show_captain_bill ?? prev.show_captain_bill,
  show_covers_bill: print.show_covers_bill ?? prev.show_covers_bill,
  show_custom_qr_codes_bill: print.show_custom_qr_codes_bill ?? prev.show_custom_qr_codes_bill,
  show_customer_gst_bill: print.show_customer_gst_bill ?? prev.show_customer_gst_bill,
  show_customer_bill: print.show_customer_bill ?? prev.show_customer_bill,
  show_customer_paid_amount: print.show_customer_paid_amount ?? prev.show_customer_paid_amount,
  show_date_bill: print.show_date_bill ?? prev.show_date_bill,
  show_default_payment: print.show_default_payment ?? prev.show_default_payment,
  show_discount_reason_bill: print.show_discount_reason_bill ?? prev.show_discount_reason_bill,
  show_due_amount_bill: print.show_due_amount_bill ?? prev.show_due_amount_bill,
  show_ebill_invoice_qrcode: print.show_ebill_invoice_qrcode ?? prev.show_ebill_invoice_qrcode,
  show_item_hsn_code_bill: print.show_item_hsn_code_bill ?? prev.show_item_hsn_code_bill,
  show_item_level_charges_separately: print.show_item_level_charges_separately ?? prev.show_item_level_charges_separately,
  show_item_note_bill: print.show_item_note_bill ?? prev.show_item_note_bill,
  show_items_sequence_bill: print.show_items_sequence_bill ?? prev.show_items_sequence_bill,
  show_kot_number_bill: print.show_kot_number_bill ?? prev.show_kot_number_bill,
  show_logo_bill: print.show_logo_bill ?? prev.show_logo_bill,
  show_order_id_bill: print.show_order_id_bill ?? prev.show_order_id_bill,
  show_order_no_bill: print.show_order_no_bill ?? prev.show_order_no_bill,
  show_order_note_bill: print.show_order_note_bill ?? prev.show_order_note_bill,
  order_type_dine_in: print.order_type_dine_in ?? prev.order_type_dine_in,
  order_type_pickup: print.order_type_pickup ?? prev.order_type_pickup,
  order_type_delivery: print.order_type_delivery ?? prev.order_type_delivery,
  order_type_quick_bill: print.order_type_quick_bill ?? prev.order_type_quick_bill,
  show_outlet_name_bill: print.show_outlet_name_bill ?? prev.show_outlet_name_bill,
  payment_mode_dine_in: print.payment_mode_dine_in ?? prev.payment_mode_dine_in,
  payment_mode_pickup: print.payment_mode_pickup ?? prev.payment_mode_pickup,
  payment_mode_delivery: print.payment_mode_delivery ?? prev.payment_mode_delivery,
  payment_mode_quick_bill: print.payment_mode_quick_bill ?? prev.payment_mode_quick_bill,
  table_name_dine_in: print.table_name_dine_in ?? prev.table_name_dine_in,
  table_name_pickup: print.table_name_pickup ?? prev.table_name_pickup,
  table_name_delivery: print.table_name_delivery ?? prev.table_name_delivery,
  table_name_quick_bill: print.table_name_quick_bill ?? prev.table_name_quick_bill,
  show_tax_charge_bill: print.show_tax_charge_bill ?? prev.show_tax_charge_bill,
  show_username_bill: print.show_username_bill ?? prev.show_username_bill,
  show_waiter_bill: print.show_waiter_bill ?? prev.show_waiter_bill,
  show_zatca_invoice_qr: print.show_zatca_invoice_qr ?? prev.show_zatca_invoice_qr,
  show_customer_address_pickup_bill: print.show_customer_address_pickup_bill ?? prev.show_customer_address_pickup_bill,
  show_order_placed_time: print.show_order_placed_time ?? prev.show_order_placed_time,
  hide_item_quantity_column: print.hide_item_quantity_column ?? prev.hide_item_quantity_column,
  hide_item_rate_column: print.hide_item_rate_column ?? prev.hide_item_rate_column,
  hide_item_total_column: print.hide_item_total_column ?? prev.hide_item_total_column,
  hide_total_without_tax: print.hide_total_without_tax ?? prev.hide_total_without_tax,
});
