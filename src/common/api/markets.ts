/**
 * Market Service - Clean API service for market management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Market information */
export interface Market {
  marketid: number
  market_name: string
  status: number
  created_by_id: number
  created_date: number
  updated_by_id: number
  updated_date: number
}

/** Market payload for create/update - backend handles timestamps */
export interface MarketPayload {
  marketid?: number
  market_name: string
  status: number
  created_by_id: number
  created_date?: number  // Optional: backend generates
  updated_by_id?: number
  updated_date?: number  // Optional: backend generates
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Market Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const MarketService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all markets with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<Market[]>> =>
    HttpClient.get<ApiResponse<Market[]>>('/markets', { params }),

  /**
   * Create a new market
   */
  create: (payload: MarketPayload): Promise<ApiResponse<Market>> =>
    HttpClient.post<ApiResponse<Market>>('/markets', payload),

  /**
   * Update an existing market
   */
  update: (id: number, payload: MarketPayload): Promise<ApiResponse<Market>> =>
    HttpClient.put<ApiResponse<Market>>(`/markets/${id}`, payload),

  /**
   * Delete a market
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/markets/${id}`)
}

export default MarketService
