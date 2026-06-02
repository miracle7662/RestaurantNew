import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface SubDepartment {
  sub_department_id: number;
  department_id: number;
  department_name?: string;
  sub_department_name: string;
  description?: string;
  hotelid?: number;
  status: number;
  created_by_id?: number;
  created_date?: string;
  updated_by_id?: number;
  updated_date?: string;
}

export interface SubDepartmentPayload {
  department_id: number;
  department_name?: string;
  sub_department_name: string;
  description?: string;
  hotelid?: number;
  status?: number;
  created_by_id?: number;
  updated_by_id?: number;
}

export interface SubDepartmentListParams {
  hotelid?: number;
  department_id?: number;
  status?: number;
  q?: string;
}

const SubDepartmentService = {
  /**
   * Get all sub-departments with optional filters
   */
  list: (params?: SubDepartmentListParams): Promise<ApiResponse<SubDepartment[]>> =>
    HttpClient.get<ApiResponse<SubDepartment[]>>('/sub-departments', { params }),

  /**
   * Get sub-departments by department ID
   */
  getByDepartment: (departmentId: number, params?: { hotelid?: number }): Promise<ApiResponse<SubDepartment[]>> =>
    HttpClient.get<ApiResponse<SubDepartment[]>>(`/sub-departments/department/${departmentId}`, { params }),

  /**
   * Get a single sub-department by ID
   */
  get: (id: number): Promise<ApiResponse<SubDepartment>> =>
    HttpClient.get<ApiResponse<SubDepartment>>(`/sub-departments/${id}`),

  /**
   * Create a new sub-department
   */
  create: (payload: SubDepartmentPayload): Promise<ApiResponse<SubDepartment>> =>
    HttpClient.post<ApiResponse<SubDepartment>>('/sub-departments', payload),

  /**
   * Update an existing sub-department
   */
  update: (id: number, payload: SubDepartmentPayload): Promise<ApiResponse<SubDepartment>> =>
    HttpClient.put<ApiResponse<SubDepartment>>(`/sub-departments/${id}`, payload),

  /**
   * Delete a sub-department
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/sub-departments/${id}`),
};

export default SubDepartmentService;