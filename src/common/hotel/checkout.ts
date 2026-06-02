// checkout.ts - Updated with selected_rooms for partial/multiple checkout
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface CheckoutMaster {
  checkout_id: number;
  checkin_id: number;
  guest_id: number;
  guest_name: string;
  address: string;
  mobile: string;
  company_name: string;
  emailed: string;
  booking: string;
  plan_name: string;
  reg_no: string;
  special_instruction: string;
  message: string;
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
  driver: string;
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
  total_nights: number;
  total_amount: number;
  checkout_date: string;
  checkout_by_id: number;
  checkout_reason: string;
  is_partial_checkout?: number;
  checked_out_rooms?: string;
}

export interface PerformCheckoutPayload {
  checkin_id: number;
  checkout_reason?: string;
  payment_method?: string;
  total_amount?: number;
  round_off_amount?: number;
  net_payable?: number;
  selected_rooms?: string[];  // Array of room numbers to checkout (for partial checkout)
}

export interface CheckoutResponse {
  checkout_id: number;
  checkin_id: number;
  payment_id?: number;
  is_partial?: boolean;
  checked_out_rooms?: string[];
  remaining_rooms?: string[];
}

const CheckoutService = {
  list: (params?: { hotelid?: number }): Promise<ApiResponse<CheckoutMaster[]>> =>
    HttpClient.get<ApiResponse<CheckoutMaster[]>>('/checkouts', { params }),

  get: (id: number): Promise<ApiResponse<CheckoutMaster>> =>
    HttpClient.get<ApiResponse<CheckoutMaster>>(`/checkouts/${id}`),

  getByCheckinId: (checkinId: number): Promise<ApiResponse<CheckoutMaster>> =>
    HttpClient.get<ApiResponse<CheckoutMaster>>(`/checkouts/by-checkin/${checkinId}`),

  performCheckout: (payload: PerformCheckoutPayload): Promise<ApiResponse<CheckoutResponse>> =>
    HttpClient.post<ApiResponse<CheckoutResponse>>('/checkouts/perform', payload),

  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/checkouts/${id}`)
};

export default CheckoutService;