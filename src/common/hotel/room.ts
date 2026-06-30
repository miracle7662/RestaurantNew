// services/room.ts

import HttpClient from "../helpers/httpClient";
import { ApiResponse } from "@/types/api";

export interface Room {
  room_id: number;
  room_no: string;
  room_name: string;
  display_name?: string;

  room_category_id: number;
  category_name?: string;
  print_name?: string;
  category_display_name?: string;

  floor_id?: number;
  floor_name?: string;
  floor_number?: number;

  room_status?: number;
  status_name?: string;
  status_color?: string;

  hotelid: number;
  created_date?: string;
  updated_date?: string;
}

export interface ApiRoom {
  room_id: number;
  room_no: string;
  room_name: string;
  display_name?: string;
  room_category_id: number;
  room_status: string;
  room_status_id?: number;
  status_color?: string;
  status_name?: string;
  floor_id: number;
  block_id?: number;
  hotelid: number;
  created_by_id?: number;
  updated_by_id?: number;
  created_date?: string;
  updated_date?: string;
}

export interface RoomPayload {
  room_no: string;
  room_name: string;
  display_name?: string;
  room_category_id: number;
  room_ext_no?: string;
  room_status_id?: number;
  room_status?: string;
  department_id?: number;
  block_id?: number;
  floor_id?: number;
  hotelid?: number;
  created_by_id?: number;
  updated_by_id?: number;
}

// ✅ ALL FIELDS RETAINED + NEW FIELDS ADDED
export interface CheckinFullDetailsRow {
  // Checkin Master (ALL original fields + new)
  checkin_id: number;
  guest_id: number;
  guest_name: string;
  mobile: string;
  address: string;
  company_name: string;
  emailed: string;
  booking: string;
  plan_name: string;
  reg_no: string;
  checkin_datetime: string;
  checkout_datetime: string;
  hotelid: number;
  room_id: number;
  checkout_id: number | null;

  // Checkin Detail (ALL original fields + new)
  detail_id: number | null;
  detail_room_id: number | null;
  room_number: string | null;
  room_category_name: string | null;
  converted_category_name: string | null;
  room_tariff: number | null;
  discount_percent: number | null;
  discount_amount: number | null;
  cgst_percent: number | null;
  sgst_percent: number | null;
  igst_percent: number | null;
  is_settle: number | null;
  detail_checkin_datetime?: string;
  detail_checkout_datetime?: string;
  detail_adults?: number;
  detail_pax?: number;
  detail_ex_pax?: number;
  detail_child_unpaid?: number;
  detail_driver?: number;
  detail_ex_pax_charge?: number;
  detail_child_paid_amount?: number;
  detail_driver_charge?: number;
  detail_cess_percent?: number;
  detail_service_charge?: number;
  parent_detail_id?: number;

  // Guest fields
  email?: string;

  // Guest Folio
  folio_id: number | null;
  transaction_type: string | null;
  payment_method: string | null;
  debit_amount: number | null;
  credit_amount: number | null;
  reference_number: string | null;
  description: string | null;
  charge_description: string | null;
  transaction_datetime: string | null;

  // Guest Room Charges
  guest_room_charges_id: number | null;
  charge_room_id?: number | null;
  category_id?: number | null;
  pax_count: number | null;
  pax_price: number | null;
  pax_tax: number | null;
  ex_pax_count: number | null;
  ex_pax_price: number | null;
  ex_pax_tax: number | null;
  ex_pax_tax_percent?: number | null;
  ex_pax_total?: number | null;
  child_count: number | null;
  child_price: number | null;
  child_tax: number | null;
  child_tax_percent?: number | null;
  child_total?: number | null;
  driver_count: number | null;
  driver_price: number | null;
  driver_tax: number | null;
  driver_tax_percent?: number | null;
  driver_total?: number | null;
  total_amount: number | null;
  charge_checkin_datetime: string | null;
  charge_checkout_datetime: string | null;
  charge_created_at?: string | null;
  charge_updated_at?: string | null;
  department_name?: string | null;
  particulars?: string | null;

  source_type?: 'ROOM_CHARGE' | 'FOLIO_ENTRY';
}

// ✅ NEW: Summary interface from stored procedure's second result set
export interface CheckinFullDetailsSummaryRow {
  checkin_id: number;
  guest_id: number;
  guest_name: string;
  room_numbers_str: string;
  room_categories_str: string;
  converted_categories_str: string;
  total_room_tariff: number;
  total_ex_pax_charge: number;
  total_child_paid_amount: number;
  total_driver_charge: number;
  total_tax_amount: number;
  total_amount: number;
  total_days: number;
  total_adults: number;
  total_pax: number;
  total_ex_pax: number;
  total_child_paid: number;
  total_child_unpaid: number;
  total_driver: number;
  avg_discount_percent: number;
  avg_tax_percent: number;
  has_extensions: number;
  extension_count: number;
  extension_days: number;
  payment_method: string;
  original_checkin_datetime: string;
  final_checkout_datetime: string;
  guest_mobile: string;
  guest_address: string;
  guest_email: string;
  reg_no: string;
  booking_ref: string;
  plan_name: string;
}

// ✅ NEW: Response interface that includes both details and summary
export interface CheckinFullDetailsResponse {
  details: CheckinFullDetailsRow[];
  summary: CheckinFullDetailsSummaryRow[];
}

const RoomService = {
  getHotelBookingMeta(hotelid: string | number) {
    return HttpClient.get<
      ApiResponse<{
        floors: any[]
        categories: any[]
        rooms: ApiRoom[]
        statuses: any[]
      }>
    >('/rooms/hotelbooking-meta', { params: { hotelid } })
  },

  list(params?: { hotelid?: number; q?: string }) {
    return HttpClient.get<ApiResponse<any>>("/rooms/hotelbooking-meta", { params }).then(
      (res) => ({
        success: res.success,
        data: res.data?.rooms ?? [],
      }),
    );
  },

  get(roomId: number) {
    return HttpClient.get<ApiResponse<Room>>(`/rooms/${roomId}`);
  },

  create(payload: RoomPayload) {
    return HttpClient.post<ApiResponse<Room>>("/rooms", payload);
  },

  update(roomId: number, payload: RoomPayload) {
    return HttpClient.put<ApiResponse<Room>>(`/rooms/${roomId}`, payload);
  },

  remove(roomId: number) {
    return HttpClient.delete<ApiResponse<null>>(`/rooms/${roomId}`);
  },

  getRooms(hotelid: string | number) {
    return HttpClient.get<ApiResponse<any>>("/rooms/hotelbooking-meta", {
      params: { hotelid },
    }).then((res) => ({
      success: res.success,
      data: {
        rooms: res.data?.rooms ?? [],
        floors: res.data?.floors ?? [],
        categories: res.data?.categories ?? [],
        statuses: res.data?.statuses ?? [],
      }
    }));
  },

  // ✅ UPDATED: Now returns both details and summary
  getCheckinFullDetails(hotelid: string | number, checkin_id: string | number) {
    return HttpClient.get<ApiResponse<CheckinFullDetailsResponse>>("/rooms/checkin-full-details", {
      params: { hotelid, checkin_id },
    });
  },
};

export default RoomService;