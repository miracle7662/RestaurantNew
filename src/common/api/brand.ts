/**
 * Brand Service - Clean API service for brand/hotel management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Brand information */
export interface Brand {
  hotelid: string
  hotel_name: string
  marketid: string
  short_name: string
  phone: string
  email: string
  fssai_no: string
  trn_gstno: string
  panno: string
  website: string
  address: string
  cityid: string;
  stateid: string
  hoteltypeid: string
  Masteruserid: string
  status: string
  created_by_id: string
  created_date: string
  updated_by_id: string
  updated_date: string
  market_name: string
}

/** Brand payload for create/update */
export interface BrandPayload {
  hotelid?: string
  hotel_name: string
  marketid: string
  short_name: string
  phone: string
  email: string
  fssai_no: string
  trn_gstno: string
  panno: string
  website: string
  address: string
  stateid: string
  hoteltypeid: string
  Masteruserid?: string
  status: string
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** User data for brand */
export interface BrandUser {
  userid?: number
  username: string
  email: string
  mobile?: string
  phone?: string
  hotelid?: number
  [key: string]: any
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Brand Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const BrandService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * Brand Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all brands with optional filters
   */
  getBrands: (params?: { role_level?: string; hotelid?: string }): 
  Promise<Brand[]> =>
  HttpClient.get<Brand[]>('/HotelMasters', { params }),

  /**
   * Get brand by ID
   */
  getBrandById: (id: string): Promise<ApiResponse<Brand>> =>
    HttpClient.get<ApiResponse<Brand>>(`/HotelMasters/${id}`),

  /**
   * Add new brand
   */
  addBrand: (brandData: BrandPayload): Promise<ApiResponse<Brand>> =>
    HttpClient.post<ApiResponse<Brand>>('/HotelMasters', brandData),

  /**
   * Update brand
   */
  updateBrand: (id: string, brandData: BrandPayload): Promise<ApiResponse<Brand>> =>
    HttpClient.put<ApiResponse<Brand>>(`/HotelMasters/${id}`, brandData),

  /**
   * Delete brand
   */
  deleteBrand: (id: string): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/HotelMasters/${id}`),

  /* ═══════════════════════════════════════════════════════════════════════════
   * User Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get users by brand_id
   */
  getUsers: (params?: { brand_id?: string }): Promise<ApiResponse<any[]>> =>
    HttpClient.get<ApiResponse<any[]>>('/users', { params }),

   /**
   * Create a new user
   */
  createUser: (userData: BrandUser): Promise<ApiResponse<any>> =>
    HttpClient.post<ApiResponse<any>>('/api/users', userData)

}

export default BrandService
