/**
 * Master Data Service - Clean API service for master data operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Country information */
export interface Country {
  countryid: number
  country_name: string
  country_code: string
  country_capital?: string
  status: number
}

/** Timezone information */
export interface Timezone {
  timezone_id: number
  timezone_name: string
  timezone_offset: string
  description?: string
}

/** Time option information */
export interface TimeOption {
  time_id: number
  time_value: string
  time_label: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Master Data Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const MasterDataService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * Country Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all countries
   */
  getCountries: (): Promise<ApiResponse<Country[]>> =>
    HttpClient.get<ApiResponse<Country[]>>('/api/countries'),

  /* ═══════════════════════════════════════════════════════════════════════════
   * Timezone Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get timezones (optionally filtered by country)
   */
  getTimezones: (country_code?: string): Promise<ApiResponse<Timezone[]>> =>
    HttpClient.get<ApiResponse<Timezone[]>>('/api/timezones', { params: { country_code } }),

  /* ═══════════════════════════════════════════════════════════════════════════
   * Time Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get start times
   */
  getStartTimes: (): Promise<ApiResponse<TimeOption[]>> =>
    HttpClient.get<ApiResponse<TimeOption[]>>('/api/times/start-times'),

  /**
   * Get close times
   */
  getCloseTimes: (): Promise<ApiResponse<TimeOption[]>> =>
    HttpClient.get<ApiResponse<TimeOption[]>>('/api/times/close-times')
}

export default MasterDataService
