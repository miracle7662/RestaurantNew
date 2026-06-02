import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface Departure {
  departure_id: number;
  departure_name: string;
  description: string | null;
  status: number;
  created_by_id: number | null;
  created_date: string;
  updated_by_id: number | null;
  updated_date: string;
}

export interface DeparturePayload {
  departure_name: string;
  description?: string | null;
  status?: number;
}

const DepartureService = {
  list: (params?: { status?: number }): Promise<ApiResponse<Departure[]>> =>
    HttpClient.get<ApiResponse<Departure[]>>('/departure', { params }),

  create: (payload: DeparturePayload): Promise<ApiResponse<Departure>> =>
    HttpClient.post<ApiResponse<Departure>>('/departure', payload)
};

export default DepartureService;