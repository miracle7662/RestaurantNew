import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface Department {
  hotel_departmentid: number;  // Changed from department_id
  hotel_department_name: string; // Changed from department_name
  hotelid: number;
  status: number;
  mst_hotelid?: number;
  created_by_id?: number;
  created_date?: string;
  updated_by_id?: number;
  updated_date?: string;
}

export interface DepartmentPayload {
  hotel_department_name: string; // Changed from department_name
  status?: number;
  hotelid?: number;
}

const DepartmentService = {
  list: (params?: { hotelid?: number }): Promise<ApiResponse<Department[]>> =>
    HttpClient.get<ApiResponse<Department[]>>('/departments', { params }),

  get: (id: number): Promise<ApiResponse<Department>> =>
    HttpClient.get<ApiResponse<Department>>(`/departments/${id}`),
};

export default DepartmentService;