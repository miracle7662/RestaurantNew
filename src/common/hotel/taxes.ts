/**
 * Hotel Tax Service - Clean API service for hotel tax management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Hotel Tax information */
export interface HotelTax {
  hotel_taxid: number;
  hotel_tax_value: number;
  hotel_cgst: number;
  hotel_sgst: number;
  hotel_igst: number;
  hotel_cess: number;
  status: number; // 1 = Active, 0 = Inactive
  created_by_id: number;
  created_date: string;
  updated_by_id: number;
  updated_date: string;
}

/** Hotel Tax payload for create/update */
export interface HotelTaxPayload {
  hotel_tax_value: number;
  hotel_cgst: number;
  hotel_sgst: number;
  hotel_igst: number;
  hotel_cess: number;
  status: number;
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Hotel Tax Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const HotelTaxService = {
  /**
   * Get all hotel tax records with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<HotelTax[]>> =>
    HttpClient.get<ApiResponse<HotelTax[]>>('/hotel-tax', { params }),

  /**
   * Create a new hotel tax record
   */
  create: (payload: HotelTaxPayload): Promise<ApiResponse<HotelTax>> =>
    HttpClient.post<ApiResponse<HotelTax>>('/hotel-tax', payload),

  /**
   * Update an existing hotel tax record
   */
  update: (id: number, payload: HotelTaxPayload): Promise<ApiResponse<HotelTax>> =>
    HttpClient.put<ApiResponse<HotelTax>>(`/hotel-tax/${id}`, payload),

  /**
   * Delete a hotel tax record
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/hotel-tax/${id}`)
};

export default HotelTaxService;