/**
 * Travel Agent Service - Clean API service for travel agent management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

export interface TravelAgent {
  agent_id: number
  agent_name: string
  agent_code: string | null
  contact_person: string | null
  mobile_no: string
  email: string | null
  address: string | null
  country_id: number | null
  country_name: string | null
  state_id: number | null
  state_name: string | null
  city_id: number | null
  city_name: string | null
  pincode: string | null
  gst_no: string | null
  pan_no: string | null
  commission_type: 'PERCENTAGE' | 'FIXED'
  commission_value: number
  service_fee: number
  cgst: number
  sgst: number
  igst: number
  cess: number
  tds: number
  tcs: number
  billing_type: 'PREPAID' | 'CREDIT'
  credit_days: number
  tax_id: number | null        // new field
  status: number
  created_by_id: number | null
  created_date: string
  updated_by_id: number | null
  updated_date: string
}

export interface TravelAgentPayload {
  agent_name: string
  agent_code?: string | null
  contact_person?: string | null
  mobile_no: string
  email?: string | null
  address?: string | null
  country_id?: number | null
  state_id?: number | null
  city_id?: number | null
  pincode?: string | null
  gst_no?: string | null
  pan_no?: string | null
  commission_type?: 'PERCENTAGE' | 'FIXED'
  commission_value?: number
  service_fee?: number
  cgst?: number
  sgst?: number
  igst?: number
  cess?: number
  tds?: number
  tcs?: number
  billing_type?: 'PREPAID' | 'CREDIT'
  credit_days?: number
  tax_id?: number | null      // new field
  status?: number
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Travel Agent Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const TravelAgentService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all travel agents with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<TravelAgent[]>> =>
    HttpClient.get<ApiResponse<TravelAgent[]>>('/travel-agents', { params }),

  /**
   * Create a new travel agent
   */
  create: (payload: TravelAgentPayload): Promise<ApiResponse<TravelAgent>> =>
    HttpClient.post<ApiResponse<TravelAgent>>('/travel-agents', payload),

  /**
   * Update an existing travel agent
   */
  update: (id: number, payload: TravelAgentPayload): Promise<ApiResponse<TravelAgent>> =>
    HttpClient.put<ApiResponse<TravelAgent>>(`/travel-agents/${id}`, payload),

  /**
   * Delete a travel agent
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/travel-agents/${id}`)
}

export default TravelAgentService