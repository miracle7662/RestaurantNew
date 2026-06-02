import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface GuestType {
  guest_type_id: number;
  guest_type_name: string;
  description?: string | null;
  status: number;
  created_date: string;
  updated_date: string;
}

export interface GuestTypePayload {
  guest_type_name: string;
  description?: string | null;
  status?: number;
}

const GuestTypeService = {
  list: (params?: { hotelid?: number }): Promise<ApiResponse<GuestType[]>> =>
    HttpClient.get<ApiResponse<GuestType[]>>('/guest-types', { params }),

  get: (id: number): Promise<ApiResponse<GuestType>> =>
    HttpClient.get<ApiResponse<GuestType>>(`/guest-types/${id}`),

  create: (payload: GuestTypePayload): Promise<ApiResponse<GuestType>> =>
    HttpClient.post<ApiResponse<GuestType>>('/guest-types', payload),

  update: (id: number, payload: GuestTypePayload): Promise<ApiResponse<GuestType>> =>
    HttpClient.put<ApiResponse<GuestType>>(`/guest-types/${id}`, payload),

  delete: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/guest-types/${id}`),
};

export default GuestTypeService;

