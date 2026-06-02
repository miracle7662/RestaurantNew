/**
 * Room Category Service - Clean API service for room category management
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

/* ----------------------------------------------------------------------
 * Type Definitions
 * ---------------------------------------------------------------------- */

export interface Tariff {
  id?: string;                // temporary frontend ID
  no_of_pax: number;
  room_tariff: number;
  department_id?: number;
  is_tax_applicable: number;  // 0/1
  tax_type?: string;           // tax ID as string
  discount_after: number;      // 0/1
}

export interface ModeCharge {
  mode_id: number;
  mode_name?: string;
  charges: number;
  department_id?: number;
  is_tax_applicable: number;
  tax_type?: string;
  discount_after: number;
  is_discount_apply: number;
}

export interface RoomCategory {
  room_category_id: number;
  category_no: string;
  category_name: string;
  department_id?: number;
  department_name?: string;
  print_name?: string;
  display_seq?: number;
  display_name?: string;
  total_rooms?: number;
  apply_date?: string;
  max_limit?: number;
  overbooking_no?: number;
  hotelid: number;  // Changed from mst_hotelid to hotelid
  status: number;
  created_by_id?: number;
  created_date?: string;
  updated_by_id?: number;
  updated_date?: string;
  tariffs?: Tariff[];
  mode_charges?: ModeCharge[];
}

export interface RoomCategoryPayload {
  category_no: string;
  category_name: string;
  department_id?: number;
  print_name?: string;
  display_seq?: number;
  display_name?: string;
  total_rooms?: number;
  apply_date?: string;
  max_limit?: number;
  overbooking_no?: number;
  hotelid?: number;        // Changed from mst_hotelid to hotelid
  status?: number;
  created_by_id?: number;
  updated_by_id?: number;
  tariffs: Tariff[];
  mode_charges: ModeCharge[];
}

/* ----------------------------------------------------------------------
 * Service
 * ---------------------------------------------------------------------- */

const RoomCategoryService = {
  /**
   * Get all room categories – expects hotelid as query param
   */
  list: (params?: { hotelid?: number; q?: string }): Promise<ApiResponse<RoomCategory[]>> =>
    HttpClient.get<ApiResponse<RoomCategory[]>>('/room-categories', { params }),

  /**
   * Get a single room category by ID (includes tariffs & mode charges)
   */
  get: (id: number): Promise<ApiResponse<RoomCategory>> =>
    HttpClient.get<ApiResponse<RoomCategory>>(`/room-categories/${id}`),

  /**
   * Create a new room category
   */
  create: (payload: RoomCategoryPayload): Promise<ApiResponse<RoomCategory>> =>
    HttpClient.post<ApiResponse<RoomCategory>>('/room-categories', payload),

  /**
   * Update an existing room category
   */
  update: (id: number, payload: RoomCategoryPayload): Promise<ApiResponse<RoomCategory>> =>
    HttpClient.put<ApiResponse<RoomCategory>>(`/room-categories/${id}`, payload),

  /**
   * Delete a room category
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/room-categories/${id}`),

  /**
   * Get all active charge modes (for dropdowns)
   */
  listModes: (): Promise<ApiResponse<Array<{ id: number; mode_name: string; description?: string }>>> =>
    HttpClient.get<ApiResponse<any[]>>('/room-categories/modes'),
};

export default RoomCategoryService;