// guestRoomCharges.ts - Updated with delete and update methods
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface GuestRoomCharge {
  guest_room_charges_id: number;
  guest_id: number;
  room_id: number;
  category_id: number | null;
  checkin_id?: number | null;
  pax_count: number | null;
  pax_price: number | null;
  pax_tax: number | null;
  ex_pax_count: number | null;
  ex_pax_price: number | null;
  ex_pax_tax: number | null;
  ex_pax_tax_percent: number | null;
  ex_pax_total: number | null;
  child_count: number | null;
  child_price: number | null;
  child_tax: number | null;
  child_tax_percent: number | null;
  child_total: number | null;
  driver_count: number | null;
  driver_price: number | null;
  driver_tax: number | null;
  driver_tax_percent: number | null;
  driver_total: number | null;
  total_amount: number | null;
  checkin_datetime?: string | null;
  checkout_datetime?: string | null;
  created_at: string;
  updated_at: string;
  // Additional fields for display
  room_no?: string;
  room_number?: string;
  room_category_name?: string;
  converted_category_name?: string;
  department_name?: string;
  particulars?: string;
  discount_percent?: number;
  payment_method?: string;
}

export interface GuestRoomChargePayload {
  guest_id: number;
  room_id: number;
  category_id?: number | null;
  checkin_id?: number | null;
  pax_count?: number | null;
  pax_price?: number | null;
  pax_tax?: number | null;
  ex_pax_count?: number | null;
  ex_pax_price?: number | null;
  ex_pax_tax?: number | null;
  ex_pax_tax_percent?: number | null;
  ex_pax_total?: number | null;
  child_count?: number | null;
  child_price?: number | null;
  child_tax?: number | null;
  child_tax_percent?: number | null;
  child_total?: number | null;
  driver_count?: number | null;
  driver_price?: number | null;
  driver_tax?: number | null;
  driver_tax_percent?: number | null;
  driver_total?: number | null;
  total_amount?: number | null;
  checkin_datetime?: string | null;
  checkout_datetime?: string | null;
  // Additional fields for display
  room_no?: string;
  room_number?: string;
  room_category_name?: string;
  converted_category_name?: string;
  department_name?: string;
  department_id?: number;
  particulars?: string;
  discount_percent?: number;
  payment_method?: string;
}

export interface BulkChargePayload {
  charges: GuestRoomChargePayload[];
}

const GuestRoomChargesService = {
  list: (params?: { guest_id?: number; room_id?: number; checkin_id?: number; hotelid?: number }): Promise<ApiResponse<GuestRoomCharge[]>> =>
    HttpClient.get<ApiResponse<GuestRoomCharge[]>>('/guest-room-charges', { params }),

  get: (id: number): Promise<ApiResponse<GuestRoomCharge>> =>
    HttpClient.get<ApiResponse<GuestRoomCharge>>(`/guest-room-charges/${id}`),

  create: (payload: GuestRoomChargePayload): Promise<ApiResponse<GuestRoomCharge>> =>
    HttpClient.post<ApiResponse<GuestRoomCharge>>('/guest-room-charges', payload),

  createBulk: (payload: BulkChargePayload): Promise<ApiResponse<GuestRoomCharge[]>> =>
    HttpClient.post<ApiResponse<GuestRoomCharge[]>>('/guest-room-charges/bulk', payload),

  update: (id: number, payload: GuestRoomChargePayload): Promise<ApiResponse<GuestRoomCharge>> =>
    HttpClient.put<ApiResponse<GuestRoomCharge>>(`/guest-room-charges/${id}`, payload),

  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/guest-room-charges/${id}`),
};

export default GuestRoomChargesService;