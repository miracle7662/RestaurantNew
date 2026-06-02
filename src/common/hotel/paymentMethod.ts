import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface PaymentMethod {
  id: number;
  payment_method_name: string;
  status: number;
  created_date?: string;
  updated_date?: string;
}

export interface PaymentMethodPayload {
  payment_method_name: string;
  status?: number;
}

const PaymentMethodService = {
  list: (params?: { status?: number }): Promise<ApiResponse<PaymentMethod[]>> =>
    HttpClient.get<ApiResponse<PaymentMethod[]>>('/payment-methods', { params }),

  get: (id: number): Promise<ApiResponse<PaymentMethod>> =>
    HttpClient.get<ApiResponse<PaymentMethod>>(`/payment-methods/${id}`),

  create: (payload: PaymentMethodPayload): Promise<ApiResponse<PaymentMethod>> =>
    HttpClient.post<ApiResponse<PaymentMethod>>('/payment-methods', payload),

  update: (id: number, payload: PaymentMethodPayload): Promise<ApiResponse<PaymentMethod>> =>
    HttpClient.put<ApiResponse<PaymentMethod>>(`/payment-methods/${id}`, payload),

  delete: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/payment-methods/${id}`)
};

export default PaymentMethodService;