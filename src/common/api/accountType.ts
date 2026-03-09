/**
 * Account Type Service - Clean API service for account type management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Account Type information */
export interface AccountType {
  AccID: number
  AccName: string
  UnderID: number | null
  NatureOfC: number | null
  status: number
  hotelid: number
  countryid: number
  created_by_id: string
  created_date: string
  updated_by_id?: string
  updated_date?: string
}

/** Account Type payload for create/update */
export interface AccountTypePayload {
  AccName: string
  UnderID: number | null
  NatureOfC: number | null
  status: number
  hotelid: number
  countryid?: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Account Type Service
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

const AccountTypeService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all account types
   */
  list: async (): Promise<AccountType[]> => {
    const response = await HttpClient.get<AccountType[]>('/accounttype');
    return extractData<AccountType[]>(response);
  },

  /**
   * Get account type by ID
   */
  getById: async (id: number): Promise<AccountType> => {
    const response = await HttpClient.get<AccountType>(`/accounttype/${id}`);
    return extractData<AccountType>(response);
  },

  /**
   * Create a new account type
   */
  create: async (payload: AccountTypePayload): Promise<AccountType> => {
    const response = await HttpClient.post<AccountType>('/accounttype', payload);
    return extractData<AccountType>(response);
  },

  /**
   * Update an existing account type
   */
  update: async (id: number, payload: AccountTypePayload): Promise<AccountType> => {
    const response = await HttpClient.put<AccountType>(`/accounttype/${id}`, payload);
    return extractData<AccountType>(response);
  },

  /**
   * Delete an account type
   */
  remove: async (id: number): Promise<void> => {
    await HttpClient.delete(`/accounttype/${id}`);
  }
}

export default AccountTypeService

