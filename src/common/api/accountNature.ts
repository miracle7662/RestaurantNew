/**
 * Account Nature Service - Clean API service for account nature management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Account Nature information */
export interface AccountNature {
  nature_id: number
  accountnature: string
  status: number
  hotelid: number
  countryid: number
  created_by_id: string
  created_date: string
  updated_by_id?: string
  updated_date?: string
}

/** Account Nature payload for create/update */
export interface AccountNaturePayload {
  accountnature: string
  status: number
  hotelid?: number
  countryid?: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Account Nature Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Helper function to extract data from response
 * Handles both direct array responses and wrapped {data: [...]} responses
 */
const extractData = <T>(response: unknown): T => {
  if (Array.isArray(response)) {
    return response as T;
  }
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
};

const AccountNatureService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all account natures
   */
  list: async (): Promise<AccountNature[]> => {
    const response = await HttpClient.get<AccountNature[]>('/accountnature');
    return extractData<AccountNature[]>(response);
  },

  /**
   * Get account nature by ID
   */
  getById: async (id: number): Promise<AccountNature> => {
    const response = await HttpClient.get<AccountNature>(`/accountnature/${id}`);
    return extractData<AccountNature>(response);
  },

  /**
   * Create a new account nature
   */
  create: async (payload: AccountNaturePayload): Promise<AccountNature> => {
    const response = await HttpClient.post<AccountNature>('/accountnature', payload);
    return extractData<AccountNature>(response);
  },

  /**
   * Update an existing account nature
   */
  update: async (id: number, payload: AccountNaturePayload): Promise<AccountNature> => {
    const response = await HttpClient.put<AccountNature>(`/accountnature/${id}`, payload);
    return extractData<AccountNature>(response);
  },

  /**
   * Delete an account nature
   */
  remove: async (id: number): Promise<void> => {
    await HttpClient.delete(`/accountnature/${id}`);
  }
}

export default AccountNatureService

