/**
 * Item Group Service - Clean API service for item group management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Item Group information */
export interface ItemGroup {
  item_groupid: number
  itemgroupname: string
  code: string
  kitchencategoryid: string
  status: number
  created_by_id: number
  created_date: string
  updated_by_id: number
  updated_date: string
  hotelid: string
  marketid: string
}

/** Item Group payload for create/update */
export interface ItemGroupPayload {
  item_groupid: number
  itemgroupname: string
  code: string
  kitchencategoryid: string
  status: number
  created_by_id: number
  created_date?: string
  updated_by_id: number
  updated_date?: string
  hotelid: string
  marketid: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Item Group Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const ItemGroupService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all item groups with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<ItemGroup[]>> =>
    HttpClient.get<ApiResponse<ItemGroup[]>>('/ItemGroup', { params }),

  /**
   * Create a new item group
   */
  create: (payload: ItemGroupPayload): Promise<ApiResponse<ItemGroup>> =>
    HttpClient.post<ApiResponse<ItemGroup>>('/ItemGroup', payload),

  /**
   * Update an existing item group
   */
  update: (id: string, payload: ItemGroupPayload): Promise<ApiResponse<ItemGroup>> =>
    HttpClient.put<ApiResponse<ItemGroup>>(`/ItemGroup/${id}`, payload),

  /**
   * Delete an item group
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/ItemGroup/${id}`)
}

export default ItemGroupService
