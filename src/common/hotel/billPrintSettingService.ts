// services/billPrintSettingService.ts
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface BillPrintSetting {
    setting_id: number;
    hotelid: number;
    
    // Top Header Section
    show_top_header_section: number; // 0=Hide, 1=Show entire top header section
    top_margin_when_header_hidden: number; // Top margin in mm when header is hidden (for pre-printed paper)
    
    // Header Settings
    show_hotel_logo: number;
    hotel_logo_position: 'left' | 'center' | 'right';
    show_hotel_name: number;
    hotel_name_position: 'left' | 'center' | 'right';
    show_hotel_address: number;
    hotel_address_position: 'left' | 'center' | 'right';
    show_hotel_contact: number;
    hotel_contact_position: 'left' | 'center' | 'right';
    
    // Guest Details Section
    show_guest_details: number;
    guest_details_position: 'left' | 'right' | 'top' | 'bottom';
    show_guest_name: number;
    show_guest_mobile: number;
    show_guest_email: number;
    show_guest_address: number;
    show_guest_id_proof: number;
    
    // Booking Details Section
    show_booking_details: number;
    booking_details_position: 'left' | 'right' | 'top' | 'bottom';
    show_checkin_date: number;
    show_checkout_date: number;
    show_nights: number;
    show_room_type: number;
    show_room_numbers: number;
    show_guests_count: number;
    show_tariff_plan: number;
    
    // Bill Information Section
    show_bill_title: number;
    bill_title_position: 'left' | 'center' | 'right';
    show_invoice_no: number;
    show_invoice_date: number;
    show_booking_id: number;
    show_payment_status: number;
    show_payment_mode: number;
    
    // Charges Table Settings
    table_font_size: 'small' | 'normal' | 'large';
    table_header_bg_color: string;
    table_header_text_color: string;
    show_row_numbers: number;
    show_discount_column: number;
    show_cgst_sgst_breakdown: number;
    
    // Footer Settings
    show_thankyou_message: number;
    thankyou_message_text: string;
    show_footer_note: number;
    footer_note_text: string;
    show_gst_details: number;
    show_company_pan: number;
    show_fssai: number;
    
    // Print Settings
    default_print_size: 'A4' | 'thermal_80mm' | 'thermal_58mm' | 'full';
    paper_width_mm: number;
    paper_height_mm: number;
    margin_top_mm: number;
    margin_bottom_mm: number;
    margin_left_mm: number;
    margin_right_mm: number;
    
    custom_header_text: string;
    custom_footer_text: string;
    
    created_date?: string;
    updated_date?: string;
}

export interface BillPrintSettingPayload {
    hotelid: number;
    show_top_header_section?: number;
    top_margin_when_header_hidden?: number;
    show_hotel_logo?: number;
    hotel_logo_position?: string;
    show_hotel_name?: number;
    hotel_name_position?: string;
    show_hotel_address?: number;
    hotel_address_position?: string;
    show_hotel_contact?: number;
    hotel_contact_position?: string;
    show_guest_details?: number;
    guest_details_position?: string;
    show_guest_name?: number;
    show_guest_mobile?: number;
    show_guest_email?: number;
    show_guest_address?: number;
    show_guest_id_proof?: number;
    show_booking_details?: number;
    booking_details_position?: string;
    show_checkin_date?: number;
    show_checkout_date?: number;
    show_nights?: number;
    show_room_type?: number;
    show_room_numbers?: number;
    show_guests_count?: number;
    show_tariff_plan?: number;
    show_bill_title?: number;
    bill_title_position?: string;
    show_invoice_no?: number;
    show_invoice_date?: number;
    show_booking_id?: number;
    show_payment_status?: number;
    show_payment_mode?: number;
    table_font_size?: string;
    table_header_bg_color?: string;
    table_header_text_color?: string;
    show_row_numbers?: number;
    show_discount_column?: number;
    show_cgst_sgst_breakdown?: number;
    show_thankyou_message?: number;
    thankyou_message_text?: string;
    show_footer_note?: number;
    footer_note_text?: string;
    show_gst_details?: number;
    show_company_pan?: number;
    show_fssai?: number;
    default_print_size?: string;
    paper_width_mm?: number;
    paper_height_mm?: number;
    margin_top_mm?: number;
    margin_bottom_mm?: number;
    margin_left_mm?: number;
    margin_right_mm?: number;
    custom_header_text?: string;
    custom_footer_text?: string;
    created_by_id?: number;
    updated_by_id?: number;
}

const BillPrintSettingService = {
    getByHotelId: (hotelId: number): Promise<ApiResponse<BillPrintSetting>> =>
        HttpClient.get<ApiResponse<BillPrintSetting>>(`/bill-print-settings/hotel/${hotelId}`),
    
    create: (payload: BillPrintSettingPayload): Promise<ApiResponse<BillPrintSetting>> =>
        HttpClient.post<ApiResponse<BillPrintSetting>>('/bill-print-settings', payload),
    
    update: (id: number, payload: BillPrintSettingPayload): Promise<ApiResponse<BillPrintSetting>> =>
        HttpClient.put<ApiResponse<BillPrintSetting>>(`/bill-print-settings/${id}`, payload),
    
    updateByHotelId: (hotelId: number, payload: BillPrintSettingPayload): Promise<ApiResponse<BillPrintSetting>> =>
        HttpClient.put<ApiResponse<BillPrintSetting>>(`/bill-print-settings/hotel/${hotelId}`, payload),
};

export default BillPrintSettingService;