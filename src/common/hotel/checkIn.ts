// checkIn.ts - Updated with extension methods

import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface CheckIn {
  checkin_id: number;
  guest_id: number;
  guest_name: string;
  address: string;
  mobile: string;
  company_name: string;
  emailed: string;
  booking: string;
  plan_name?: string;
  reg_no?: string;
  special_instruction?: string;
  message?: string;
  checkin_datetime: string;
  checkout_datetime: string;
  room_no: string;
  category_id: number;
  converted_category: string;
  adults: number;
  pax: number;
  pax_charges: number;
  ex_pax: number;
  ex_pax_charge: number;
  child_paid: number;
  child_unpaid: number;
  child_charge: number;
  driver: number;
  driver_charge: number;
  hotelid: number;
  id_type: string;
  id_number: string;
  department_id: number;
  department_name: string;
  created_by_id: number;
  created_date: string;
  updated_by_id: number;
  updated_date: string;
  status: string;
  total_nights?: number;
  total_amount?: number;
  outletid?: number;
}

export interface TodayCheckout {
  checkin_id: number;
  guest_name: string;
  reg_no: string;
  room_no: string;
  booking: string;
  plan_name: string;
  adults: number;
  pax: number;
  ex_pax: number;
  child_paid: number;
  child_unpaid: number;
  child_count: number;
  driver: number;
  checkin_datetime: string;
  checkout_datetime: string;
  total_nights: number;
  total_amount: number;
  folio_total: number;
  status: string;
  converted_category: string;
  room_category: string;
}

export interface CheckInPayload {
  guest_id?: number;
  guest_name?: string;
  address?: string;
  mobile?: string;
  company_name?: string;
  emailed?: string;
  booking?: string;
  plan_name?: string;
  reg_no?: string;
  special_instruction?: string;
  message?: string;
  checkin_datetime?: string;
  checkout_datetime?: string;
  room_no?: string;
  category_id?: number;
  converted_category?: string;
  adults?: number;
  pax?: number;
  pax_charges?: number;
  ex_pax?: number;
  ex_pax_charge?: number;
  child_paid?: number;
  child_unpaid?: number;
  child_charge?: number;
  driver?: number | string;
  driver_charge?: number;
  hotelid?: number;
  id_type?: string;
  id_number?: string;
  department_id?: number;
  department_name?: string;
  status?: string;
  created_by_id?: number;
  room_ids?: number[];
  total_nights?: number;
  total_amount?: number;
}

export interface ExtendStayPayload {
  additionalDays: number;
  newCheckoutDatetime: string;
  additionalAmount: number;
  newTotalNights?: number;
  newTotalAmount?: number;
  roomId?: number;      // NEW: For room-specific extension
  detailId?: number;    // NEW: Detail ID to mark as checked out
  extensionDetails?: any[]; // NEW: Extension details array
}

export interface UpdatePartialPayload {
  total_amount?: number;
  checkout_datetime?: string;
  total_nights?: number;
  status?: string;
  [key: string]: any;
}

export interface DetailResponse {
  detail_id: number;
  checkin_id: number;
  room_id: number;
  room_number: string;
  room_tariff: number;
  no_of_days: number;
  is_checkout: number;
  checkout_datetime: string;
  checkin_datetime: string;
  [key: string]: any;
}

const CheckInService = {
 // In src/common/hotel/checkIn.ts
list(params?: { hotelid?: number; status?: string; q?: string }) {
  return HttpClient.get<ApiResponse<CheckIn[]>>("/checkins", { params });
},

  get: (id: number): Promise<ApiResponse<CheckIn>> =>
    HttpClient.get<ApiResponse<CheckIn>>(`/checkins/${id}`),

  getNextRegNumber: (params?: { hotelid?: number }): Promise<ApiResponse<{ reg_no: string }>> =>
    HttpClient.get<ApiResponse<{ reg_no: string }>>('/checkins/next-reg-number', { params }),

  getDetailsByCheckinId: (checkinId: number): Promise<ApiResponse<DetailResponse[]>> =>
    HttpClient.get<ApiResponse<DetailResponse[]>>(`/checkins/details/${checkinId}`),

  getTodayCheckouts: (params?: { hotelid?: number }): Promise<ApiResponse<TodayCheckout[]>> =>
    HttpClient.get<ApiResponse<TodayCheckout[]>>('/checkins/today-checkouts', { params }),

  create: (payload: CheckInPayload): Promise<ApiResponse<CheckIn>> =>
    HttpClient.post<ApiResponse<CheckIn>>('/checkins', payload),

  update: (id: number, payload: CheckInPayload): Promise<ApiResponse<CheckIn>> =>
    HttpClient.put<ApiResponse<CheckIn>>(`/checkins/${id}`, payload),

  // Partial update - for updating checkout_datetime, total_amount, total_nights
  updatePartial: (id: number, payload: UpdatePartialPayload): Promise<ApiResponse<CheckIn>> =>
    HttpClient.patch<ApiResponse<CheckIn>>(`/checkins/${id}/partial`, payload),

  // Extend stay - updates checkout_datetime in CheckIn_Master
  extendStay: (id: number, payload: ExtendStayPayload): Promise<ApiResponse<CheckIn>> =>
    HttpClient.post<ApiResponse<CheckIn>>(`/checkins/${id}/extend`, payload),

  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/checkins/${id}`)
};

export default CheckInService;