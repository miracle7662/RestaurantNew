import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface BookedByContact {
  booked_by_id: number;
  name: string;
  mobile1: string | null;
  mobile2: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  country_id: number | null;
  state_id: number | null;
  city_id: number | null;
}

export interface BookedByContactPayload {
  name?: string;
  mobile1?: string | null;
  mobile2?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  country_id?: number | null;
  state_id?: number | null;
  city_id?: number | null;
}

const BookedByContactService = {
  list: (): Promise<ApiResponse<BookedByContact[]>> =>
    HttpClient.get<ApiResponse<BookedByContact[]>>('/booked-by-contacts'),

  get: (id: number): Promise<ApiResponse<BookedByContact>> =>
    HttpClient.get<ApiResponse<BookedByContact>>(`/booked-by-contacts/${id}`),

  create: (payload: BookedByContactPayload): Promise<ApiResponse<BookedByContact>> =>
    HttpClient.post<ApiResponse<BookedByContact>>('/booked-by-contacts', payload),

  update: (id: number, payload: BookedByContactPayload): Promise<ApiResponse<BookedByContact>> =>
    HttpClient.put<ApiResponse<BookedByContact>>(`/booked-by-contacts/${id}`, payload),

  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/booked-by-contacts/${id}`)
};

export default BookedByContactService;