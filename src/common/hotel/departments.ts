import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface Department {
  department_id: number;
  department_name: string;
  status: number;
  mst_hotelid?: number;
  created_by_id?: number;
  created_date?: string;
  updated_by_id?: number;
  updated_date?: string;
}

export interface DepartmentPayload {
  department_name: string;
  status?: number;
  mst_hotelid?: number;
}

const DepartmentService = {
  list: (params?: { mst_hotelid?: number }): Promise<ApiResponse<Department[]>> =>
    HttpClient.get<ApiResponse<Department[]>>('/departments', { params }),

  get: (id: number): Promise<ApiResponse<Department>> =>
    HttpClient.get<ApiResponse<Department>>(`/departments/${id}`),

 
};

export default DepartmentService;