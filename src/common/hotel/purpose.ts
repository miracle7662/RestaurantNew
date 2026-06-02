import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface Purpose {
  purpose_id: number;
  purpose_name: string;
  description: string | null;
  status: number;
  created_by_id: number | null;
  created_date: string;
  updated_by_id: number | null;
  updated_date: string;
}

export interface PurposePayload {
  purpose_name: string;
  description?: string | null;
  status?: number;
}

const PurposeService = {
  list: (params?: { status?: number }): Promise<ApiResponse<Purpose[]>> =>
    HttpClient.get<ApiResponse<Purpose[]>>('/purposes', { params }),

  create: (payload: PurposePayload): Promise<ApiResponse<Purpose>> =>
    HttpClient.post<ApiResponse<Purpose>>('/purposes', payload)
};

export default PurposeService;