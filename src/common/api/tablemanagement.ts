/**
 * Table Management Service - Clean API service for restaurant table operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Table information */
export interface Table {
  tableid: number
  table_name: string
  table_no?: string
  outletid: number
  hotelid: number
  departmentid: number
  department_name?: string
  marketid: number
  status: number
  capacity?: number
  minCapacity?: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** Table management payload */
export interface TableManagementPayload {
  tableid?: number
  table_name: string
  table_no?: string
  outletid: string | number
  hotelid: string | number
  departmentid: string | number
  marketid: string | number
  status: number
  capacity?: number
  minCapacity?: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** Sub-table creation payload */
export interface SubTablePayload {
  parentTableId: number
  userId: string | number
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Table Management Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const TableManagementService = {
  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all tables with optional filters
   */
  list: (params?: { q?: string; search?: string }): Promise<ApiResponse<Table[]>> =>
    HttpClient.get<ApiResponse<Table[]>>('/tablemanagement', { params }),

  /**
   * Create a new table
   */
  create: (payload: TableManagementPayload): Promise<ApiResponse<Table>> =>
    HttpClient.post<ApiResponse<Table>>('/tablemanagement', payload),

  /**
   * Update an existing table
   */
  update: (id: number, payload: TableManagementPayload): Promise<ApiResponse<Table>> =>
    HttpClient.put<ApiResponse<Table>>(`/tablemanagement/${id}`, payload),

/**
   * Delete a table
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/tablemanagement/${id}`),

  /**
   * Create a sub-table for an existing table
   */
  createSubTable: (payload: SubTablePayload): Promise<ApiResponse<Table>> =>
    HttpClient.post<ApiResponse<Table>>('/tablemanagement/sub-table', payload)
}

export default TableManagementService
