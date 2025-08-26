import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify'; // Import toast for notifications
import { useNavigate } from 'react-router-dom';
import { Alert, Button, } from 'react-bootstrap';


import axios from 'axios';
import { useAuthContext } from '@/common/context/useAuthContext'; // Adjust path as needed
import { OutletData } from '@/common/api/outlet'; // Adjust the import path as necessary

interface AddOutletProps {
  Outlet: OutletData | null;
  onBack: () => void;
}
const convertToBoolean = (value: any): boolean => {
  return !!value;
}

function parseJsonSafely(jsonString: string, defaultValue: any) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return defaultValue;
  }
}



interface OutletSettings {
  outletid: number;
  hotelid: number;
  outlet_name: string;
  email: string;
  website: string;
  upi_id: string;
  bill_prefix: string;
  secondary_bill_prefix: string;
  bar_bill_prefix: string;
  show_upi_qr: boolean;
  enabled_bar_section: boolean;
  show_phone_on_bill: string;
  note: string;
  footer_note: string;
  field1: string;
  field2: string;
  field3: string;
  field4: string;
  fssai_no: string;
  // Add other fields as per backend model
  customer_on_kot_dine_in: boolean;
  customer_on_kot_pickup: boolean;
  customer_on_kot_delivery: boolean;
  customer_on_kot_quick_bill: boolean;
  customer_kot_display_option: string;
  group_kot_items_by_category: boolean;
  hide_table_name_quick_bill: boolean;
  show_new_order_tag: boolean;
  new_order_tag_label: string;
  show_running_order_tag: boolean;
  running_order_tag_label: string;
  dine_in_kot_no: string;
  pickup_kot_no: string;
  delivery_kot_no: string;
  quick_bill_kot_no: string;
  modifier_default_option: boolean;
  print_kot_both_languages: boolean;
  show_alternative_item: boolean;
  show_captain_username: boolean;
  show_covers_as_guest: boolean;
  show_item_price: boolean;
  show_kot_no_quick_bill: boolean;
  show_kot_note: boolean;
  show_online_order_otp: boolean;
  show_order_id_quick_bill: boolean;
  show_order_id_online_order: boolean;
  show_order_no_quick_bill_section: boolean;
  show_order_type_symbol: boolean;
  show_store_name: boolean;
  show_terminal_username: boolean;
  show_username: boolean;
  show_waiter: boolean;
  // Bill print settings
  bill_title_dine_in: boolean;
  bill_title_pickup: boolean;
  bill_title_delivery: boolean;
  bill_title_quick_bill: boolean;
  mask_order_id: boolean;
  modifier_default_option_bill: boolean;
  print_bill_both_languages: boolean;
  show_alt_item_title_bill: boolean;
  show_alt_name_bill: boolean;
  show_bill_amount_words: boolean;
  show_bill_no_bill: boolean;
  show_bill_number_prefix_bill: boolean;
  show_bill_print_count: boolean;
  show_brand_name_bill: boolean;
  show_captain_bill: boolean;
  show_covers_bill: boolean;
  show_custom_qr_codes_bill: boolean;
  show_customer_gst_bill: boolean;
  show_customer_bill: boolean;
  show_customer_paid_amount: boolean;
  show_date_bill: boolean;
  show_default_payment: boolean;
  show_discount_reason_bill: boolean;
  show_due_amount_bill: boolean;
  show_ebill_invoice_qrcode: boolean;
  show_item_hsn_code_bill: boolean;
  show_item_level_charges_separately: boolean;
  show_item_note_bill: boolean;
  show_items_sequence_bill: boolean;
  show_kot_number_bill: boolean;
  show_logo_bill: boolean;
  show_order_id_bill: boolean;
  show_order_no_bill: boolean;
  show_order_note_bill: boolean;
  order_type_dine_in: boolean;
  order_type_pickup: boolean;
  order_type_delivery: boolean;
  order_type_quick_bill: boolean;
  show_outlet_name_bill: boolean;
  payment_mode_dine_in: boolean;
  payment_mode_pickup: boolean;
  payment_mode_delivery: boolean;
  payment_mode_quick_bill: boolean;
  table_name_dine_in: boolean;
  table_name_pickup: boolean;
  table_name_delivery: boolean;
  table_name_quick_bill: boolean;
  show_tax_charge_bill: boolean;
  show_username_bill: boolean;
  show_waiter_bill: boolean;
  show_zatca_invoice_qr: boolean;
  show_customer_address_pickup_bill: boolean;
  show_order_placed_time: boolean;
  hide_item_quantity_column: boolean;
  hide_item_rate_column: boolean;
  hide_item_total_column: boolean;
  hide_total_without_tax: boolean;
  // General settings
  customize_url_links: string
  allow_charges_after_bill_print: boolean;
  allow_discount_after_bill_print: boolean;
  allow_discount_before_save: boolean;
  allow_pre_order_tahd: boolean;
  ask_covers: {
    dine_in: boolean;
    pickup: boolean;
    delivery: boolean;
    quick_bill: boolean;
  };
  ask_covers_captain: boolean;
  ask_custom_order_id_quick_bill: boolean;
  ask_custom_order_type_quick_bill: boolean;
  ask_payment_mode_on_save_bill: boolean;
  ask_waiter: {
    dine_in: boolean;
    pickup: boolean;
    delivery: boolean;
    quick_bill: boolean;
  };
  ask_otp_change_order_status_order_window: boolean;
  ask_otp_change_order_status_receipt_section: boolean;
  auto_accept_remote_kot: boolean;
  auto_out_of_stock: boolean;
  auto_sync: boolean;
  customer_display: boolean;
  category_time_for_pos: string;
  count_sales_after_midnight: boolean;
  customer_mandatory: {
    dine_in: boolean;
    pickup: boolean;
    delivery: boolean;
    quick_bill: boolean;
  };
  default_ebill_check: boolean;
  default_send_delivery_boy_check: boolean;
  edit_customize_order_number: string;
  enable_backup_notification_service: boolean;
  enable_customer_display_access: boolean;
  filter_items_by_order_type: boolean;
  generate_reports_start_close_dates: boolean;
  hide_clear_data_check_logout: boolean;
  hide_item_price_options: boolean;
  hide_load_menu_button: boolean;
  make_cancel_delete_reason_compulsory: boolean;
  make_discount_reason_mandatory: boolean;
  make_free_cancel_bill_reason_mandatory: boolean;
  make_payment_ref_number_mandatory: boolean;
  mandatory_delivery_boy_selection: boolean;
  mark_order_as_transfer_order: boolean;
  online_payment_auto_settle: boolean;
  order_sync_settings: {
    auto_sync_interval: string;
    sync_batch_packet_size: string;
  };
  separate_billing_by_section: boolean;
  set_entered_amount_as_opening: boolean;
  show_alternative_item_report_print: boolean;
  show_clear_sales_report_logout: boolean;
  show_order_no_label_pos: boolean;
  show_payment_history_button: boolean;
  show_remote_kot_option: boolean;
  show_send_payment_link: boolean;
  stock_availability_display: boolean;
  todays_report: {
    sales_summary: boolean;
    order_type_summary: boolean;
    payment_type_summary: boolean;
    discount_summary: boolean;
    expense_summary: boolean;
    bill_summary: boolean;
    delivery_boy_summary: boolean;
    waiter_summary: boolean;
    kitchen_department_summary: boolean;
    category_summary: boolean;
    sold_items_summary: boolean;
    cancel_items_summary: boolean;
    wallet_summary: boolean;
    due_payment_received_summary: boolean;
    due_payment_receivable_summary: boolean;
    payment_variance_summary: boolean;
    currency_denominations_summary: boolean;
  };
  upi_payment_sound_notification: boolean;
  use_separate_bill_numbers_online: boolean;
  when_send_todays_report: string;
  enable_currency_conversion: boolean;
  enable_user_login_validation: boolean;
  allow_closing_shift_despite_bills: boolean;
  show_real_time_kot_bill_notifications: boolean;
  // Online orders settings
  show_in_preparation_kds: boolean;
  auto_accept_online_order: boolean;
  customize_order_preparation_time: boolean;
  online_orders_time_delay: string;
  pull_order_on_accept: boolean;
  show_addons_separately: boolean;
  show_complete_online_order_id: boolean;
  show_online_order_preparation_time: boolean;
  update_food_ready_status_kds: boolean;
  created_by_id: string;
  created_date: string;
  updated_by_id?: string;
  updated_date?: string;
}

// const snakeToCamel = (str: string): string => {
//   return str.replace(/(_\w)/g, (match) => match[1].toUpperCase());
// };

const AddOutlet: React.FC<AddOutletProps> = ({ Outlet, onBack }) => {
  const { user } = useAuthContext();
  const [formData, setFormData] = useState<OutletSettings>({
    outletid: Outlet?.outletid || 0,
    hotelid: Outlet?.hotelid || 0,
    outlet_name: '',
    email: '',
    website: '',
    upi_id: '',
    bill_prefix: '',
    secondary_bill_prefix: '',
    bar_bill_prefix: '',
    show_upi_qr: false,
    enabled_bar_section: false,
    show_phone_on_bill: '',
    note: '',
    footer_note: '',
    field1: '',
    field2: '',
    field3: '',
    field4: '',
    fssai_no: '',
    customer_on_kot_dine_in: false,
    customer_on_kot_pickup: false,
    customer_on_kot_delivery: false,
    customer_on_kot_quick_bill: false,
    customer_kot_display_option: 'NAME_ONLY',
    group_kot_items_by_category: false,
    hide_table_name_quick_bill: false,
    show_new_order_tag: true,
    new_order_tag_label: 'New',
    show_running_order_tag: true,
    running_order_tag_label: 'Running',
    dine_in_kot_no: 'DIN-',
    pickup_kot_no: 'PUP-',
    delivery_kot_no: 'DEL-',
    quick_bill_kot_no: 'QBL-',
    modifier_default_option: false,
    print_kot_both_languages: false,
    show_alternative_item: false,
    show_captain_username: false,
    show_covers_as_guest: false,
    show_item_price: true,
    show_kot_no_quick_bill: false,
    show_kot_note: true,
    show_online_order_otp: false,
    show_order_id_quick_bill: false,
    show_order_id_online_order: false,
    show_order_no_quick_bill_section: false,
    show_order_type_symbol: true,
    show_store_name: true,
    show_terminal_username: false,
    show_username: false,
    show_waiter: true,
    bill_title_dine_in: true,
    bill_title_pickup: true,
    bill_title_delivery: true,
    bill_title_quick_bill: true,
    mask_order_id: false,
    modifier_default_option_bill: false,
    print_bill_both_languages: false,
    show_alt_item_title_bill: false,
    show_alt_name_bill: false,
    show_bill_amount_words: false,
    show_bill_no_bill: true,
    show_bill_number_prefix_bill: true,
    show_bill_print_count: false,
    show_brand_name_bill: true,
    show_captain_bill: false,
    show_covers_bill: true,
    show_custom_qr_codes_bill: false,
    show_customer_gst_bill: false,
    show_customer_bill: true,
    show_customer_paid_amount: true,
    show_date_bill: true,
    show_default_payment: true,
    show_discount_reason_bill: false,
    show_due_amount_bill: true,
    show_ebill_invoice_qrcode: false,
    show_item_hsn_code_bill: false,
    show_item_level_charges_separately: false,
    show_item_note_bill: true,
    show_items_sequence_bill: true,
    show_kot_number_bill: false,
    show_logo_bill: true,
    show_order_id_bill: false,
    show_order_no_bill: true,
    show_order_note_bill: true,
    order_type_dine_in: true,
    order_type_pickup: true,
    order_type_delivery: true,
    order_type_quick_bill: true,
    show_outlet_name_bill: true,
    payment_mode_dine_in: true,
    payment_mode_pickup: true,
    payment_mode_delivery: true,
    payment_mode_quick_bill: true,
    table_name_dine_in: true,
    table_name_pickup: false,
    table_name_delivery: false,
    table_name_quick_bill: false,
    show_tax_charge_bill: true,
    show_username_bill: false,
    show_waiter_bill: true,
    show_zatca_invoice_qr: false,
    show_customer_address_pickup_bill: false,
    show_order_placed_time: true,
    hide_item_quantity_column: false,
    hide_item_rate_column: false,
    hide_item_total_column: false,
    hide_total_without_tax: false,
    // General settings
    customize_url_links: '',
    allow_charges_after_bill_print: false,
    allow_discount_after_bill_print: false,
    allow_discount_before_save: false,
    allow_pre_order_tahd: false,
    ask_covers: {
      dine_in: false,
      pickup: false,
      delivery: false,
      quick_bill: false,
    },
    ask_covers_captain: false,
    ask_custom_order_id_quick_bill: false,
    ask_custom_order_type_quick_bill: false,
    ask_payment_mode_on_save_bill: false,
    ask_waiter: {
      dine_in: false,
      pickup: false,
      delivery: false,
      quick_bill: false,
    },
    ask_otp_change_order_status_order_window: false,
    ask_otp_change_order_status_receipt_section: false,
    auto_accept_remote_kot: false,
    auto_out_of_stock: false,
    auto_sync: false,
    category_time_for_pos: '',
    customer_display: false,
    count_sales_after_midnight: false,
    customer_mandatory: {
      dine_in: false,
      pickup: false,
      delivery: false,
      quick_bill: false,
    },
    default_ebill_check: false,
    default_send_delivery_boy_check: false,
    edit_customize_order_number: '',
    enable_backup_notification_service: false,
    enable_customer_display_access: false,
    filter_items_by_order_type: false,
    generate_reports_start_close_dates: false,
    hide_clear_data_check_logout: false,
    hide_item_price_options: false,
    hide_load_menu_button: false,
    make_cancel_delete_reason_compulsory: false,
    make_discount_reason_mandatory: false,
    make_free_cancel_bill_reason_mandatory: false,
    make_payment_ref_number_mandatory: false,
    mandatory_delivery_boy_selection: false,
    mark_order_as_transfer_order: false,
    online_payment_auto_settle: false,
    order_sync_settings: {
      auto_sync_interval: '5',
      sync_batch_packet_size: '10',
    },
    separate_billing_by_section: false,
    set_entered_amount_as_opening: false,
    show_alternative_item_report_print: false,
    show_clear_sales_report_logout: false,
    show_order_no_label_pos: false,
    show_payment_history_button: false,
    show_remote_kot_option: false,
    show_send_payment_link: false,
    stock_availability_display: false,
    todays_report: {
      sales_summary: false,
      order_type_summary: false,
      payment_type_summary: false,
      discount_summary: false,
      expense_summary: false,
      bill_summary: false,
      delivery_boy_summary: false,
      waiter_summary: false,
      kitchen_department_summary: false,
      category_summary: false,
      sold_items_summary: false,
      cancel_items_summary: false,
      wallet_summary: false,
      due_payment_received_summary: false,
      due_payment_receivable_summary: false,
      payment_variance_summary: false,
      currency_denominations_summary: false,
    },
    upi_payment_sound_notification: false,
    use_separate_bill_numbers_online: false,
    when_send_todays_report: '',
    enable_currency_conversion: false,
    enable_user_login_validation: false,
    allow_closing_shift_despite_bills: false,
    show_real_time_kot_bill_notifications: false,
    show_in_preparation_kds: false,
    auto_accept_online_order: false,
    customize_order_preparation_time: false,
    online_orders_time_delay: '0',
    pull_order_on_accept: false,
    show_addons_separately: false,
    show_complete_online_order_id: true,
    show_online_order_preparation_time: true,
    update_food_ready_status_kds: true,
    created_by_id: user?.id?.toString() || '1',
    created_date: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('bill-preview');
  const [timeDelay, setTimeDelay] = useState(0);
  const navigate = useNavigate();
  const outletid = Outlet?.outletid;
  const hotelId = Outlet?.hotelid;
  const baseUrl = 'http://localhost:3001';

  // Fetch outlet settings
  useEffect(() => {
    const fetchOutletBillingSettings = async () => {
      if (!Outlet?.outletid || !Outlet?.hotelid) {
        // Reset to initial state when no outlet is provided
        setFormData((prev) => ({
          ...prev,
          outletid: 0,
          hotelid: 0,
          outlet_name: '',
          outlet_code: '',
        }));
        setError(null);
        setSuccess(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await axios.get(`${baseUrl}/api/outlets/settings/${Outlet.outletid}`);
        const data = response.data;

        if (!data) {
          throw new Error('No data returned from the server.');
        }

        // Log the response for debugging
        console.log('Backend Response:', JSON.stringify(data, null, 2));

        // Parse nested JSON fields and map to formData
        const allFormData: OutletSettings = {
          // Top-level fields
          outletid: data.outletid || 0,
          hotelid: data.hotelid || 0,
          outlet_name: data.outlet_name || '',


          // Bill Preview Settings
          email: data.bill_preview_settings?.email || '',
          website: data.bill_preview_settings?.website || '',
          upi_id: data.bill_preview_settings?.upi_id || '',
          bill_prefix: data.bill_preview_settings?.bill_prefix || '',
          secondary_bill_prefix: data.bill_preview_settings?.secondary_bill_prefix || '',
          bar_bill_prefix: data.bill_preview_settings?.bar_bill_prefix || '',
          show_upi_qr: convertToBoolean(data.bill_preview_settings?.show_upi_qr ?? false),
          enabled_bar_section: convertToBoolean(data.bill_preview_settings?.enabled_bar_section ?? false),
          show_phone_on_bill: data.bill_preview_settings?.show_phone_on_bill || '',
          note: data.bill_preview_settings?.note || '',
          footer_note: data.bill_preview_settings?.footer_note || '',
          field1: data.bill_preview_settings?.field1 || '',
          field2: data.bill_preview_settings?.field2 || '',
          field3: data.bill_preview_settings?.field3 || '',
          field4: data.bill_preview_settings?.field4 || '',
          fssai_no: data.bill_preview_settings?.fssai_no || '',

          // KOT Print Settings
          customer_on_kot_dine_in: convertToBoolean(data.kot_print_settings?.customer_on_kot_dine_in ?? false),
          customer_on_kot_pickup: convertToBoolean(data.kot_print_settings?.customer_on_kot_pickup ?? false),
          customer_on_kot_delivery: convertToBoolean(data.kot_print_settings?.customer_on_kot_delivery ?? false),
          customer_on_kot_quick_bill: convertToBoolean(data.kot_print_settings?.customer_on_kot_quick_bill ?? false),
          customer_kot_display_option: data.kot_print_settings?.customer_kot_display_option || 'NAME_ONLY',
          group_kot_items_by_category: convertToBoolean(data.kot_print_settings?.group_kot_items_by_category ?? false),
          hide_table_name_quick_bill: convertToBoolean(data.kot_print_settings?.hide_table_name_quick_bill ?? false),
          show_new_order_tag: convertToBoolean(data.kot_print_settings?.show_new_order_tag ?? true),
          new_order_tag_label: data.kot_print_settings?.new_order_tag_label || 'New',
          show_running_order_tag: convertToBoolean(data.kot_print_settings?.show_running_order_tag ?? true),
          running_order_tag_label: data.kot_print_settings?.running_order_tag_label || 'Running',
          dine_in_kot_no: data.kot_print_settings?.dine_in_kot_no || 'DIN-',
          pickup_kot_no: data.kot_print_settings?.pickup_kot_no || 'PUP-',
          delivery_kot_no: data.kot_print_settings?.delivery_kot_no || 'DEL-',
          quick_bill_kot_no: data.kot_print_settings?.quick_bill_kot_no || 'QBL-',
          modifier_default_option: convertToBoolean(data.kot_print_settings?.modifier_default_option ?? false),
          print_kot_both_languages: convertToBoolean(data.kot_print_settings?.print_kot_both_languages ?? false),
          show_alternative_item: convertToBoolean(data.kot_print_settings?.show_alternative_item ?? false),
          show_captain_username: convertToBoolean(data.kot_print_settings?.show_captain_username ?? false),
          show_covers_as_guest: convertToBoolean(data.kot_print_settings?.show_covers_as_guest ?? false),
          show_item_price: convertToBoolean(data.kot_print_settings?.show_item_price ?? true),
          show_kot_no_quick_bill: convertToBoolean(data.kot_print_settings?.show_kot_no_quick_bill ?? false),
          show_kot_note: convertToBoolean(data.kot_print_settings?.show_kot_note ?? true),
          show_online_order_otp: convertToBoolean(data.kot_print_settings?.show_online_order_otp ?? false),
          show_order_id_quick_bill: convertToBoolean(data.kot_print_settings?.show_order_id_quick_bill ?? false),
          show_order_id_online_order: convertToBoolean(data.kot_print_settings?.show_order_id_online_order ?? false),
          show_order_no_quick_bill_section: convertToBoolean(data.kot_print_settings?.show_order_no_quick_bill_section ?? false),
          show_order_type_symbol: convertToBoolean(data.kot_print_settings?.show_order_type_symbol ?? true),
          show_store_name: convertToBoolean(data.kot_print_settings?.show_store_name ?? true),
          show_terminal_username: convertToBoolean(data.kot_print_settings?.show_terminal_username ?? false),
          show_username: convertToBoolean(data.kot_print_settings?.show_username ?? false),
          show_waiter: convertToBoolean(data.kot_print_settings?.show_waiter ?? true),

          // Bill Print Settings
          bill_title_dine_in: convertToBoolean(data.bill_print_settings?.bill_title_dine_in ?? true),
          bill_title_pickup: convertToBoolean(data.bill_print_settings?.bill_title_pickup ?? true),
          bill_title_delivery: convertToBoolean(data.bill_print_settings?.bill_title_delivery ?? true),
          bill_title_quick_bill: convertToBoolean(data.bill_print_settings?.bill_title_quick_bill ?? true),
          mask_order_id: convertToBoolean(data.bill_print_settings?.mask_order_id ?? false),
          modifier_default_option_bill: convertToBoolean(data.bill_print_settings?.modifier_default_option_bill ?? false),
          print_bill_both_languages: convertToBoolean(data.bill_print_settings?.print_bill_both_languages ?? false),
          show_alt_item_title_bill: convertToBoolean(data.bill_print_settings?.show_alt_item_title_bill ?? false),
          show_alt_name_bill: convertToBoolean(data.bill_print_settings?.show_alt_name_bill ?? false),
          show_bill_amount_words: convertToBoolean(data.bill_print_settings?.show_bill_amount_words ?? false),
          show_bill_no_bill: convertToBoolean(data.bill_print_settings?.show_bill_no_bill ?? true),
          show_bill_number_prefix_bill: convertToBoolean(data.bill_print_settings?.show_bill_number_prefix_bill ?? true),
          show_bill_print_count: convertToBoolean(data.bill_print_settings?.show_bill_print_count ?? false),
          show_brand_name_bill: convertToBoolean(data.bill_print_settings?.show_brand_name_bill ?? true),
          show_captain_bill: convertToBoolean(data.bill_print_settings?.show_captain_bill ?? false),
          show_covers_bill: convertToBoolean(data.bill_print_settings?.show_covers_bill ?? true),
          show_custom_qr_codes_bill: convertToBoolean(data.bill_print_settings?.show_custom_qr_codes_bill ?? false),
          show_customer_gst_bill: convertToBoolean(data.bill_print_settings?.show_customer_gst_bill ?? false),
          show_customer_bill: convertToBoolean(data.bill_print_settings?.show_customer_bill ?? true),
          show_customer_paid_amount: convertToBoolean(data.bill_print_settings?.show_customer_paid_amount ?? true),
          show_date_bill: convertToBoolean(data.bill_print_settings?.show_date_bill ?? true),
          show_default_payment: convertToBoolean(data.bill_print_settings?.show_default_payment ?? true),
          show_discount_reason_bill: convertToBoolean(data.bill_print_settings?.show_discount_reason_bill ?? false),
          show_due_amount_bill: convertToBoolean(data.bill_print_settings?.show_due_amount_bill ?? true),
          show_ebill_invoice_qrcode: convertToBoolean(data.bill_print_settings?.show_ebill_invoice_qrcode ?? false),
          show_item_hsn_code_bill: convertToBoolean(data.bill_print_settings?.show_item_hsn_code_bill ?? false),
          show_item_level_charges_separately: convertToBoolean(data.bill_print_settings?.show_item_level_charges_separately ?? false),
          show_item_note_bill: convertToBoolean(data.bill_print_settings?.show_item_note_bill ?? true),
          show_items_sequence_bill: convertToBoolean(data.bill_print_settings?.show_items_sequence_bill ?? true),
          show_kot_number_bill: convertToBoolean(data.bill_print_settings?.show_kot_number_bill ?? false),
          show_logo_bill: convertToBoolean(data.bill_print_settings?.show_logo_bill ?? true),
          show_order_id_bill: convertToBoolean(data.bill_print_settings?.show_order_id_bill ?? false),
          show_order_no_bill: convertToBoolean(data.bill_print_settings?.show_order_no_bill ?? true),
          show_order_note_bill: convertToBoolean(data.bill_print_settings?.show_order_note_bill ?? true),
          order_type_dine_in: convertToBoolean(data.bill_print_settings?.order_type_dine_in ?? true),
          order_type_pickup: convertToBoolean(data.bill_print_settings?.order_type_pickup ?? true),
          order_type_delivery: convertToBoolean(data.bill_print_settings?.order_type_delivery ?? true),
          order_type_quick_bill: convertToBoolean(data.bill_print_settings?.order_type_quick_bill ?? true),
          show_outlet_name_bill: convertToBoolean(data.bill_print_settings?.show_outlet_name_bill ?? true),
          payment_mode_dine_in: convertToBoolean(data.bill_print_settings?.payment_mode_dine_in ?? true),
          payment_mode_pickup: convertToBoolean(data.bill_print_settings?.payment_mode_pickup ?? true),
          payment_mode_delivery: convertToBoolean(data.bill_print_settings?.payment_mode_delivery ?? true),
          payment_mode_quick_bill: convertToBoolean(data.bill_print_settings?.payment_mode_quick_bill ?? true),
          table_name_dine_in: convertToBoolean(data.bill_print_settings?.table_name_dine_in ?? true),
          table_name_pickup: convertToBoolean(data.bill_print_settings?.table_name_pickup ?? false),
          table_name_delivery: convertToBoolean(data.bill_print_settings?.table_name_delivery ?? false),
          table_name_quick_bill: convertToBoolean(data.bill_print_settings?.table_name_quick_bill ?? false),
          show_tax_charge_bill: convertToBoolean(data.bill_print_settings?.show_tax_charge_bill ?? true),
          show_username_bill: convertToBoolean(data.bill_print_settings?.show_username_bill ?? false),
          show_waiter_bill: convertToBoolean(data.bill_print_settings?.show_waiter_bill ?? true),
          show_zatca_invoice_qr: convertToBoolean(data.bill_print_settings?.show_zatca_invoice_qr ?? false),
          show_customer_address_pickup_bill: convertToBoolean(data.bill_print_settings?.show_customer_address_pickup_bill ?? false),
          show_order_placed_time: convertToBoolean(data.bill_print_settings?.show_order_placed_time ?? true),
          hide_item_quantity_column: convertToBoolean(data.bill_print_settings?.hide_item_quantity_column ?? false),
          hide_item_rate_column: convertToBoolean(data.bill_print_settings?.hide_item_rate_column ?? false),
          hide_item_total_column: convertToBoolean(data.bill_print_settings?.hide_item_total_column ?? false),
          hide_total_without_tax: convertToBoolean(data.bill_print_settings?.hide_total_without_tax ?? false),

          // General Settings
          customize_url_links: data.general_settings?.customize_url_links || '',
          allow_charges_after_bill_print: convertToBoolean(data.general_settings?.allow_charges_after_bill_print ?? false),
          allow_discount_after_bill_print: convertToBoolean(data.general_settings?.allow_discount_after_bill_print ?? false),
          allow_discount_before_save: convertToBoolean(data.general_settings?.allow_discount_before_save ?? false),
          allow_pre_order_tahd: convertToBoolean(data.general_settings?.allow_pre_order_tahd ?? false),
          ask_covers: parseJsonSafely(data.general_settings?.ask_covers, {
            dine_in: false,
            pickup: false,
            delivery: false,
            quick_bill: false,
          }),
          ask_covers_captain: convertToBoolean(data.general_settings?.ask_covers_captain ?? false),
          ask_custom_order_id_quick_bill: convertToBoolean(data.general_settings?.ask_custom_order_id_quick_bill ?? false),
          ask_custom_order_type_quick_bill: convertToBoolean(data.general_settings?.ask_custom_order_type_quick_bill ?? false),
          ask_payment_mode_on_save_bill: convertToBoolean(data.general_settings?.ask_payment_mode_on_save_bill ?? false),
          ask_waiter: parseJsonSafely(data.general_settings?.ask_waiter, {
            dine_in: false,
            pickup: false,
            delivery: false,
            quick_bill: false,
          }),
          ask_otp_change_order_status_order_window: convertToBoolean(data.general_settings?.ask_otp_change_order_status_order_window ?? false),
          ask_otp_change_order_status_receipt_section: convertToBoolean(data.general_settings?.ask_otp_change_order_status_receipt_section ?? false),
          auto_accept_remote_kot: convertToBoolean(data.general_settings?.auto_accept_remote_kot ?? false),
          auto_out_of_stock: convertToBoolean(data.general_settings?.auto_out_of_stock ?? false),
          auto_sync: convertToBoolean(data.general_settings?.auto_sync ?? false),
          category_time_for_pos: data.general_settings?.category_time_for_pos || '',
          count_sales_after_midnight: convertToBoolean(data.general_settings?.count_sales_after_midnight ?? false),
          customer_display: parseJsonSafely(data.general_settings?.customer_display, null),
          customer_mandatory: parseJsonSafely(data.general_settings?.customer_mandatory, {
            dine_in: false,
            pickup: false,
            delivery: false,
            quick_bill: false,
          }),
          default_ebill_check: convertToBoolean(data.general_settings?.default_ebill_check ?? false),
          default_send_delivery_boy_check: convertToBoolean(data.general_settings?.default_send_delivery_boy_check ?? false),
          edit_customize_order_number: data.general_settings?.edit_customize_order_number || '',
          enable_backup_notification_service: convertToBoolean(data.general_settings?.enable_backup_notification_service ?? false),
          enable_customer_display_access: convertToBoolean(data.general_settings?.enable_customer_display_access ?? false),
          filter_items_by_order_type: convertToBoolean(data.general_settings?.filter_items_by_order_type ?? false),
          generate_reports_start_close_dates: convertToBoolean(data.general_settings?.generate_reports_start_close_dates ?? false),
          hide_clear_data_check_logout: convertToBoolean(data.general_settings?.hide_clear_data_check_logout ?? false),
          hide_item_price_options: convertToBoolean(data.general_settings?.hide_item_price_options ?? false),
          hide_load_menu_button: convertToBoolean(data.general_settings?.hide_load_menu_button ?? false),
          make_cancel_delete_reason_compulsory: convertToBoolean(data.general_settings?.make_cancel_delete_reason_compulsory ?? false),
          make_discount_reason_mandatory: convertToBoolean(data.general_settings?.make_discount_reason_mandatory ?? false),
          make_free_cancel_bill_reason_mandatory: convertToBoolean(data.general_settings?.make_free_cancel_bill_reason_mandatory ?? false),
          make_payment_ref_number_mandatory: convertToBoolean(data.general_settings?.make_payment_ref_number_mandatory ?? false),
          mandatory_delivery_boy_selection: convertToBoolean(data.general_settings?.mandatory_delivery_boy_selection ?? false),
          mark_order_as_transfer_order: convertToBoolean(data.general_settings?.mark_order_as_transfer_order ?? false),
          online_payment_auto_settle: convertToBoolean(data.general_settings?.online_payment_auto_settle ?? false),
          order_sync_settings: parseJsonSafely(data.general_settings?.order_sync_settings, {
            auto_sync_interval: '5',
            sync_batch_packet_size: '10',
          }),
          separate_billing_by_section: convertToBoolean(data.general_settings?.separate_billing_by_section ?? false),
          set_entered_amount_as_opening: convertToBoolean(data.general_settings?.set_entered_amount_as_opening ?? false),
          show_alternative_item_report_print: convertToBoolean(data.general_settings?.show_alternative_item_report_print ?? false),
          show_clear_sales_report_logout: convertToBoolean(data.general_settings?.show_clear_sales_report_logout ?? false),
          show_order_no_label_pos: convertToBoolean(data.general_settings?.show_order_no_label_pos ?? false),
          show_payment_history_button: convertToBoolean(data.general_settings?.show_payment_history_button ?? false),
          show_remote_kot_option: convertToBoolean(data.general_settings?.show_remote_kot_option ?? false),
          show_send_payment_link: convertToBoolean(data.general_settings?.show_send_payment_link ?? false),
          stock_availability_display: convertToBoolean(data.general_settings?.stock_availability_display ?? false),
          todays_report: parseJsonSafely(data.general_settings?.todays_report, {
            sales_summary: false,
            order_type_summary: false,
            payment_type_summary: false,
            discount_summary: false,
            expense_summary: false,
            bill_summary: false,
            delivery_boy_summary: false,
            waiter_summary: false,
            kitchen_department_summary: false,
            category_summary: false,
            sold_items_summary: false,
            cancel_items_summary: false,
            wallet_summary: false,
            due_payment_received_summary: false,
            due_payment_receivable_summary: false,
            payment_variance_summary: false,
            currency_denominations_summary: false,
          }),
          upi_payment_sound_notification: convertToBoolean(data.general_settings?.upi_payment_sound_notification ?? false),
          use_separate_bill_numbers_online: convertToBoolean(data.general_settings?.use_separate_bill_numbers_online ?? false),
          when_send_todays_report: data.general_settings?.when_send_todays_report || '',
          enable_currency_conversion: convertToBoolean(data.general_settings?.enable_currency_conversion ?? false),
          enable_user_login_validation: convertToBoolean(data.general_settings?.enable_user_login_validation ?? false),
          allow_closing_shift_despite_bills: convertToBoolean(data.general_settings?.allow_closing_shift_despite_bills ?? false),
          show_real_time_kot_bill_notifications: convertToBoolean(data.general_settings?.show_real_time_kot_bill_notifications ?? false),

          // Online Orders Settings
          show_in_preparation_kds: convertToBoolean(data.online_orders_settings?.show_in_preparation_kds ?? false),
          auto_accept_online_order: convertToBoolean(data.online_orders_settings?.auto_accept_online_order ?? false),
          customize_order_preparation_time: convertToBoolean(data.online_orders_settings?.customize_order_preparation_time ?? false),
          online_orders_time_delay: data.online_orders_settings?.online_orders_time_delay || '0',
          pull_order_on_accept: convertToBoolean(data.online_orders_settings?.pull_order_on_accept ?? false),
          show_addons_separately: convertToBoolean(data.online_orders_settings?.show_addons_separately ?? false),
          show_complete_online_order_id: convertToBoolean(data.online_orders_settings?.show_complete_online_order_id ?? true),
          show_online_order_preparation_time: convertToBoolean(data.online_orders_settings?.show_online_order_preparation_time ?? true),
          update_food_ready_status_kds: convertToBoolean(data.online_orders_settings?.update_food_ready_status_kds ?? true),

          // Metadata
          created_by_id: data.general_settings?.created_by_id || user?.id?.toString() || '1',
          created_date: data.general_settings?.created_at || new Date().toISOString(),
          updated_by_id: data.general_settings?.updated_by_id || user?.id?.toString() || '1',
          updated_date: data.general_settings?.updated_at || new Date().toISOString(),
        };

        setFormData(allFormData);
        setSuccess('Outlet settings fetched successfully.');
      } catch (error) {
        console.error('Error fetching outlet settings:', error);
        setError('Failed to fetch outlet settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchOutletBillingSettings();
  }, [Outlet?.outletid, Outlet?.hotelid, user?.id, baseUrl]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNestedChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    category: string,
    key: string
  ) => {
    const { checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof OutletSettings] as object,
        [key]: checked,
      },
    }));
  };

  const handleIncrement = () => {
    setTimeDelay((prev) => prev + 1);
    setFormData((prev) => ({
      ...prev,
      online_orders_time_delay: (timeDelay + 1).toString(),
    }));
  };

  const handleDecrement = () => {
    setTimeDelay((prev) => (prev > 0 ? prev - 1 : 0));
    setFormData((prev) => ({
      ...prev,
      online_orders_time_delay: (timeDelay > 0 ? timeDelay - 1 : 0).toString(),
    }));
  };

  // Handle Cancel
  const handleCancel = () => {
    // Navigate back to the Outlet.tsx page or call onBack
    if (onBack) {
      onBack();
    } else {
      navigate('/outlets'); // Adjust route as per your setup
    }
  };

  const handleUpdate = async () => {
    if (!outletid || !hotelId) {
      toast.error('Outlet ID and Hotel ID are required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Updating settings for outletid:', outletid, 'hotelId:', hotelId); // Debug log

      // Bill Preview Settings Payload
      const billPreviewPayload = {
        outlet_name: formData.outlet_name,
        email: formData.email,
        website: formData.website,
        upi_id: formData.upi_id,
        bill_prefix: formData.bill_prefix,
        secondary_bill_prefix: formData.secondary_bill_prefix,
        bar_bill_prefix: formData.bar_bill_prefix,
        show_upi_qr: formData.show_upi_qr ? 1 : 0,
        enabled_bar_section: formData.enabled_bar_section ? 1 : 0,
        show_phone_on_bill: formData.show_phone_on_bill,
        note: formData.note,
        footer_note: formData.footer_note,
        field1: formData.field1,
        field2: formData.field2,
        field3: formData.field3,
        field4: formData.field4,
        fssai_no: formData.fssai_no,
      };

      // KOT Print Settings Payload
      const kotPrintPayload = {
        customer_on_kot_dine_in: formData.customer_on_kot_dine_in ? 1 : 0,
        customer_on_kot_pickup: formData.customer_on_kot_pickup ? 1 : 0,
        customer_on_kot_delivery: formData.customer_on_kot_delivery ? 1 : 0,
        customer_on_kot_quick_bill: formData.customer_on_kot_quick_bill ? 1 : 0,
        customer_kot_display_option: formData.customer_kot_display_option,
        group_kot_items_by_category: formData.group_kot_items_by_category ? 1 : 0,
        hide_table_name_quick_bill: formData.hide_table_name_quick_bill ? 1 : 0,
        show_new_order_tag: formData.show_new_order_tag ? 1 : 0,
        new_order_tag_label: formData.new_order_tag_label,
        show_running_order_tag: formData.show_running_order_tag ? 1 : 0,
        running_order_tag_label: formData.running_order_tag_label,
        dine_in_kot_no: formData.dine_in_kot_no,
        pickup_kot_no: formData.pickup_kot_no,
        delivery_kot_no: formData.delivery_kot_no,
        quick_bill_kot_no: formData.quick_bill_kot_no,
        modifier_default_option: formData.modifier_default_option ? 1 : 0,
        print_kot_both_languages: formData.print_kot_both_languages ? 1 : 0,
        show_alternative_item: formData.show_alternative_item ? 1 : 0,
        show_captain_username: formData.show_captain_username ? 1 : 0,
        show_covers_as_guest: formData.show_covers_as_guest ? 1 : 0,
        show_item_price: formData.show_item_price ? 1 : 0,
        show_kot_no_quick_bill: formData.show_kot_no_quick_bill ? 1 : 0,
        show_kot_note: formData.show_kot_note ? 1 : 0,
        show_online_order_otp: formData.show_online_order_otp ? 1 : 0,
        show_order_id_quick_bill: formData.show_order_id_quick_bill ? 1 : 0,
        show_order_id_online_order: formData.show_order_id_online_order ? 1 : 0,
        show_order_no_quick_bill_section: formData.show_order_no_quick_bill_section ? 1 : 0,
        show_order_type_symbol: formData.show_order_type_symbol ? 1 : 0,
        show_store_name: formData.show_store_name ? 1 : 0,
        show_terminal_username: formData.show_terminal_username ? 1 : 0,
        show_username: formData.show_username ? 1 : 0,
        show_waiter: formData.show_waiter ? 1 : 0,
      };

      // Bill Print Settings Payload
      const billPrintPayload = {
        bill_title_dine_in: formData.bill_title_dine_in ? 1 : 0,
        bill_title_pickup: formData.bill_title_pickup ? 1 : 0,
        bill_title_delivery: formData.bill_title_delivery ? 1 : 0,
        bill_title_quick_bill: formData.bill_title_quick_bill ? 1 : 0,
        mask_order_id: formData.mask_order_id ? 1 : 0,
        modifier_default_option_bill: formData.modifier_default_option_bill ? 1 : 0,
        print_bill_both_languages: formData.print_bill_both_languages ? 1 : 0,
        show_alt_item_title_bill: formData.show_alt_item_title_bill ? 1 : 0,
        show_alt_name_bill: formData.show_alt_name_bill ? 1 : 0,
        show_bill_amount_words: formData.show_bill_amount_words ? 1 : 0,
        show_bill_no_bill: formData.show_bill_no_bill ? 1 : 0,
        show_bill_number_prefix_bill: formData.show_bill_number_prefix_bill ? 1 : 0,
        show_bill_print_count: formData.show_bill_print_count ? 1 : 0,
        show_brand_name_bill: formData.show_brand_name_bill ? 1 : 0,
        show_captain_bill: formData.show_captain_bill ? 1 : 0,
        show_covers_bill: formData.show_covers_bill ? 1 : 0,
        show_custom_qr_codes_bill: formData.show_custom_qr_codes_bill ? 1 : 0,
        show_customer_gst_bill: formData.show_customer_gst_bill ? 1 : 0,
        show_customer_bill: formData.show_customer_bill ? 1 : 0,
        show_customer_paid_amount: formData.show_customer_paid_amount ? 1 : 0,
        show_date_bill: formData.show_date_bill ? 1 : 0,
        show_default_payment: formData.show_default_payment ? 1 : 0,
        show_discount_reason_bill: formData.show_discount_reason_bill ? 1 : 0,
        show_due_amount_bill: formData.show_due_amount_bill ? 1 : 0,
        show_ebill_invoice_qrcode: formData.show_ebill_invoice_qrcode ? 1 : 0,
        show_item_hsn_code_bill: formData.show_item_hsn_code_bill ? 1 : 0,
        show_item_level_charges_separately: formData.show_item_level_charges_separately ? 1 : 0,
        show_item_note_bill: formData.show_item_note_bill ? 1 : 0,
        show_items_sequence_bill: formData.show_items_sequence_bill ? 1 : 0,
        show_kot_number_bill: formData.show_kot_number_bill ? 1 : 0,
        show_logo_bill: formData.show_logo_bill ? 1 : 0,
        show_order_id_bill: formData.show_order_id_bill ? 1 : 0,
        show_order_no_bill: formData.show_order_no_bill ? 1 : 0,
        show_order_note_bill: formData.show_order_note_bill ? 1 : 0,
        order_type_dine_in: formData.order_type_dine_in ? 1 : 0,
        order_type_pickup: formData.order_type_pickup ? 1 : 0,
        order_type_delivery: formData.order_type_delivery ? 1 : 0,
        order_type_quick_bill: formData.order_type_quick_bill ? 1 : 0,
        show_outlet_name_bill: formData.show_outlet_name_bill ? 1 : 0,
        payment_mode_dine_in: formData.payment_mode_dine_in ? 1 : 0,
        payment_mode_pickup: formData.payment_mode_pickup ? 1 : 0,
        payment_mode_delivery: formData.payment_mode_delivery ? 1 : 0,
        payment_mode_quick_bill: formData.payment_mode_quick_bill ? 1 : 0,
        table_name_dine_in: formData.table_name_dine_in ? 1 : 0,
        table_name_pickup: formData.table_name_pickup ? 1 : 0,
        table_name_delivery: formData.table_name_delivery ? 1 : 0,
        table_name_quick_bill: formData.table_name_quick_bill ? 1 : 0,
        show_tax_charge_bill: formData.show_tax_charge_bill ? 1 : 0,
        show_username_bill: formData.show_username_bill ? 1 : 0,
        show_waiter_bill: formData.show_waiter_bill ? 1 : 0,
        show_zatca_invoice_qr: formData.show_zatca_invoice_qr ? 1 : 0,
        show_customer_address_pickup_bill: formData.show_customer_address_pickup_bill ? 1 : 0,
        show_order_placed_time: formData.show_order_placed_time ? 1 : 0,
        hide_item_quantity_column: formData.hide_item_quantity_column ? 1 : 0,
        hide_item_rate_column: formData.hide_item_rate_column ? 1 : 0,
        hide_item_total_column: formData.hide_item_total_column ? 1 : 0,
        hide_total_without_tax: formData.hide_total_without_tax ? 1 : 0,
      };

      // General Settings Payload
      const generalPayload = {
        allow_charges_after_bill_print: formData.allow_charges_after_bill_print ? 1 : 0,
        allow_discount_after_bill_print: formData.allow_discount_after_bill_print ? 1 : 0,
        allow_discount_before_save: formData.allow_discount_before_save ? 1 : 0,
        allow_pre_order_tahd: formData.allow_pre_order_tahd ? 1 : 0,
        ask_covers: {
          dine_in: formData.ask_covers.dine_in ? 1 : 0,
          pickup: formData.ask_covers.pickup ? 1 : 0,
          delivery: formData.ask_covers.delivery ? 1 : 0,
          quick_bill: formData.ask_covers.quick_bill ? 1 : 0,
        },
        ask_covers_captain: formData.ask_covers_captain ? 1 : 0,
        ask_custom_order_id_quick_bill: formData.ask_custom_order_id_quick_bill ? 1 : 0,
        ask_custom_order_type_quick_bill: formData.ask_custom_order_type_quick_bill ? 1 : 0,
        ask_payment_mode_on_save_bill: formData.ask_payment_mode_on_save_bill ? 1 : 0,
        ask_waiter: {
          dine_in: formData.ask_waiter.dine_in ? 1 : 0,
          pickup: formData.ask_waiter.pickup ? 1 : 0,
          delivery: formData.ask_waiter.delivery ? 1 : 0,
          quick_bill: formData.ask_waiter.quick_bill ? 1 : 0,
        },
        ask_otp_change_order_status_order_window: formData.ask_otp_change_order_status_order_window ? 1 : 0,
        ask_otp_change_order_status_receipt_section: formData.ask_otp_change_order_status_receipt_section ? 1 : 0,
        auto_accept_remote_kot: formData.auto_accept_remote_kot ? 1 : 0,
        auto_out_of_stock: formData.auto_out_of_stock ? 1 : 0,
        auto_sync: formData.auto_sync ? 1 : 0,
        category_time_for_pos: formData.category_time_for_pos,
        count_sales_after_midnight: formData.count_sales_after_midnight ? 1 : 0,
        customer_mandatory: {
          dine_in: formData.customer_mandatory.dine_in ? 1 : 0,
          pickup: formData.customer_mandatory.pickup ? 1 : 0,
          delivery: formData.customer_mandatory.delivery ? 1 : 0,
          quick_bill: formData.customer_mandatory.quick_bill ? 1 : 0,
        },
        default_ebill_check: formData.default_ebill_check ? 1 : 0,
        default_send_delivery_boy_check: formData.default_send_delivery_boy_check ? 1 : 0,
        edit_customize_order_number: formData.edit_customize_order_number,
        enable_backup_notification_service: formData.enable_backup_notification_service ? 1 : 0,
        enable_customer_display_access: formData.enable_customer_display_access ? 1 : 0,
        filter_items_by_order_type: formData.filter_items_by_order_type ? 1 : 0,
        generate_reports_start_close_dates: formData.generate_reports_start_close_dates ? 1 : 0,
        hide_clear_data_check_logout: formData.hide_clear_data_check_logout ? 1 : 0,
        hide_item_price_options: formData.hide_item_price_options ? 1 : 0,
        hide_load_menu_button: formData.hide_load_menu_button ? 1 : 0,
        make_cancel_delete_reason_compulsory: formData.make_cancel_delete_reason_compulsory ? 1 : 0,
        make_discount_reason_mandatory: formData.make_discount_reason_mandatory ? 1 : 0,
        make_free_cancel_bill_reason_mandatory: formData.make_free_cancel_bill_reason_mandatory ? 1 : 0,
        make_payment_ref_number_mandatory: formData.make_payment_ref_number_mandatory ? 1 : 0,
        mandatory_delivery_boy_selection: formData.mandatory_delivery_boy_selection ? 1 : 0,
        mark_order_as_transfer_order: formData.mark_order_as_transfer_order ? 1 : 0,
        online_payment_auto_settle: formData.online_payment_auto_settle ? 1 : 0,
        order_sync_settings: {
          auto_sync_interval: formData.order_sync_settings.auto_sync_interval,
          sync_batch_packet_size: formData.order_sync_settings.sync_batch_packet_size,
        },
        separate_billing_by_section: formData.separate_billing_by_section ? 1 : 0,
        set_entered_amount_as_opening: formData.set_entered_amount_as_opening ? 1 : 0,
        show_alternative_item_report_print: formData.show_alternative_item_report_print ? 1 : 0,
        show_clear_sales_report_logout: formData.show_clear_sales_report_logout ? 1 : 0,
        show_order_no_label_pos: formData.show_order_no_label_pos ? 1 : 0,
        show_payment_history_button: formData.show_payment_history_button ? 1 : 0,
        show_remote_kot_option: formData.show_remote_kot_option ? 1 : 0,
        show_send_payment_link: formData.show_send_payment_link ? 1 : 0,
        stock_availability_display: formData.stock_availability_display ? 1 : 0,
        todays_report: {
          sales_summary: formData.todays_report.sales_summary ? 1 : 0,
          order_type_summary: formData.todays_report.order_type_summary ? 1 : 0,
          payment_type_summary: formData.todays_report.payment_type_summary ? 1 : 0,
          discount_summary: formData.todays_report.discount_summary ? 1 : 0,
          expense_summary: formData.todays_report.expense_summary ? 1 : 0,
          bill_summary: formData.todays_report.bill_summary ? 1 : 0,
          delivery_boy_summary: formData.todays_report.delivery_boy_summary ? 1 : 0,
          waiter_summary: formData.todays_report.waiter_summary ? 1 : 0,
          kitchen_department_summary: formData.todays_report.kitchen_department_summary ? 1 : 0,
          category_summary: formData.todays_report.category_summary ? 1 : 0,
          sold_items_summary: formData.todays_report.sold_items_summary ? 1 : 0,
          cancel_items_summary: formData.todays_report.cancel_items_summary ? 1 : 0,
          wallet_summary: formData.todays_report.wallet_summary ? 1 : 0,
          due_payment_received_summary: formData.todays_report.due_payment_received_summary ? 1 : 0,
          due_payment_receivable_summary: formData.todays_report.due_payment_receivable_summary ? 1 : 0,
          payment_variance_summary: formData.todays_report.payment_variance_summary ? 1 : 0,
          currency_denominations_summary: formData.todays_report.currency_denominations_summary ? 1 : 0,
        },
        upi_payment_sound_notification: formData.upi_payment_sound_notification ? 1 : 0,
        use_separate_bill_numbers_online: formData.use_separate_bill_numbers_online ? 1 : 0,
        when_send_todays_report: formData.when_send_todays_report,
        enable_currency_conversion: formData.enable_currency_conversion ? 1 : 0,
        enable_user_login_validation: formData.enable_user_login_validation ? 1 : 0,
        allow_closing_shift_despite_bills: formData.allow_closing_shift_despite_bills ? 1 : 0,
        show_real_time_kot_bill_notifications: formData.show_real_time_kot_bill_notifications ? 1 : 0,
      };

      // Online Orders Settings Payload
      const onlineOrdersPayload = {
        outletid,
        hotelId,
        show_in_preparation_kds: formData.show_in_preparation_kds ? 1 : 0,
        auto_accept_online_order: formData.auto_accept_online_order ? 1 : 0,
        customize_order_preparation_time: formData.customize_order_preparation_time ? 1 : 0,
        online_orders_time_delay: parseInt(formData.online_orders_time_delay, 10) || 0,
        pull_order_on_accept: formData.pull_order_on_accept ? 1 : 0,
        show_addons_separately: formData.show_addons_separately ? 1 : 0,
        show_complete_online_order_id: formData.show_complete_online_order_id ? 1 : 0,
        show_online_order_preparation_time: formData.show_online_order_preparation_time ? 1 : 0,
        update_food_ready_status_kds: formData.update_food_ready_status_kds ? 1 : 0,
      };

      // Perform separate PUT requests for each section with error handling
      const requests = [
      axios.put(`${baseUrl}/api/outlets/bill-preview-settings/${outletid}`, billPreviewPayload, {
        headers: { 'Content-Type': 'application/json' },
      }),
      axios.put(`${baseUrl}/api/outlets/kot-print-settings/${outletid}`, kotPrintPayload, {
        headers: { 'Content-Type': 'application/json' },
      }),
      axios.put(`${baseUrl}/api/outlets/bill-print-settings/${outletid}`, billPrintPayload, {
        headers: { 'Content-Type': 'application/json' },
      }),
      axios.put(`${baseUrl}/api/outlets/general-settings/${outletid}`, generalPayload, {
        headers: { 'Content-Type': 'application/json' },
      }),
      axios.put(`${baseUrl}/api/outlets/online-orders-settings/${outletid}`, onlineOrdersPayload, {
        headers: { 'Content-Type': 'application/json' },
      }),
    ];

    // Wait for all requests to complete
    await Promise.all(requests);

    
    setSuccess('Settings updatede successfully');
  
   
  } catch (err: any) {
    const errorMessage = err.response?.data?.message || err.message || 'Failed to update settings';
    setError(`Error updating settings: ${errorMessage}`);
    console.error('Error updating settings:', err.response?.status, err.response?.data, err.message);
    if (err.response?.status === 404) {
      console.log('Endpoint not found. Check the following URLs:', {
        billPreview: `${baseUrl}/api/outlets/bill-preview-settings/${outletid}`,
        kotPrint: `${baseUrl}/api/outlets/kot-print-settings/${outletid}`,
        billPrint: `${baseUrl}/api/outlets/bill-print-settings/${outletid}`,
        general: `${baseUrl}/api/outlets/general-settings/${outletid}`,
        onlineOrders: `${baseUrl}/api/outlets/online-orders-settings/${outletid}`,
      });
    }
    
   
    toast.error(errorMessage);
  } finally {
    setLoading(false);
      if (onBack) {
      onBack();
    } else {
      navigate('/outlets'); // Adjust route as per your setup
    }
  }
};
  return (
    <div className="m-0">
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {loading && (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      {!loading && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            {/* Left side heading */}
            <h1 className="display-6 fw-bold mb-0">Outlet Level Settings</h1>

            {/* Right side buttons */}
            <div
              className="d-flex justify-content-end gap-3 mt-4"
              style={{ padding: '10px' }}
            >
              <Button className="btn btn-danger" onClick={handleCancel}>
                Cancel
              </Button>
              <Button className="btn btn-success" onClick={handleUpdate}>
                Update
              </Button>
            </div>
          </div>
          <ul className="nav nav-tabs mb-4" id="settingsTabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'bill-preview' ? 'active' : ''}`}
                id="bill-preview-tab"
                type="button"
                role="tab"
                aria-controls="bill-preview"
                aria-selected={activeTab === 'bill-preview'}
                onClick={() => setActiveTab('bill-preview')}
              >
                BILL PREVIEW SETTINGS
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'kot-print' ? 'active' : ''}`}
                id="kot-print-tab"
                type="button"
                role="tab"
                aria-controls="kot-print"
                aria-selected={activeTab === 'kot-print'}
                onClick={() => setActiveTab('kot-print')}
              >
                KOT PRINT SETTINGS
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'bill-print' ? 'active' : ''}`}
                id="bill-print-tab"
                type="button"
                role="tab"
                aria-controls="bill-print"
                aria-selected={activeTab === 'bill-print'}
                onClick={() => setActiveTab('bill-print')}
              >
                BILL PRINT SETTINGS
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'general' ? 'active' : ''}`}
                id="general-tab"
                type="button"
                role="tab"
                aria-controls="general"
                aria-selected={activeTab === 'general'}
                onClick={() => setActiveTab('general')}
              >
                GENERAL SETTINGS
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'online-orders' ? 'active' : ''}`}
                id="online-orders-tab"
                type="button"
                role="tab"
                aria-controls="online-orders"
                aria-selected={activeTab === 'online-orders'}
                onClick={() => setActiveTab('online-orders')}
              >
                ONLINE ORDERS SETTINGS
              </button>
            </li>
          </ul>
          <div className="d-flex gap-2 align-items-stretch">
            <div className="flex-grow-1">
              <div className="tab-content" id="settingsTabsContent">
                {/* Bill Preview Settings Tab */}
                <div
                  className={`tab-pane fade ${activeTab === 'bill-preview' ? 'show active' : ''}`}
                  id="bill-preview"
                  role="tabpanel"
                  aria-labelledby="bill-preview-tab"
                >
                  <div className="card shadow-lg h-100" style={{ minHeight: '800px' }}>
                    <div className="card-body">
                      <h2 className="card-title h5 fw-bold mb-4">Bill Preview Settings</h2>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label htmlFor="outlet_name" className="form-label">
                            Alternative Name of Outlet
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="outlet_name"
                            placeholder="Enter Outlet Name"
                            style={{ borderColor: '#ccc' }}
                            value={formData.outlet_name}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="email" className="form-label">
                            Email
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="email"
                            placeholder="Enter Email"
                            style={{ borderColor: '#ccc' }}
                            value={formData.email}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="website" className="form-label">
                            Website
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="website"
                            placeholder="Enter Website URL"
                            style={{ borderColor: '#ccc' }}
                            value={formData.website}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="upi_id" className="form-label">
                            UPI ID
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="upi_id"
                            placeholder="Enter UPI ID"
                            style={{ borderColor: '#ccc' }}
                            value={formData.upi_id}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="bill_prefix" className="form-label">
                            Bill Number Prefix
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="bill_prefix"
                            placeholder="Enter Bill Number Prefix"
                            style={{ borderColor: '#ccc' }}
                            value={formData.bill_prefix}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="secondary_bill_prefix" className="form-label">
                            Secondary Bill Number Prefix
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="secondary_bill_prefix"
                            placeholder="Enter Secondary Bill Number Prefix"
                            style={{ borderColor: '#ccc' }}
                            value={formData.secondary_bill_prefix}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-md-12">
                          <div className="row align-items-center">
                            <div className="col-md-6">
                              <label htmlFor="bar_bill_prefix" className="form-label">
                                Bar Bill Number Prefix
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                id="bar_bill_prefix"
                                placeholder="Enter Bar Bill Number Prefix"
                                style={{ borderColor: '#ccc' }}
                                value={formData.bar_bill_prefix}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="col-md-6">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="show_upi_qr"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.show_upi_qr}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="show_upi_qr">
                                  Show UPI QR Code On Bill
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="row align-items-center">
                            <div className="col-md-6">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="enabled_bar_section"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.enabled_bar_section}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="enabled_bar_section">
                                  Enabled Bar Section Billing
                                </label>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <label htmlFor="show_phone_on_bill" className="form-label">
                                Show Phone On Bill
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                id="show_phone_on_bill"
                                placeholder="Enter Phone Number"
                                style={{ borderColor: '#ccc' }}
                                value={formData.show_phone_on_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="row">
                            <div className="col-md-6">
                              <label htmlFor="note" className="form-label text-center">
                                Note
                              </label>
                              <textarea
                                className="form-control"
                                id="note"
                                rows={3}
                                placeholder="Enter Note"
                                style={{ borderColor: '#ccc' }}
                                value={formData.note}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="col-md-6">
                              <label htmlFor="footer_note" className="form-label text-center">
                                Footer Note
                              </label>
                              <textarea
                                className="form-control"
                                id="footer_note"
                                rows={3}
                                placeholder="Enter Footer Note"
                                style={{ borderColor: '#ccc' }}
                                value={formData.footer_note}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="field1" className="form-label">
                            Field 1 (GST/VAT)
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="field1"
                            placeholder="Enter GST/VAT"
                            style={{ borderColor: '#ccc' }}
                            value={formData.field1}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="field2" className="form-label">
                            Field 2
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="field2"
                            placeholder="Enter Field 2"
                            style={{ borderColor: '#ccc' }}
                            value={formData.field2}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="field3" className="form-label">
                            Field 3
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="field3"
                            placeholder="Enter Field 3"
                            style={{ borderColor: '#ccc' }}
                            value={formData.field3}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="field4" className="form-label">
                            Field 4
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="field4"
                            placeholder="Enter Field 4"
                            style={{ borderColor: '#ccc' }}
                            value={formData.field4}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-md-12">
                          <label htmlFor="fssai_no" className="form-label">
                            FSSAI No
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="fssai_no"
                            placeholder="Enter FSSAI License Number"
                            style={{ borderColor: '#ccc' }}
                            value={formData.fssai_no}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div
                        className="d-flex justify-content-end gap-3 mt-4"
                        style={{ padding: '10px' }}
                      >
                        <Button className="btn btn-danger" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button className="btn btn-success" onClick={handleUpdate}>
                          Update
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* KOT Print Settings Tab */}
                <div
                  className={`tab-pane fade ${activeTab === 'kot-print' ? 'show active' : ''}`}
                  id="kot-print"
                  role="tabpanel"
                  aria-labelledby="kot-print-tab"
                >
                  <div className="card shadow-sm h-100">
                    <div className="card-body">
                      <h2 className="card-title h5 fw-bold mb-4">KOT Print Settings</h2>
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <div className="d-flex align-items-center mb-3">
                            <span className="me-2">#</span>
                            <input
                              style={{ borderColor: '#ccc' }}
                              type="text"
                              className="form-control w-50"
                              placeholder="Search"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <h6 className="fw-bold mb-3">Status</h6>
                          </div>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">1. Customer on KOT</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  style={{ borderColor: '#ccc' }}
                                  className="form-check-input"
                                  type="checkbox"
                                  id="customer_on_kot_dine_in"
                                  checked={formData.customer_on_kot_dine_in}
                                  onChange={handleInputChange}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="customer_on_kot_dine_in"
                                >
                                  Dine In
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  style={{ borderColor: '#ccc' }}
                                  className="form-check-input"
                                  type="checkbox"
                                  id="customer_on_kot_pickup"
                                  checked={formData.customer_on_kot_pickup}
                                  onChange={handleInputChange}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="customer_on_kot_pickup"
                                >
                                  Pickup
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  style={{ borderColor: '#ccc' }}
                                  className="form-check-input"
                                  type="checkbox"
                                  id="customer_on_kot_delivery"
                                  checked={formData.customer_on_kot_delivery}
                                  onChange={handleInputChange}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="customer_on_kot_delivery"
                                >
                                  Delivery
                                </label>
                              </div>
                            </div>
                            <div className="mb-3">
                              <div className="form-check">
                                <input
                                  style={{ borderColor: '#ccc' }}
                                  className="form-check-input"
                                  type="checkbox"
                                  id="customer_on_kot_quick_bill"
                                  checked={formData.customer_on_kot_quick_bill}
                                  onChange={handleInputChange}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="customer_on_kot_quick_bill"
                                >
                                  Quick Bill
                                </label>
                              </div>
                            </div>
                            <select
                              style={{ borderColor: '#ccc' }}
                              className="form-select"
                              id="customer_kot_display_option"
                              value={formData.customer_kot_display_option}
                              onChange={handleInputChange}
                            >
                              <option value="NAME_ONLY">Name Only</option>
                              <option value="NAME_AND_MOBILE">Name and Mobile Number</option>
                              <option value="DISABLED">Disabled</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">2. Group KOT Items by Category on KOT</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="group_kot_items_by_category"
                                checked={formData.group_kot_items_by_category}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">3. Hide Table Name on KOT (Quick Bill)</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="hide_table_name_quick_bill"
                                checked={formData.hide_table_name_quick_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">4. KOT Tag</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="mb-3">
                              <div className="form-check form-switch">
                                <input
                                  style={{ borderColor: '#ccc' }}
                                  className="form-check-input"
                                  type="checkbox"
                                  id="show_new_order_tag"
                                  checked={formData.show_new_order_tag}
                                  onChange={handleInputChange}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="show_new_order_tag"
                                >
                                  Show New Order Tag
                                </label>
                              </div>
                            </div>
                            <div className="mb-3">
                              <input
                                style={{ borderColor: '#ccc' }}
                                type="text"
                                className="form-control"
                                id="new_order_tag_label"
                                placeholder="New Order Tag Label"
                                value={formData.new_order_tag_label}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="mb-3">
                              <div className="form-check form-switch">
                                <input
                                  style={{ borderColor: '#ccc' }}
                                  className="form-check-input"
                                  type="checkbox"
                                  id="show_running_order_tag"
                                  checked={formData.show_running_order_tag}
                                  onChange={handleInputChange}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="show_running_order_tag"
                                >
                                  Show Running Order Tag
                                </label>
                              </div>
                            </div>
                            <div className="mb-3">
                              <input
                                style={{ borderColor: '#ccc' }}
                                type="text"
                                className="form-control"
                                id="running_order_tag_label"
                                placeholder="Running Order Tag Label"
                                value={formData.running_order_tag_label}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">5. KOT Title</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="mb-3">
                              <input
                                style={{ borderColor: '#ccc' }}
                                type="text"
                                className="form-control"
                                id="dine_in_kot_no"
                                placeholder="Dine In KOT No"
                                value={formData.dine_in_kot_no}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="mb-3">
                              <input
                                style={{ borderColor: '#ccc' }}
                                type="text"
                                className="form-control"
                                id="pickup_kot_no"
                                placeholder="Pickup KOT No"
                                value={formData.pickup_kot_no}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="mb-3">
                              <input
                                style={{ borderColor: '#ccc' }}
                                type="text"
                                className="form-control"
                                id="delivery_kot_no"
                                placeholder="Delivery KOT No"
                                value={formData.delivery_kot_no}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="mb-3">
                              <input
                                style={{ borderColor: '#ccc' }}
                                type="text"
                                className="form-control"
                                id="quick_bill_kot_no"
                                placeholder="Quick Bill"
                                value={formData.quick_bill_kot_no}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">6. Modifier default Option on KOT Print</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                style={{ borderColor: '#ccc' }}
                                className="form-check-input"
                                type="checkbox"
                                id="modifier_default_option"
                                checked={formData.modifier_default_option}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">
                            7. Print KOT In Both Languages (English and Arabic)
                          </h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                style={{ borderColor: '#ccc' }}
                                className="form-check-input"
                                type="checkbox"
                                id="print_kot_both_languages"
                                checked={formData.print_kot_both_languages}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">8. Show Alternative Item On KOT Print</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                style={{ borderColor: '#ccc' }}
                                className="form-check-input"
                                type="checkbox"
                                id="show_alternative_item"
                                checked={formData.show_alternative_item}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">9. Show Captain Username on KOT</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                style={{ borderColor: '#ccc' }}
                                className="form-check-input"
                                type="checkbox"
                                id="show_captain_username"
                                checked={formData.show_captain_username}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">10. Show Covers As Guest On KOT</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                style={{ borderColor: '#ccc' }}
                                className="form-check-input"
                                type="checkbox"
                                id="show_covers_as_guest"
                                checked={formData.show_covers_as_guest}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">11. Show Item Price on KOT</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                style={{ borderColor: '#ccc' }}
                                className="form-check-input"
                                type="checkbox"
                                id="show_item_price"
                                checked={formData.show_item_price}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">12. Show KOT No on Quick Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                style={{ borderColor: '#ccc' }}
                                className="form-check-input"
                                type="checkbox"
                                id="show_kot_no_quick_bill"
                                checked={formData.show_kot_no_quick_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">13. Show KOT Note</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                style={{ borderColor: '#ccc' }}
                                className="form-check-input"
                                type="checkbox"
                                id="show_kot_note"
                                checked={formData.show_kot_note}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">14. Show Online Order OTP on KOT</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                style={{ borderColor: '#ccc' }}
                                className="form-check-input"
                                type="checkbox"
                                id="show_online_order_otp"
                                checked={formData.show_online_order_otp}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">15. Show Order ID On KOT</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  style={{ borderColor: '#ccc' }}
                                  className="form-check-input"
                                  type="checkbox"
                                  id="show_order_id_quick_bill"
                                  checked={formData.show_order_id_quick_bill}
                                  onChange={handleInputChange}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="show_order_id_quick_bill"
                                >
                                  Quick Bill
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  style={{ borderColor: '#ccc' }}
                                  className="form-check-input"
                                  type="checkbox"
                                  id="show_order_id_online_order"
                                  checked={formData.show_order_id_online_order}
                                  onChange={handleInputChange}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="show_order_id_online_order"
                                >
                                  Online Order
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">16. Show Order No on Quick Bill Section KOT</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                style={{ borderColor: '#ccc' }}
                                className="form-check-input"
                                type="checkbox"
                                id="show_order_no_quick_bill_section"
                                checked={formData.show_order_no_quick_bill_section}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">17. Show Order Type Symbol on KOT</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                style={{ borderColor: '#ccc' }}
                                className="form-check-input"
                                type="checkbox"
                                id="show_order_type_symbol"
                                checked={formData.show_order_type_symbol}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">18. Show Store Name On KOT</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                style={{ borderColor: '#ccc' }}
                                className="form-check-input"
                                type="checkbox"
                                id="show_store_name"
                                checked={formData.show_store_name}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">19. Show Terminal Username on KOT</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                style={{ borderColor: '#ccc' }}
                                className="form-check-input"
                                type="checkbox"
                                id="show_terminal_username"
                                checked={formData.show_terminal_username}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">20. Show Username on KOT</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                style={{ borderColor: '#ccc' }}
                                className="form-check-input"
                                type="checkbox"
                                id="show_username"
                                checked={formData.show_username}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">21. Show Waiter On KOT</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                style={{ borderColor: '#ccc' }}
                                className="form-check-input"
                                type="checkbox"
                                id="show_waiter"
                                checked={formData.show_waiter}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        className="d-flex justify-content-end gap-3 mt-4"
                        style={{ padding: '10px' }}
                      >
                        <Button className="btn btn-danger" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button className="btn btn-success" onClick={handleUpdate}>
                          Update
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>



                {/* Bill Print Settings Tab */}
                <div
                  className={`tab-pane fade ${activeTab === 'bill-print' ? 'show active' : ''}`}
                  id="bill-print"
                  role="tabpanel"
                  aria-labelledby="bill-print-tab"
                >
                  <div className="card shadow-sm h-100">
                    <div className="card-body">
                      <h2 className="card-title h5 fw-bold mb-4">Bill Print Settings</h2>
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <div className="d-flex align-items-center mb-3">
                            <span className="me-2">#</span>
                            <input
                              type="text"
                              className="form-control w-50"
                              placeholder="Search"
                              style={{ borderColor: '#ccc' }}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <h6 className="fw-bold mb-3">Status</h6>
                          </div>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">1. Bill Title</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="bill_title_dine_in"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.bill_title_dine_in}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="bill_title_dine_in">
                                  Dine In
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="bill_title_pickup"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.bill_title_pickup}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="bill_title_pickup">
                                  Pickup
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="bill_title_delivery"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.bill_title_delivery}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="bill_title_delivery">
                                  Delivery
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="bill_title_quick_bill"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.bill_title_quick_bill}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="bill_title_quick_bill">
                                  Quick Bill
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">2. Mask Order ID</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="mask_order_id"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.mask_order_id}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">3. Modifier default option on Bill print</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="modifier_default_option_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.modifier_default_option_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">4. Print Bill In Both Language (English, Arabic)</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="print_bill_both_languages"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.print_bill_both_languages}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">5. Show Alternative Item Title On Bill Print</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_alt_item_title_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_alt_item_title_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">6. Show alternative name on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_alt_name_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_alt_name_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">7. Show Bill Amount in Words</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_bill_amount_words"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_bill_amount_words}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">8. Show Bill No on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_bill_no_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_bill_no_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">9. Show Bill Number With Prefix On Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_bill_number_prefix_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_bill_number_prefix_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">10. Show Bill Print Count</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_bill_print_count"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_bill_print_count}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">11. Show Brand Name on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_brand_name_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_brand_name_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">12. Show Captain On Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_captain_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_captain_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">13. Show Covers on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_covers_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_covers_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">14. Show Custom QR Codes on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_custom_qr_codes_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_custom_qr_codes_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">15. Show Customer GST on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_customer_gst_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_customer_gst_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">16. Show Customer on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_customer_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_customer_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">17. Show Customer Paid Amount</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_customer_paid_amount"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_customer_paid_amount}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">18. Show Date on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_date_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_date_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">19. Show Default Payment</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_default_payment"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_default_payment}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">20. Show Discount Reason on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_discount_reason_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_discount_reason_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">21. Show Due Amount on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_due_amount_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_due_amount_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">22. Show E-Bill Invoice Link QRcode</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_ebill_invoice_qrcode"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_ebill_invoice_qrcode}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">23. Show Item HSN Code on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_item_hsn_code_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_item_hsn_code_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">24. Show Item Level Charges Separately</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_item_level_charges_separately"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_item_level_charges_separately}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">25. Show Item Note on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_item_note_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_item_note_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">26. Show Items Sequence on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_items_sequence_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_items_sequence_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">27. Show KOT Number on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_kot_number_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_kot_number_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">28. Show Logo on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_logo_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_logo_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">29. Show Order ID on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_order_id_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_order_id_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">30. Show Order No on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_order_no_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_order_no_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">31. Show order note on the bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_order_note_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_order_note_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">32. Show Order Type on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="order_type_dine_in"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.order_type_dine_in}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="order_type_dine_in">
                                  Dine In
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="order_type_pickup"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.order_type_pickup}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="order_type_pickup">
                                  Pickup
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="order_type_delivery"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.order_type_delivery}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="order_type_delivery">
                                  Delivery
                                </label>
                              </div>
                            </div>
                            <div className="mb-3">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="order_type_quick_bill"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.order_type_quick_bill}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="order_type_quick_bill">
                                  Quick Bill
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">33. Show outlet name on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_outlet_name_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_outlet_name_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">34. Show Payment Mode on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="payment_mode_dine_in"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.payment_mode_dine_in}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="payment_mode_dine_in">
                                  Dine In
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="payment_mode_pickup"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.payment_mode_pickup}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="payment_mode_pickup">
                                  Pickup
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="payment_mode_delivery"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.payment_mode_delivery}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="payment_mode_delivery">
                                  Delivery
                                </label>
                              </div>
                            </div>
                            <div className="mb-3">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="payment_mode_quick_bill"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.payment_mode_quick_bill}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="payment_mode_quick_bill">
                                  Quick Bill
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">35. Show Table Name on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="table_name_dine_in"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.table_name_dine_in}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="table_name_dine_in">
                                  Dine In
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="table_name_pickup"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.table_name_pickup}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="table_name_pickup">
                                  Pickup
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="table_name_delivery"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.table_name_delivery}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="table_name_delivery">
                                  Delivery
                                </label>
                              </div>
                            </div>
                            <div className="mb-3">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="table_name_quick_bill"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.table_name_quick_bill}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="table_name_quick_bill">
                                  Quick Bill
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">36. Show Tax on Charge on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_tax_charge_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_tax_charge_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">37. Show Username on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_username_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_username_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">38. Show Waiter on Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_waiter_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_waiter_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">39. Show ZATCA E-Invoice QR</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_zatca_invoice_qr"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_zatca_invoice_qr}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">40. Show customer address on pickup bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_customer_address_pickup_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_customer_address_pickup_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">41. Show Order Placed Time</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_order_placed_time"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_order_placed_time}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">42. Bill Print Item Details Columns</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="hide_item_quantity_column"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.hide_item_quantity_column}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="hide_item_quantity_column">
                                  Hide Item Quantity Column
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="hide_item_rate_column"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.hide_item_rate_column}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="hide_item_rate_column">
                                  Hide Item Rate Column
                                </label>
                              </div>
                            </div>
                            <div className="mb-3">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="hide_item_total_column"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.hide_item_total_column}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="hide_item_total_column">
                                  Hide Item Total Column
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">43. Hide Total Without Tax</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="hide_total_without_tax"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.hide_total_without_tax}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex justify-content-end gap-3 mt-4" style={{ padding: '10px' }}>
                        <Button variant="danger" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button variant="success" onClick={handleUpdate}>
                          Update
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>





                {/* General Settings Tab */}
                <div
                  className={`tab-pane fade ${activeTab === 'general' ? 'show active' : ''}`}
                  id="general"
                  role="tabpanel"
                  aria-labelledby="general-tab"
                >
                  <div className="card shadow-sm h-100">
                    <div className="card-body">
                      <h2 className="card-title h5 fw-bold mb-4">General Settings</h2>

                      {/* Header: Search Bar and Status */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <div className="d-flex align-items-center mb-3">
                            <span className="me-2">#</span>
                            <input
                              type="text"
                              className="form-control w-50"
                              placeholder="Search"
                              style={{ borderColor: '#ccc' }}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <h6 className="fw-bold mb-3">Status</h6>
                          </div>
                        </div>
                      </div>

                      {/* Row 1: Add Customize URL Link For Atlantic POS */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">1. Add Customize URL Link For Atlantic POS</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <table className="table table-bordered mb-3">
                              <thead>
                                <tr style={{ borderColor: '#ccc' }}>
                                  <th scope="col">Title</th>
                                  <th scope="col">URL</th>
                                  <th scope="col">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr style={{ borderColor: '#ccc' }}>
                                  <td colSpan={3} className="text-center">No Data Found</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 2: Allow Charges Apply After Bill Print */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">2. Allow Charges Apply After Bill Print</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="allow_charges_after_bill_print"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.allow_charges_after_bill_print}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 3: Allow Discount Apply After Bill Print */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">3. Allow Discount Apply After Bill Print</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="allow_discount_after_bill_print"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.allow_discount_after_bill_print}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 4: Allow Discount Apply Before Save */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">4. Allow Discount Apply Before Save</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="allow_discount_before_save"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.allow_discount_before_save}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 5: Allow Pre-Order in TA/HD */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">5. Allow Pre-Order in TA/HD</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="allow_pre_order_tahd"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.allow_pre_order_tahd}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 6: Ask for Covers */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">6. Ask for Covers</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="ask_covers_dine_in"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.ask_covers.dine_in}
                                  onChange={(e) => handleNestedChange(e, 'ask_covers', 'dine_in')}
                                />
                                <label className="form-check-label" htmlFor="ask_covers_dine_in">
                                  Dine In
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="ask_covers_pickup"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.ask_covers.pickup}
                                  onChange={(e) => handleNestedChange(e, 'ask_covers', 'pickup')}
                                />
                                <label className="form-check-label" htmlFor="ask_covers_pickup">
                                  Pickup
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="ask_covers_delivery"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.ask_covers.delivery}
                                  onChange={(e) => handleNestedChange(e, 'ask_covers', 'delivery')}
                                />
                                <label className="form-check-label" htmlFor="ask_covers_delivery">
                                  Delivery
                                </label>
                              </div>
                            </div>
                            <div className="mb-3">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="ask_covers_quick_bill"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.ask_covers.quick_bill}
                                  onChange={(e) => handleNestedChange(e, 'ask_covers', 'quick_bill')}
                                />
                                <label className="form-check-label" htmlFor="ask_covers_quick_bill">
                                  Quick Bill
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 7: Ask for Covers in Captain */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">7. Ask for Covers in Captain</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="ask_covers_captain"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.ask_covers_captain}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 8: Ask for Custom Order ID (Quick Bill) */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">8. Ask for Custom Order ID (Quick Bill)</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="ask_custom_order_id_quick_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.ask_custom_order_id_quick_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 9: Ask for Custom Order Type (Quick Bill) */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">9. Ask for Custom Order Type (Quick Bill)</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="ask_custom_order_type_quick_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.ask_custom_order_type_quick_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 10: Ask for Payment Mode On Save Bill */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">10. Ask for Payment Mode On Save Bill</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="ask_payment_mode_on_save_bill"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.ask_payment_mode_on_save_bill}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 11: Ask for Waiter */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">11. Ask for Waiter</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="ask_waiter_dine_in"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.ask_waiter.dine_in}
                                  onChange={(e) => handleNestedChange(e, 'ask_waiter', 'dine_in')}
                                />
                                <label className="form-check-label" htmlFor="ask_waiter_dine_in">
                                  Dine In
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="ask_waiter_pickup"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.ask_waiter.pickup}
                                  onChange={(e) => handleNestedChange(e, 'ask_waiter', 'pickup')}
                                />
                                <label className="form-check-label" htmlFor="ask_waiter_pickup">
                                  Pickup
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="ask_waiter_delivery"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.ask_waiter.delivery}
                                  onChange={(e) => handleNestedChange(e, 'ask_waiter', 'delivery')}
                                />
                                <label className="form-check-label" htmlFor="ask_waiter_delivery">
                                  Delivery
                                </label>
                              </div>
                            </div>
                            <div className="mb-3">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="ask_waiter_quick_bill"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.ask_waiter.quick_bill}
                                  onChange={(e) => handleNestedChange(e, 'ask_waiter', 'quick_bill')}
                                />
                                <label className="form-check-label" htmlFor="ask_waiter_quick_bill">
                                  Quick Bill
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 12: Ask OTP to change order status from order window */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">12. Ask OTP to change order status from order window</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="ask_otp_change_order_status_order_window"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.ask_otp_change_order_status_order_window}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 13: Ask OTP to change order status from receipt section */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">13. Ask OTP to change order status from receipt section</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="ask_otp_change_order_status_receipt_section"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.ask_otp_change_order_status_receipt_section}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 14: Auto Accept Remote KOT */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">14. Auto Accept Remote KOT</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="auto_accept_remote_kot"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.auto_accept_remote_kot}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 15: Auto Out-of-Stock */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">15. Auto Out-of-Stock</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="auto_out_of_stock"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.auto_out_of_stock}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 16: Auto Sync */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">16. Auto Sync</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="auto_sync"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.auto_sync}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 17: Category Time For POS */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">17. Category Time For POS</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <input
                              type="text"
                              className="form-control"
                              id="category_time_for_pos"
                              placeholder="Enter time"
                              style={{ borderColor: '#ccc' }}
                              value={formData.category_time_for_pos}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 18: Count Sales after Midnight in Previous Day */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">18. Count Sales after Midnight in Previous Day</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="count_sales_after_midnight"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.count_sales_after_midnight}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 19: Customer Display */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">19. Customer Display</h6>
                          <p>Customer Display</p>
                          <p>Order Prompt</p>
                          <p>Order prompt</p>
                          <p>Media Fit With Bill View</p>
                          <p>Media Fit Without Bill View</p>
                          <p>File Upload Guidelines: Video (.mp4, max 50MB), Image (any format, max 5MB)</p>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <table className="table table-bordered mb-3">
                              <thead>
                                <tr style={{ borderColor: '#ccc' }}>
                                  <th scope="col">Image</th>
                                  <th scope="col">Rank</th>
                                  <th scope="col">Name</th>
                                  <th scope="col">Media</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr style={{ borderColor: '#ccc' }}>
                                  <td colSpan={4} className="text-center">No Data</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 20: Customer Mandatory */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">20. Customer Mandatory</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="customer_mandatory_dine_in"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.customer_mandatory.dine_in}
                                  onChange={(e) => handleNestedChange(e, 'customer_mandatory', 'dine_in')}
                                />
                                <label className="form-check-label" htmlFor="customer_mandatory_dine_in">
                                  Dine In
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="customer_mandatory_pickup"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.customer_mandatory.pickup}
                                  onChange={(e) => handleNestedChange(e, 'customer_mandatory', 'pickup')}
                                />
                                <label className="form-check-label" htmlFor="customer_mandatory_pickup">
                                  Pickup
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="customer_mandatory_delivery"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.customer_mandatory.delivery}
                                  onChange={(e) => handleNestedChange(e, 'customer_mandatory', 'delivery')}
                                />
                                <label className="form-check-label" htmlFor="customer_mandatory_delivery">
                                  Delivery
                                </label>
                              </div>
                            </div>
                            <div className="mb-3">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="customer_mandatory_quick_bill"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.customer_mandatory.quick_bill}
                                  onChange={(e) => handleNestedChange(e, 'customer_mandatory', 'quick_bill')}
                                />
                                <label className="form-check-label" htmlFor="customer_mandatory_quick_bill">
                                  Quick Bill
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 21: Default E-Bill Check */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">21. Default E-Bill Check</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="default_ebill_check"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.default_ebill_check}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 22: Default Send Delivery Boy to Customer Check */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">22. Default Send Delivery Boy to Customer Check</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="default_send_delivery_boy_check"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.default_send_delivery_boy_check}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 23: Edit Customize Order Number */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">23. Edit Customize Order Number</h6>
                          <p>Order No</p>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <input
                              type="text"
                              className="form-control"
                              id="edit_customize_order_number"
                              placeholder="Enter order number"
                              style={{ borderColor: '#ccc' }}
                              value={formData.edit_customize_order_number}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 24: Enable Backup Notification Service */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">24. Enable Backup Notification Service</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="enable_backup_notification_service"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.enable_backup_notification_service}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 25: Enable Customer Display Access */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">25. Enable Customer Display Access</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="enable_customer_display_access"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.enable_customer_display_access}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 26: Filter items by order type */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">26. Filter items by order type</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="filter_items_by_order_type"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.filter_items_by_order_type}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 27: Generate all reports based on the start and close dates */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">27. Generate all reports based on the start and close dates</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="generate_reports_start_close_dates"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.generate_reports_start_close_dates}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 28: Hide Clear Data Check on Logout */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">28. Hide Clear Data Check on Logout</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="hide_clear_data_check_logout"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.hide_clear_data_check_logout}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 29: Hide Item Price for Options */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">29. Hide Item Price for Options</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="hide_item_price_options"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.hide_item_price_options}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 30: Hide Load Menu Button */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">30. Hide Load Menu Button</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="hide_load_menu_button"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.hide_load_menu_button}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 31: Make Cancel & Delete Item Reason Compulsory */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">31. Make Cancel & Delete Item Reason Compulsory</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="make_cancel_delete_reason_compulsory"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.make_cancel_delete_reason_compulsory}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 32: Make Discount Reason Mandatory */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">32. Make Discount Reason Mandatory</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="make_discount_reason_mandatory"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.make_discount_reason_mandatory}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 33: Make Free Bill / Cancel Bill Reason Mandatory */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">33. Make Free Bill / Cancel Bill Reason Mandatory</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="make_free_cancel_bill_reason_mandatory"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.make_free_cancel_bill_reason_mandatory}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 34: Make Payment Reference Number Mandatory */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">34. Make Payment Reference Number Mandatory</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="make_payment_ref_number_mandatory"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.make_payment_ref_number_mandatory}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 35: Mandatory Delivery Boy Selection for Delivery Orders */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">35. Mandatory Delivery Boy Selection for Delivery Orders (Digital/Offline)</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="mandatory_delivery_boy_selection"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.mandatory_delivery_boy_selection}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 36: Mark Order As Transfer Order */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">36. Mark Order As Transfer Order</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="mark_order_as_transfer_order"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.mark_order_as_transfer_order}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 37: Online Payment Auto Settle */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">37. Online Payment Auto Settle</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="online_payment_auto_settle"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.online_payment_auto_settle}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 38: Order Sync Settings */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">38. Order Sync Settings</h6>
                          <p>Auto-Sync Settings for Real-Time Cloud Updates</p>
                          <p>Available intervals for syncing order data to the cloud</p>
                          <p>Sets the number of orders to be synced in a single batch</p>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="mb-3">
                              <label className="form-label">Sync Interval</label>
                              <select
                                className="form-select"
                                id="order_sync_settings_auto_sync_interval"
                                style={{ borderColor: '#ccc' }}
                                value={formData.order_sync_settings.auto_sync_interval}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    order_sync_settings: {
                                      ...prev.order_sync_settings,
                                      auto_sync_interval: e.target.value,
                                    },
                                  }))
                                }
                              >
                                <option value="5">5 Minutes (Default)</option>
                                <option value="10">10 Minutes</option>
                                <option value="15">15 Minutes</option>
                              </select>
                            </div>
                            <div className="mb-3">
                              <label className="form-label">Sync Batch Packet Size</label>
                              <input
                                type="number"
                                className="form-control"
                                id="order_sync_settings_sync_batch_packet_size"
                                style={{ borderColor: '#ccc' }}
                                value={formData.order_sync_settings.sync_batch_packet_size}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    order_sync_settings: {
                                      ...prev.order_sync_settings,
                                      sync_batch_packet_size: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="10 (Default)"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 39: Separate Billing by Section */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">39. Separate Billing by Section</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="separate_billing_by_section"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.separate_billing_by_section}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 40: Set entered amount while closing day as a opening amount of next day */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">40. Set entered amount while closing day as a opening amount of next day</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="set_entered_amount_as_opening"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.set_entered_amount_as_opening}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 41: Show Alternative Item On Report Print */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">41. Show Alternative Item On Report Print</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_alternative_item_report_print"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_alternative_item_report_print}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 42: Show Clear Sales Report on Logout */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">42. Show Clear Sales Report on Logout</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_clear_sales_report_logout"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_clear_sales_report_logout}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 43: Show Order No (Label) on Pos */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">43. Show Order No (Label) on Pos</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_order_no_label_pos"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_order_no_label_pos}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 44: Show Payment History Button */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">44. Show Payment History Button</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_payment_history_button"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_payment_history_button}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 45: Show Remote KOT Option in KOT */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">45. Show Remote KOT Option in KOT</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_remote_kot_option"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_remote_kot_option}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 46: Show Send Payment Link */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">46. Show Send Payment Link</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_send_payment_link"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_send_payment_link}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 47: Stock Availability Display */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">47. Stock Availability Display</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="stock_availability_display"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.stock_availability_display}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 48: Todays Report */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">48. Todays Report</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="todays_report_sales_summary"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.todays_report.sales_summary}
                                  onChange={(e) => handleNestedChange(e, 'todays_report', 'sales_summary')}
                                />
                                <label className="form-check-label" htmlFor="todays_report_sales_summary">
                                  Sales Summary / Z Report Summary
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="todays_report_order_type_summary"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.todays_report.order_type_summary}
                                  onChange={(e) => handleNestedChange(e, 'todays_report', 'order_type_summary')}
                                />
                                <label className="form-check-label" htmlFor="todays_report_order_type_summary">
                                  Order Type Summary
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="todays_report_payment_type_summary"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.todays_report.payment_type_summary}
                                  onChange={(e) => handleNestedChange(e, 'todays_report', 'payment_type_summary')}
                                />
                                <label className="form-check-label" htmlFor="todays_report_payment_type_summary">
                                  Payment Type Summary
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="todays_report_discount_summary"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.todays_report.discount_summary}
                                  onChange={(e) => handleNestedChange(e, 'todays_report', 'discount_summary')}
                                />
                                <label className="form-check-label" htmlFor="todays_report_discount_summary">
                                  Discount Summary
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="todays_report_expense_summary"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.todays_report.expense_summary}
                                  onChange={(e) => handleNestedChange(e, 'todays_report', 'expense_summary')}
                                />
                                <label className="form-check-label" htmlFor="todays_report_expense_summary">
                                  Expense Summary
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="todays_report_bill_summary"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.todays_report.bill_summary}
                                  onChange={(e) => handleNestedChange(e, 'todays_report', 'bill_summary')}
                                />
                                <label className="form-check-label" htmlFor="todays_report_bill_summary">
                                  Bill Summary
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="todays_report_delivery_boy_summary"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.todays_report.delivery_boy_summary}
                                  onChange={(e) => handleNestedChange(e, 'todays_report', 'delivery_boy_summary')}
                                />
                                <label className="form-check-label" htmlFor="todays_report_delivery_boy_summary">
                                  Delivery Boy Summary
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="todays_report_waiter_summary"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.todays_report.waiter_summary}
                                  onChange={(e) => handleNestedChange(e, 'todays_report', 'waiter_summary')}
                                />
                                <label className="form-check-label" htmlFor="todays_report_waiter_summary">
                                  Waiter Summary
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="todays_report_kitchen_department_summary"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.todays_report.kitchen_department_summary}
                                  onChange={(e) => handleNestedChange(e, 'todays_report', 'kitchen_department_summary')}
                                />
                                <label className="form-check-label" htmlFor="todays_report_kitchen_department_summary">
                                  Kitchen Department Summary
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="todays_report_category_summary"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.todays_report.category_summary}
                                  onChange={(e) => handleNestedChange(e, 'todays_report', 'category_summary')}
                                />
                                <label className="form-check-label" htmlFor="todays_report_category_summary">
                                  Category Summary
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="todays_report_sold_items_summary"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.todays_report.sold_items_summary}
                                  onChange={(e) => handleNestedChange(e, 'todays_report', 'sold_items_summary')}
                                />
                                <label className="form-check-label" htmlFor="todays_report_sold_items_summary">
                                  Sold Items Summary
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="todays_report_cancel_items_summary"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.todays_report.cancel_items_summary}
                                  onChange={(e) => handleNestedChange(e, 'todays_report', 'cancel_items_summary')}
                                />
                                <label className="form-check-label" htmlFor="todays_report_cancel_items_summary">
                                  Cancel Items Summary
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="todays_report_wallet_summary"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.todays_report.wallet_summary}
                                  onChange={(e) => handleNestedChange(e, 'todays_report', 'wallet_summary')}
                                />
                                <label className="form-check-label" htmlFor="todays_report_wallet_summary">
                                  Wallet Summary
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="todays_report_due_payment_received_summary"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.todays_report.due_payment_received_summary}
                                  onChange={(e) => handleNestedChange(e, 'todays_report', 'due_payment_received_summary')}
                                />
                                <label className="form-check-label" htmlFor="todays_report_due_payment_received_summary">
                                  Due Payment Received Summary
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="todays_report_due_payment_receivable_summary"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.todays_report.due_payment_receivable_summary}
                                  onChange={(e) => handleNestedChange(e, 'todays_report', 'due_payment_receivable_summary')}
                                />
                                <label className="form-check-label" htmlFor="todays_report_due_payment_receivable_summary">
                                  Due Payment Receivable Summary
                                </label>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="todays_report_payment_variance_summary"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.todays_report.payment_variance_summary}
                                  onChange={(e) => handleNestedChange(e, 'todays_report', 'payment_variance_summary')}
                                />
                                <label className="form-check-label" htmlFor="todays_report_payment_variance_summary">
                                  Payment Variance Summary
                                </label>
                              </div>
                            </div>
                            <div className="mb-3">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="todays_report_currency_denominations_summary"
                                  style={{ borderColor: '#ccc' }}
                                  checked={formData.todays_report.currency_denominations_summary}
                                  onChange={(e) => handleNestedChange(e, 'todays_report', 'currency_denominations_summary')}
                                />
                                <label className="form-check-label" htmlFor="todays_report_currency_denominations_summary">
                                  Currency Denominations Summary
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 49: UPI Payment Sound Notification On Desktop POS */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">49. UPI Payment Sound Notification On Desktop POS</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="upi_payment_sound_notification"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.upi_payment_sound_notification}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 50: Use Separate Bill Numbers for Online Orders */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">50. Use Separate Bill Numbers for Online Orders</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="use_separate_bill_numbers_online"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.use_separate_bill_numbers_online}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 51: When do you want to send todays report */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">51. When do you want to send todays report</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <select
                              className="form-select"
                              id="when_send_todays_report"
                              style={{ borderColor: '#ccc' }}
                              value={formData.when_send_todays_report}
                              onChange={handleInputChange}
                            >
                              <option value="">Select an option</option>
                              <option value="receiptSection">Print Todays Report From Receipt Section</option>
                              <option value="reportSection">Print Todays Report From Report Section</option>
                              <option value="closeDay">Print Report When We Close The Day</option>
                              <option value="closeDayReportSection">Print Close Day Report From Report Section</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 52: Enable Currency Conversion */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">52. Enable Currency Conversion</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="enable_currency_conversion"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.enable_currency_conversion}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 53: Enable user login validation */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">53. Enable user login validation</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="enable_user_login_validation"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.enable_user_login_validation}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 54: Allow Closing Shift Despite Saved or Printed Bills */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">54. Allow Closing Shift Despite Saved or Printed Bills</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="allow_closing_shift_despite_bills"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.allow_closing_shift_despite_bills}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 55: Show Real-Time KOT/Bill Notifications/Updates */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">55. Show Real-Time KOT/Bill Notifications/Updates from CSK App & Terminal POS on Master POS</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_real_time_kot_bill_notifications"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_real_time_kot_bill_notifications}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex justify-content-end gap-3 mt-4" style={{ padding: '10px' }}>
                        <Button variant="danger" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button variant="success" onClick={handleUpdate}>
                          Update
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Online Orders Settings Tab */}
                <div
                  className={`tab-pane fade ${activeTab === 'online-orders' ? 'show active' : ''}`}
                  id="online-orders"
                  role="tabpanel"
                  aria-labelledby="online-orders-tab"
                >
                  <div className="card shadow-sm h-100">
                    <div className="card-body">
                      <h2 className="card-title h5 fw-bold mb-4">Online Orders Settings</h2>

                      {/* Header: Search Bar and Status */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <div className="d-flex align-items-center mb-3">
                            <span className="me-2">#</span>
                            <input
                              type="text"
                              className="form-control w-50"
                              placeholder="Search"
                              style={{ borderColor: '#ccc' }}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <h6 className="fw-bold mb-3">Status</h6>
                          </div>
                        </div>
                      </div>

                      {/* Row 1: After accepting an online order, it should be shown as In Preparation on the KDS */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">1. After accepting an online order, it should be shown as In Preparation on the KDS</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="show_in_preparation_kds"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.show_in_preparation_kds}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 2: Auto Accept online order */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">2. Auto Accept online order</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="auto_accept_online_order"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.auto_accept_online_order}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 3: Customize Order Preparation Time */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">3. Customize Order Preparation Time</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="customize_order_preparation_time"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.customize_order_preparation_time}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 4: Online Orders Time Delay */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">4. Online Orders Time Delay</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3 d-flex align-items-center">
                            <Button
                              variant="outline-secondary"
                              className="me-2"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  online_orders_time_delay: String(Math.max(0, parseInt(prev.online_orders_time_delay || '0') - 1)),
                                }))
                              }
                            >
                              -
                            </Button>
                            <span className="mx-2">{formData.online_orders_time_delay}</span>
                            <Button
                              variant="outline-secondary"
                              className="ms-2"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  online_orders_time_delay: String(parseInt(prev.online_orders_time_delay || '0') + 1),
                                }))
                              }
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 5: Pull Order on Accept (Online Orders) */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">5. Pull Order on Accept (Online Orders)</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="pull_order_on_accept"
                                style={{ borderColor: '#ccc' }}
                                checked={formData.pull_order_on_accept}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 6: Show Addons Separately */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">6. Show Addons Separately</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input style={{ borderColor: '#ccc' }}
                                className="form-check-input"
                                type="checkbox"
                                id="showAddonsSeparately"
                                defaultChecked
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 7: Show complete online order id */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">7. Show complete online order id</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="showCompleteOnlineOrderId"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 8: Show Online Order Preparation Time */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">8. Show Online Order Preparation Time</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input style={{ borderColor: '#ccc' }}
                                className="form-check-input"
                                type="checkbox"
                                id="showOnlineOrderPreparationTime"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-2" style={{ borderColor: '#ccc' }} />

                      {/* Row 9: Update the food-ready status of an online order when the ready status changes from the KDS */}
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-3">9. Update the food-ready status of an online order when the ready status changes from the KDS</h6>
                        </div>
                        <div className="col-md-6">
                          <div className="ms-3">
                            <div className="form-check form-switch">
                              <input style={{ borderColor: '#ccc' }}
                                className="form-check-input"
                                type="checkbox"
                                id="updateFoodReadyStatusKDS"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      className="d-flex justify-content-end gap-3 mt-4"
                      style={{ padding: '10px' }}
                    >
                      <button className="btn btn-danger" onClick={handleCancel}>
                        Cancel
                      </button>
                      <button className="btn btn-success" onClick={handleUpdate}>
                        Update
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bill Preview Section (Right Side) */}
            {activeTab === 'bill-preview' && (
              <div className="w-50 mx-auto">
                <div className="card shadow-sm h-100"  >
                  <div className="card-body">
                    <h2 className="card-title h5 fw-bold mb-4 text-center">
                      Bill Preview
                    </h2>
                    <div className="text-center mb-3">
                      <p className="fw-bold">{formData.outlet_name || '!!!Hotel Miracle!!!'}</p>
                      <p>Kolhapur Road Kolhapur 416416</p>
                      {formData.show_phone_on_bill && <p>{formData.show_phone_on_bill}</p>}
                      {formData.email && <p>{formData.email}</p>}
                      {formData.website && <p>{formData.website}</p>}
                    </div>
                    <div className="text-center mb-3" style={{ fontSize: '0.9rem' }}>
                      <p className="mb-0">Note: {formData.note || 'Order ID: 1234567890'}</p>
                      <p className="mb-0">26/05/2025 @ 9:10 PM</p>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <p>Pay Mode: Cash</p>
                      <p>User: TMPOS</p>
                    </div>
                    <table className="table table-bordered mb-3">
                      <thead>
                        <tr>
                          <th scope="col">Item Name</th>
                          <th scope="col" className="text-end">
                            Quantity
                          </th>
                          <th scope="col" className="text-end">
                            Price
                          </th>
                          <th scope="col" className="text-end">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>1. Biryani</td>
                          <td className="text-end">1</td>
                          <td className="text-end">100.00</td>
                          <td className="text-end">100.00</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="text-end">
                      <p>Total Value: Rs. 100.00</p>
                      <p className="mt-2">GST:</p>
                      {formData.field1 && <p>{formData.field1}</p>}
                      {formData.field2 && <p>{formData.field2}</p>}
                      {formData.field3 && <p>{formData.field3}</p>}
                      {formData.field4 && <p>{formData.field4}</p>}
                      <p className="mt-2">Total Tax (excl.): Rs. 5.00</p>
                      <p className="mt-2 fw-bold">Grand Total: Rs. 105.00</p>
                      {formData.footer_note && (
                        <p className="mt-2 text-center">{formData.footer_note}</p>
                      )}
                      {formData.fssai_no && (
                        <p className="mt-2 text-center">FSSAI No: {formData.fssai_no}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>


            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AddOutlet;