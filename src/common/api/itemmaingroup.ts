/**
 * Item Main Group Service - Clean API service for item main group management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Item Main Group information */
export interface ItemMainGroup {
  item_maingroupid: number
  item_maigroup_name: string
  code: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** Item Main Group payload for create/update */
export interface ItemMainGroupPayload {
  item_maingroupid?: number
  item_maigroup_name: string
  code: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Item Main Group Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const ItemMainGroupService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all item main groups with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<ItemMainGroup[]>> =>
    HttpClient.get<ApiResponse<ItemMainGroup[]>>('/ItemMainGroup', { params }),

  /**
   * Create a new item main group
   */
  create: (payload: ItemMainGroupPayload): Promise<ApiResponse<ItemMainGroup>> =>
    HttpClient.post<ApiResponse<ItemMainGroup>>('/ItemMainGroup', payload),

  /**
   * Update an existing item main group
   */
  update: (id: number, payload: ItemMainGroupPayload): Promise<ApiResponse<ItemMainGroup>> =>
    HttpClient.put<ApiResponse<ItemMainGroup>>(`/ItemMainGroup/${id}`, payload),

  /**
   * Delete an item main group
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/ItemMainGroup/${id}`)
}

export default ItemMainGroupService
