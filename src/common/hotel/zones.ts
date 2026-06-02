/**
 * Zone Service - API service for zone management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Zone information */
export interface Zone {
  zoneid: number;
  zonename: string;
  zonecode: string;
  cityid: number;
  city_name: string;
  description?: string;
  status: number;
  created_date?: string;
  updated_date?: string;
}

/** Zone payload for create/update */
export interface ZonePayload {
  zonename: string;
  zonecode: string;
  cityid: number;
  description?: string;
  status: number;
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Zone Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const ZoneService = {

  /**
   * Get all zones
   */
  list: (params?: { q?: string; cityid?: number }): Promise<ApiResponse<Zone[]>> =>
    HttpClient.get<ApiResponse<Zone[]>>('/zones', { params }),

  /**
   * Create a new zone
   */
  create: (payload: ZonePayload): Promise<ApiResponse<Zone>> =>
    HttpClient.post<ApiResponse<Zone>>('/zones', payload),

  /**
   * Update an existing zone
   */
  update: (id: number, payload: ZonePayload): Promise<ApiResponse<Zone>> =>
    HttpClient.put<ApiResponse<Zone>>(`/zones/${id}`, payload),

  /**
   * Delete a zone
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/zones/${id}`)
};

export default ZoneService;