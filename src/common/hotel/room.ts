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
  guest_id: number;           // ✅ RETAINED
  guest_name: string;          // ✅ RETAINED
  mobile: string;              // ✅ RETAINED
  address: string;             // ✅ RETAINED
  company_name: string;        // ✅ RETAINED
  emailed: string;             // ✅ RETAINED (ab email bhi hai)
  booking: string;             // ✅ RETAINED
  plan_name: string;           // ✅ RETAINED
  reg_no: string;              // ✅ RETAINED
  checkin_datetime: string;    // ✅ RETAINED
  checkout_datetime: string;   // ✅ RETAINED
  hotelid: number;             // ✅ RETAINED
  room_id: number;             // ✅ RETAINED
  checkout_id: number | null;  // ✅ RETAINED

  // Checkin Detail (ALL original fields + new)
  detail_id: number | null;           // ✅ RETAINED
  detail_room_id: number | null;      // ✅ RETAINED (ab room_id bhi hai)
  room_number: string | null;         // ✅ RETAINED
  room_category_name: string | null;  // ✅ RETAINED
  converted_category_name: string | null; // ✅ RETAINED
  room_tariff: number | null;         // ✅ RETAINED
  discount_percent: number | null;    // ✅ RETAINED
  discount_amount: number | null;     // ✅ NEW (stored procedure se)
  cgst_percent: number | null;        // ✅ RETAINED
  sgst_percent: number | null;        // ✅ RETAINED
  igst_percent: number | null;        // ✅ RETAINED
  is_settle: number | null;           // ✅ RETAINED
  detail_checkin_datetime?: string;   // ✅ RETAINED
  detail_checkout_datetime?: string;  // ✅ RETAINED
  detail_adults?: number;             // ✅ RETAINED (ab adults bhi hai)
  detail_pax?: number;                // ✅ RETAINED (ab pax bhi hai)
  detail_ex_pax?: number;             // ✅ RETAINED (ab ex_pax bhi hai)
  detail_child_unpaid?: number;       // ✅ RETAINED (ab child_unpaid bhi hai)
  detail_driver?: number;             // ✅ RETAINED (ab driver bhi hai)
  detail_ex_pax_charge?: number;      // ✅ RETAINED (ab ex_pax_charge bhi hai)
  detail_child_paid_amount?: number;  // ✅ RETAINED (ab child_paid_amount bhi hai)
  detail_driver_charge?: number;      // ✅ RETAINED (ab driver_charge bhi hai)
  detail_cess_percent?: number;       // ✅ RETAINED (ab cess_percent bhi hai)
  detail_service_charge?: number;     // ✅ RETAINED (ab service_charge bhi hai)
  parent_detail_id?: number;          // ✅ RETAINED

  // Guest fields (ALL original + new)
  email?: string;                     // ✅ NEW (stored procedure se)
  // company_name, guest_name already above

  // Guest Folio (ALL original fields + new)
  folio_id: number | null;            // ✅ RETAINED
  transaction_type: string | null;    // ✅ RETAINED
  payment_method: string | null;      // ✅ RETAINED
  debit_amount: number | null;        // ✅ RETAINED
  credit_amount: number | null;       // ✅ RETAINED
  reference_number: string | null;    // ✅ RETAINED
  description: string | null;         // ✅ RETAINED
  charge_description: string | null;  // ✅ RETAINED
  transaction_datetime: string | null; // ✅ RETAINED

  // Guest Room Charges (ALL original + new)
  guest_room_charges_id: number | null;  // ✅ RETAINED
  charge_room_id?: number | null;        // ✅ RETAINED
  category_id?: number | null;           // ✅ RETAINED
  pax_count: number | null;              // ✅ RETAINED
  pax_price: number | null;              // ✅ RETAINED
  pax_tax: number | null;                // ✅ RETAINED
  ex_pax_count: number | null;           // ✅ RETAINED
  ex_pax_price: number | null;           // ✅ RETAINED
  ex_pax_tax: number | null;             // ✅ RETAINED
  ex_pax_tax_percent?: number | null;    // ✅ RETAINED
  ex_pax_total?: number | null;          // ✅ RETAINED
  child_count: number | null;            // ✅ RETAINED
  child_price: number | null;            // ✅ RETAINED
  child_tax: number | null;              // ✅ RETAINED
  child_tax_percent?: number | null;     // ✅ RETAINED
  child_total?: number | null;           // ✅ RETAINED
  driver_count: number | null;           // ✅ RETAINED
  driver_price: number | null;           // ✅ RETAINED
  driver_tax: number | null;             // ✅ RETAINED
  driver_tax_percent?: number | null;    // ✅ RETAINED
  driver_total?: number | null;          // ✅ RETAINED
  total_amount: number | null;           // ✅ RETAINED
  charge_checkin_datetime: string | null; // ✅ RETAINED
  charge_checkout_datetime: string | null; // ✅ RETAINED
  charge_created_at?: string | null;     // ✅ RETAINED
  charge_updated_at?: string | null;     // ✅ RETAINED
  department_name?: string | null;       // ✅ RETAINED
  particulars?: string | null;           // ✅ RETAINED

  // ✅ NEW: Source type to identify record origin
  source_type?: 'ROOM_CHARGE' | 'FOLIO_ENTRY';
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

  getCheckinFullDetails(hotelid: string | number, checkin_id: string | number) {
    return HttpClient.get<ApiResponse<CheckinFullDetailsRow[]>>("/rooms/checkin-full-details", {
      params: { hotelid, checkin_id },
    });
  },
};

export default RoomService;