/**
 * Print Service - Clean API service for print operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** KOT Printer Settings */
export interface KotPrinterSettings {
  printer_name: string | null
  enableKotPrint: number
  [key: string]: any
}

/** Outlet Details */
export interface OutletDetails {
  brand_name?: string
  hotel_name?: string
  outlet_name?: string
  [key: string]: any
}

/** Print Settings Response */
export interface PrintSettingsResponse {
  KotPrinterSettings?: KotPrinterSettings
  outletDetails?: OutletDetails
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Print Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const PrintService = {
  /* ═══════════════════════════════════════════════════════════════════════════
   * KOT Printer Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get KOT printer settings by outlet ID
   */
  getKotPrinterSettings: (outletId: number): Promise<ApiResponse<KotPrinterSettings>> =>
    HttpClient.get<ApiResponse<KotPrinterSettings>>(`/settings/kot-printer-settings/${outletId}`),

  /**
   * Get outlet details by ID
   */
  getOutletDetails: (outletId: number): Promise<ApiResponse<OutletDetails>> =>
    HttpClient.get<ApiResponse<OutletDetails>>(`/outlets/${outletId}`),

  /**
   * Get KOT printer settings and outlet details in one call
   */
  getPrintSettings: async (outletId: number): Promise<PrintSettingsResponse> => {
    try {
      const [printerRes, outletRes] = await Promise.all([
        PrintService.getKotPrinterSettings(outletId),
        PrintService.getOutletDetails(outletId)
      ])

      return {
        KotPrinterSettings: printerRes.data,
        outletDetails: outletRes.data
      }
    } catch (error) {
      console.error('Failed to fetch print settings:', error)
      throw error
    }
  }
}

export default PrintService
