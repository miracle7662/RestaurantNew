/**
 * Company Service - Clean API service for company management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { APICore } from './apiCore'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Company information (matches company_master table) */
export interface Company {
  company_id: number
  company_name: string
  establishment_date: string | null
  address: string | null
  state_id: number | null
  city_id: number | null
  country_id: number | null
  state_name?: string
  city_name?: string
  country_name?: string
  mobile1: string
  mobile2: string | null
  gst_no: string | null
  email: string | null
  website: string | null
  booking_contact_name: string | null
  booking_contact_mobile: string | null
  booking_contact_phone: string | null
  corresponding_contact_name: string | null
  corresponding_contact_mobile: string | null
  corresponding_contact_phone: string | null
  credit_limit: number | null
  credit_allowed: number  // 0 or 1
  company_info: string | null
  have_discount: number    // 0 or 1
  status: number
  hotelid: number  // Changed from mst_hotelid to hotelid
  created_by_id: number | null
  created_at: string
  updated_by_id: number | null
  updated_at: string
}

/** Payload for creating/updating a company */
export interface CompanyPayload {
  company_name: string
  establishment_date?: string | null
  address?: string | null
  state_id?: number | null
  city_id?: number | null
  country_id?: number | null
  mobile1: string
  mobile2?: string | null
  gst_no?: string | null
  email?: string | null
  website?: string | null
  booking_contact_name?: string | null
  booking_contact_mobile?: string | null
  booking_contact_phone?: string | null
  corresponding_contact_name?: string | null
  corresponding_contact_mobile?: string | null
  corresponding_contact_phone?: string | null
  credit_limit?: number | null
  credit_allowed?: number   // 0 or 1
  company_info?: string | null
  have_discount?: number     // 0 or 1
  status?: number
  hotelid?: number       // Changed from mst_hotelid to hotelid - backend will set from auth if not provided
  created_by_id?: number
  updated_by_id?: number
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Company Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const CompanyService = {
  /**
   * Get all companies – expects hotelid as a query parameter
   * Auto-adds hotelid from logged-in user if not provided
   */
  list: (params?: { hotelid?: number; q?: string }): Promise<ApiResponse<Company[]>> => {
    const api = new APICore()
    const loggedInUser = api.getLoggedInUser()
    const effectiveParams = {
      ...params,
      hotelid: params?.hotelid || loggedInUser?.user?.hotel_id
    }
    return HttpClient.get<ApiResponse<Company[]>>('/companies', { params: effectiveParams })
  },

  /**
   * Get a single company by ID
   */
  get: (id: number): Promise<ApiResponse<Company>> =>
    HttpClient.get<ApiResponse<Company>>(`/companies/${id}`),

  /**
   * Create a new company
   */
  create: (payload: CompanyPayload): Promise<ApiResponse<Company>> =>
    HttpClient.post<ApiResponse<Company>>('/companies', payload),

  /**
   * Update an existing company
   */
  update: (id: number, payload: CompanyPayload): Promise<ApiResponse<Company>> =>
    HttpClient.put<ApiResponse<Company>>(`/companies/${id}`, payload),

  /**
   * Delete a company
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/companies/${id}`)
}

export default CompanyService