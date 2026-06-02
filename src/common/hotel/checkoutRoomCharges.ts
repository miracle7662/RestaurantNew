// checkoutRoomCharges.ts
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface CheckoutRoomCharge {
  charge_id: number;
  checkin_id: number;
  checkout_id: number;
  guest_id: number;
  room_id: number;
  category_id: number | null;
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
  checkin_datetime: string | null;
  checkout_datetime: string | null;
  created_at: string;
  updated_at: string;
}

const CheckoutRoomChargesService = {
  list: (params?: { checkout_id?: number; checkin_id?: number; guest_id?: number; room_id?: number }): Promise<ApiResponse<CheckoutRoomCharge[]>> =>
    HttpClient.get<ApiResponse<CheckoutRoomCharge[]>>('/checkout-room-charges', { params }),

  get: (id: number): Promise<ApiResponse<CheckoutRoomCharge>> =>
    HttpClient.get<ApiResponse<CheckoutRoomCharge>>(`/checkout-room-charges/${id}`),

  getByCheckoutId: (checkoutId: number): Promise<ApiResponse<CheckoutRoomCharge[]>> =>
    HttpClient.get<ApiResponse<CheckoutRoomCharge[]>>(`/checkout-room-charges/by-checkout/${checkoutId}`),

  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/checkout-room-charges/${id}`)
};

export default CheckoutRoomChargesService;