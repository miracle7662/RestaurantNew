// checkoutFolio.ts
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface CheckoutFolio {
  folio_id: number;
  checkin_id: number;
  checkout_id: number;
  hotelid: number;
  detail_id: number;
  transaction_type: string;
  transaction_datetime: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  reference_number: string;
  payment_method: string;
  created_by_id: number;
  created_date: string;
  updated_by_id: number;
  updated_date: string;
}

const CheckoutFolioService = {
  list: (params?: { checkout_id?: number; checkin_id?: number; hotelid?: number }): Promise<ApiResponse<CheckoutFolio[]>> =>
    HttpClient.get<ApiResponse<CheckoutFolio[]>>('/checkout-folios', { params }),

  get: (id: number): Promise<ApiResponse<CheckoutFolio>> =>
    HttpClient.get<ApiResponse<CheckoutFolio>>(`/checkout-folios/${id}`),

  getByCheckoutId: (checkoutId: number): Promise<ApiResponse<CheckoutFolio[]>> =>
    HttpClient.get<ApiResponse<CheckoutFolio[]>>(`/checkout-folios/by-checkout/${checkoutId}`),

  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/checkout-folios/${id}`)
};

export default CheckoutFolioService;