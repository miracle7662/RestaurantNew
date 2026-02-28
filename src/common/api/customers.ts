/**
 * Customer Service - Clean API service for customer management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Customer information */
export interface Customer {
  customerid: number
  name: string
  countryCode: string
  mobile: string
  mail?: string
  cityid: string
  city_name: string
  address1: string
  address2?: string
  stateid: string
  state_name: string
  pincode?: string
  gstNo?: string
  fssai?: string
  panNo?: string
  aadharNo?: string
  birthday?: string
  anniversary?: string
  customerType?: string
  status?: number
  createWallet?: boolean
  created_by_id?: number
  created_date?: string
  updated_by_id?: number
  updated_date?: string
}

/** Customer payload for create/update */
export interface CustomerPayload {
  customerid?: number
  name: string
  countryCode: string
  mobile: string
  mail?: string;
  cityid: string
  city_name: string
  address1: string
  address2?: string
  stateid: string
  state_name: string
  pincode?: string
  gstNo?: string
  fssai?: string
  panNo?: string
  aadharNo?: string
  birthday?: string
  anniversary?: string
  customerType: string
  status: number
  created_by_id?: number
  created_date?: string
  updated_by_id?: number
  updated_date?: string
}

/** Customer list response */
export interface CustomerListResponse {
  data: Customer[]
  success: boolean
  message?: string
}

/** Customer create response */
export interface CustomerResponse {
  success: boolean
  message: string
  data?: Customer
  error?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Customer Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const CustomerService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * Customer Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all customers
   */
  list: (params?: { q?: string }): Promise<ApiResponse<Customer[]>> =>
    HttpClient.get<ApiResponse<Customer[]>>('/customer', { params }),

  /**
   * Get customer by ID
   */
  getById: (id: number): Promise<ApiResponse<Customer>> =>
    HttpClient.get<ApiResponse<Customer>>(`/customer/${id}`),

  /**
   * Get customer by mobile number
   */
  getByMobile: (mobile: string): Promise<ApiResponse<Customer>> =>
    HttpClient.get<ApiResponse<Customer>>('/customer/by-mobile', { params: { mobile } }),

  /**
   * Create a new customer
   */
  create: (payload: CustomerPayload): Promise<ApiResponse<CustomerResponse>> =>
    HttpClient.post<ApiResponse<CustomerResponse>>('/customer', payload),

  /**
   * Update an existing customer
   */
  update: (id: number, payload: CustomerPayload): Promise<ApiResponse<CustomerResponse>> =>
    HttpClient.put<ApiResponse<CustomerResponse>>(`/customer/${id}`, payload),

  /**
   * Delete a customer
   */
  remove: (id: number): Promise<ApiResponse<{ success: boolean; message: string }>> =>
    HttpClient.delete<ApiResponse<{ success: boolean; message: string }>>(`/customer/${id}`)
}

export default CustomerService
