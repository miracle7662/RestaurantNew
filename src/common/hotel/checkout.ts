// checkout.ts - Updated with selected_rooms for partial/multiple checkout
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface CheckoutMaster {
  checkout_id: number;
  checkin_id: number;
  guest_id: number;
  reg_no: string;
  ldg_bill_no: string;             
  guest_name: string;
  address: string;
  mobile: string;
  company_name: string;
  emailed: string;
  booking: string;
  plan_name: string;
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
  special_instruction: string;
  message: string;
  payment_id: string;
  payment_mode: string;
  is_settle: number;
  is_print: number;
  discount_amount: number;
  post_changes_amt: number;
  allowances_amt: number;
  advance_amt: number;
  cgst_amt: number;
  sgst_amt: number;
  igst_amt: number;
  cess_amt: number;
  service_charge_amt: number;
  net_payable: number;
  round_off_amount: number;
  
  // AUDIT FIELDS
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
  checkin_id: number
  checkout_reason?: string
  payment_method?: string

  total_amount?: number
  round_off_amount?: number
  net_payable?: number

  selected_rooms?: string[] // Array of room numbers to checkout (for partial checkout)

  // Billing breakdown fields (used by backend Checkout_Master)
  discount?: number
  discount_percent?: number
  service_charge?: number
  taxable_amt?: number

  sgst_amt?: number
  cgst_amt?: number
  round_off?: number
  bill_amt?: number
  other_charges?: number
  bill_plus_other?: number
  received_amt?: number
  credit_transfer?: number
  sett_disc?: number
  balance_amt?: number

  total_amt?: number
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