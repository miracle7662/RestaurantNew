// checkoutPayment.ts - Updated (removed 6 fields)
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface CheckoutPayment {
  payment_id: number;
  checkout_id: number;
  checkin_id: number;
  total_amount: number;
  payment_method: string;
  round_off_amount: number;
  net_payable: number;
  transaction_datetime: string;
  created_by_id: number;
  created_date: string;
}

export interface CheckoutPaymentPayload {
  checkout_id: number;
  checkin_id: number;
  total_amount: number;
  payment_method: string;
  round_off_amount?: number;
  net_payable?: number;
  created_by_id?: number;
}

const CheckoutPaymentService = {
  list: (params?: { checkout_id?: number; checkin_id?: number }): Promise<ApiResponse<CheckoutPayment[]>> =>
    HttpClient.get<ApiResponse<CheckoutPayment[]>>('/checkout-payments', { params }),

  get: (id: number): Promise<ApiResponse<CheckoutPayment>> =>
    HttpClient.get<ApiResponse<CheckoutPayment>>(`/checkout-payments/${id}`),

  getByCheckoutId: (checkoutId: number): Promise<ApiResponse<CheckoutPayment[]>> =>
    HttpClient.get<ApiResponse<CheckoutPayment[]>>(`/checkout-payments/by-checkout/${checkoutId}`),

  create: (payload: CheckoutPaymentPayload): Promise<ApiResponse<CheckoutPayment>> =>
    HttpClient.post<ApiResponse<CheckoutPayment>>('/checkout-payments', payload),

  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/checkout-payments/${id}`)
};

export default CheckoutPaymentService;