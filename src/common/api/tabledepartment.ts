/**
 * Table Department Service - Clean API service for restaurant table department operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Table Department information */
export interface TableDepartment {
  departmentid: number
  department_name: string
  outletid: number
  hotelid: number
  taxgroupid?: number
  marketid?: number
  status: number
  hotel_name?: string
  outlet_name?: string
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** Table Department management payload */
export interface TableDepartmentPayload {
  departmentid?: number
  department_name: string
  outletid: string | number
  taxgroupid: string | number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Table Department Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const TableDepartmentService = {
  /* ═══════════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all table departments with optional filters
   */
  list: (params?: { q?: string; hotelid?: number; outletid?: number }): Promise<ApiResponse<TableDepartment[]>> =>
    HttpClient.get<ApiResponse<TableDepartment[]>>('/table-department', { params }),

  /**
   * Create a new table department
   */
  create: (payload: TableDepartmentPayload): Promise<ApiResponse<TableDepartment>> =>
    HttpClient.post<ApiResponse<TableDepartment>>('/table-department', payload),

  /**
   * Update an existing table department
   */
  update: (id: number, payload: TableDepartmentPayload): Promise<ApiResponse<TableDepartment>> =>
    HttpClient.put<ApiResponse<TableDepartment>>(`/table-department/${id}`, payload),

  /**
   * Delete a table department
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/table-department/${id}`)
}

export default TableDepartmentService
