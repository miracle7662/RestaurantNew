// common/api/guestHistory.ts
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface GuestHistoryCheckout {
  checkout_id: number;
  checkin_id: number;
  guest_id: number;
  reg_no: string;
  guest_name: string;
  room_no: string;
  checkin_datetime: string;
  checkout_datetime: string;
  pax: number;
  ex_pax: number;
  child_paid: number;
  driver: string;
  total_amount: number;
  status: string;
  hotelid: number;
  checkout_date: string;
  checkout_reason: string;
  is_partial_checkout: number;
  discount_amount: number;
  discount: number;
  child_count: number;
  child : number;
  checked_out_rooms: string;
}

export interface GuestHistoryCheckoutDetail {
  detail_id: number;
  checkout_id: number;
  room_number: string;
  room_category_name: string;
  checkin_datetime: string;
  checkout_datetime: string;
  no_of_days: number;
  room_tariff: number;
  discount_percent: number;
  discount_amount: number;
  cgst_percent: number;
  cgst_amount: number;
  sgst_percent: number;
  sgst_amount: number;
  igst_percent: number;
  igst_amount: number;
  cess_percent: number;
  cess_amount: number;
  tax: number;
  ex_pax: number;
  ex_pax_charge: number;
  child_paid_amount: number;
  driver_charge: number;
  adults: number;
  pax: number;
}

export interface GuestHistoryCheckoutFolio {
  folio_id: number;
  checkout_id: number;
  transaction_type: string;
  transaction_datetime: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  payment_method: string;
}

export interface GuestHistoryCheckoutPayment {
  payment_id: number;
  checkout_id: number;
  total_amount: number;
  payment_method: string;
  round_off_amount: number;
  net_payable: number;
  transaction_datetime: string;
}

export interface GuestHistoryCheckoutRoomCharge {
  charge_id: number;
  checkout_id: number;
  room_id: number;
  pax_count: number;
  pax_price: number;
  ex_pax_count: number;
  ex_pax_total: number;
  child_count: number;
  child_total: number;
  driver_count: number;
  driver_total: number;
  total_amount: number;
}

const GuestHistoryService = {
  // Get guest checkout history
  getGuestHistory: (guestId: number, hotelId: number): Promise<ApiResponse<GuestHistoryCheckout[]>> =>
    HttpClient.get<ApiResponse<GuestHistoryCheckout[]>>(`/guest-history/${guestId}`, { params: { hotelid: hotelId } }),

  // Get full checkout details by checkout_id
  getCheckoutDetails: (checkoutId: number): Promise<ApiResponse<{
    details: GuestHistoryCheckoutDetail[];
    folios: GuestHistoryCheckoutFolio[];
    payment: GuestHistoryCheckoutPayment | null;
    roomCharges: GuestHistoryCheckoutRoomCharge[];
  }>> => HttpClient.get<ApiResponse<any>>(`/guest-history/checkout/${checkoutId}/full`),
};

export default GuestHistoryService;