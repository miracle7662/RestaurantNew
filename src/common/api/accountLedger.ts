/**
 * Account Ledger Service - Clean API service for account ledger management operations
 * Uses HttpClient with interceptors for authentication
 */

import HttpClient from '../helpers/httpClient'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Account Ledger information */
export interface AccountLedger {
  LedgerId?: string;
  LedgerNo: string;
  Name: string;
  MarathiName?: string;
  address: string;
  stateid?: string;
  state?: string;
  cityid?: string;
  city?: string;
  MobileNo: string;
  PhoneNo?: string;
  GstNo?: string;
  PanNo?: string;
  OpeningBalance: string;
  OpeningBalanceDate?: string;
  AccountTypeId?: string;
  AccountType: string;
  Status: number;
  createdbyid?: number;
  updatedbyid?: number;
  hotelid?: string;
  companyid?: number;
  yearid?: number;
}

/** Account Ledger payload for create/update */
export interface AccountLedgerPayload {
  LedgerNo: string;
  Name: string;
  MarathiName?: string;
  address: string;
  stateid?: string;
  cityid?: string;
  MobileNo: string;
  PhoneNo?: string;
  GstNo?: string;
  PanNo?: string;
  OpeningBalance: string;
  OpeningBalanceDate?: string;
  AccountTypeId?: string;
  AccountType?: string;
  Status: number;
  hotelId?: number;
  createdBy?: number;
  updatedBy?: number;
}

/** Next Ledger Number response */
export interface NextLedgerNoResponse {
  nextLedgerNo: number;
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Account Ledger Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const AccountLedgerService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all account ledgers
   */
  list: (): Promise<AccountLedger[]> =>
    HttpClient.get<AccountLedger[]>('/account-ledger/ledger'),

  /**
   * Get account ledger by ID
   */
  getById: (id: string): Promise<AccountLedger> =>
    HttpClient.get<AccountLedger>(`/account-ledger/${id}`),

  /**
   * Create a new account ledger
   */
  create: (payload: AccountLedgerPayload): Promise<{ success: boolean; id?: number; error?: string }> =>
    HttpClient.post<{ success: boolean; id?: number; error?: string }>('/account-ledger', payload),

  /**
   * Update an existing account ledger
   */
  update: (id: string, payload: AccountLedgerPayload): Promise<{ success: boolean; changes?: number; error?: string }> =>
    HttpClient.put<{ success: boolean; changes?: number; error?: string }>(`/account-ledger/${id}`, payload),

  /**
   * Delete an account ledger
   */
  remove: (id: string): Promise<{ success: boolean; error?: string }> =>
    HttpClient.delete<{ success: boolean; error?: string }>(`/account-ledger/${id}`),

  /**
   * Get next ledger number
   */
  getNextLedgerNo: (): Promise<NextLedgerNoResponse> =>
    HttpClient.get<NextLedgerNoResponse>('/account-ledger/next-ledger-no')
}

export default AccountLedgerService

