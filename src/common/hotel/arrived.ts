import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface Arrived {
  arrived_id: number;
  arrived_name: string;
  description: string | null;
  status: number;
  created_by_id: number | null;
  created_date: string;
  updated_by_id: number | null;
  updated_date: string;
}

export interface ArrivedPayload {
  arrived_name: string;
  description?: string | null;
  status?: number;
}

const ArrivedService = {
  list: (params?: { status?: number }): Promise<ApiResponse<Arrived[]>> =>
    HttpClient.get<ApiResponse<Arrived[]>>('/arrived', { params }),

  create: (payload: ArrivedPayload): Promise<ApiResponse<Arrived>> =>
    HttpClient.post<ApiResponse<Arrived>>('/arrived', payload)
};

export default ArrivedService;