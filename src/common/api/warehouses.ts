/**
 * Warehouse Service - Clean API service for warehouse management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Warehouse information */
export interface Warehouse {
  warehouseid: number
  warehouse_name: string
  warehouse_code: string
  hotelid: number
  outletid?: number
  address?: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** Warehouse payload for create/update */
export interface WarehousePayload {
  warehouseid?: number
  warehouse_name: string
  warehouse_code: string
  hotelid: number
  outletid?: number
  address?: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Warehouse Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const WarehouseService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all warehouses with optional search
   */
  list: (params?: { q?: string; hotelid?: number }): Promise<ApiResponse<Warehouse[]>> =>
    HttpClient.get<ApiResponse<Warehouse[]>>('/warehouse', { params }),

  /**
   * Create a new warehouse
   */
  create: (payload: WarehousePayload): Promise<ApiResponse<Warehouse>> =>
    HttpClient.post<ApiResponse<Warehouse>>('/warehouse', payload),

  /**
   * Update an existing warehouse
   */
  update: (id: number, payload: WarehousePayload): Promise<ApiResponse<Warehouse>> =>
    HttpClient.put<ApiResponse<Warehouse>>(`/warehouse/${id}`, payload),

  /**
   * Delete a warehouse
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/warehouse/${id}`)
}

export default WarehouseService
