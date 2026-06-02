// guestFolio.ts
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface GuestFolio {
  folio_id: number;
  checkin_id: number;
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

export interface GuestFolioPayload {
  checkin_id?: number;
  hotelid?: number;
  detail_id?: number | null;
  transaction_type?: string;
  transaction_datetime?: string;
  description?: string;
  debit_amount?: number;
  credit_amount?: number;
  reference_number?: string;
  payment_method?: string;
}

export interface BulkFolioPayload {
  folios: GuestFolioPayload[];
}

const GuestFolioService = {
  list: (params?: { checkin_id?: number; hotelid?: number }): Promise<ApiResponse<GuestFolio[]>> =>
    HttpClient.get<ApiResponse<GuestFolio[]>>('/guest-folios', { params }),

  get: (id: number): Promise<ApiResponse<GuestFolio>> =>
    HttpClient.get<ApiResponse<GuestFolio>>(`/guest-folios/${id}`),

  create: (payload: GuestFolioPayload): Promise<ApiResponse<GuestFolio>> =>
    HttpClient.post<ApiResponse<GuestFolio>>('/guest-folios', payload),

  createBulk: (payload: BulkFolioPayload): Promise<ApiResponse<GuestFolio[]>> =>
    HttpClient.post<ApiResponse<GuestFolio[]>>('/guest-folios/bulk', payload),

  update: (id: number, payload: GuestFolioPayload): Promise<ApiResponse<GuestFolio>> =>
    HttpClient.put<ApiResponse<GuestFolio>>(`/guest-folios/${id}`, payload),

  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/guest-folios/${id}`)
};

export default GuestFolioService;