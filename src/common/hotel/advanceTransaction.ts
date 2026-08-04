// frontend/src/common/api/advanceTransaction.ts
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

// ============================================================================
// Interfaces
// ============================================================================

export interface AdvanceTransaction {
  advance_id: number;
  hotelid: number;
  checkin_id: number;
  detail_id: number | null;
  room_id: number | null;
  guest_name: string;
  company_name: string;
  room_no: string;
  transaction_type: 'Booking Receipt' | 'Advance Refund' | 'Advance Cancel' | 'Advance Posting' | 'Advance Addition';
  receipt_no: string;
  payment_method: string;
  amount: number;
  debit_amount: number;
  credit_amount: number;
  balance_amount: number;
  reason: string | null;
  narration: string | null;
  reference_no: string | null;
  transaction_datetime: string;
  status: 'active' | 'cancelled' | 'refunded' | 'posted';
  created_by_id: number;
  created_at: string;
  updated_at: string;
  description: string | null;
}

/**
 * Payload for all transaction types (matches frontend Advance.tsx)
 */
export interface AdvanceTransactionPayload {
  hotelid: number;
  checkin_id: number;
  detail_id?: number | null;
  room_id?: number | null;
  guest_name: string;
  room_no: string;
  transaction_type: string; // e.g., 'Booking Receipt', 'Advance Addition', etc.
  receipt_no?: string;      // If not provided, backend may auto-generate
  payment_method?: string;
  amount?: number;
  debit_amount?: number;
  credit_amount?: number;
  balance_amount?: number;
  reason?: string;
  narration?: string;
  reference_no?: string;
  transaction_datetime?: string;
  status?: string;
  created_by_id?: number;
  bill_date?: string;       // Added for stored procedure
  // Line items – depends on transaction type
  items?: any[];            // Booking Receipt / Addition
  cancel_items?: any[];     // Cancel
  selected_refunds?: any[]; // Refund
  refund_items?: any[];     // Refund
  posting_items?: any[];    // Posting
}

/**
 * Response from the stored procedure (simplified)
 */
export interface AdvanceTransactionProcessResponse {
  success: boolean;
  message: string;
  transactionId: number | null;
  // If the backend fetches the full record, this can be included
  data?: AdvanceTransaction;
}

export interface AdvanceSummary {
  total_advance_received: number;
  total_advance_used: number;
  total_advance_refunded: number;
  total_advance_cancelled: number;
  pending_advance: number;
}

export interface AvailableAdvance {
  available_advance: number;
  transactions: Array<{
    advance_id: number;
    receipt_no: string;
    credit_amount: number;
    available_balance: number;
  }>;
}

export interface TransferRoomPayload {
  checkin_id: number;
  old_room_id: number;
  new_room_id: number;
  new_room_no: string;
}

export interface SwapRoomsAdvancePayload {
  room_a_checkin_id: number;
  room_a_room_id: number;
  room_a_room_no: string;
  room_b_checkin_id: number;
  room_b_room_id: number;
  room_b_room_no: string;
}

// ============================================================================
// Service
// ============================================================================

const AdvanceTransactionService = {
  /**
   * List transactions with optional filters
   */
  list: (params?: { checkin_id?: number; hotelid?: number; room_id?: number }): Promise<ApiResponse<AdvanceTransaction[]>> =>
    HttpClient.get<ApiResponse<AdvanceTransaction[]>>('/advance-transactions', { params }),

  /**
   * Get a single transaction by ID
   */
  get: (id: number): Promise<ApiResponse<AdvanceTransaction>> =>
    HttpClient.get<ApiResponse<AdvanceTransaction>>(`/advance-transactions/${id}`),

  /**
   * Get summary (pending balance) for a checkin
   */
  getSummary: (checkinId: number): Promise<ApiResponse<AdvanceSummary>> =>
    HttpClient.get<ApiResponse<AdvanceSummary>>(`/advance-transactions/summary/${checkinId}`),

  /**
   * Get summary for a specific room
   */
  getSummaryForRoom: (checkinId: number, roomId: number): Promise<ApiResponse<AdvanceSummary>> =>
    HttpClient.get<ApiResponse<AdvanceSummary>>(`/advance-transactions/summary/${checkinId}/room/${roomId}`),

  /**
   * Get available advance balances for a checkin (optionally filtered by room)
   */
  getAvailableAdvance: (checkinId: number, roomId?: number): Promise<ApiResponse<AvailableAdvance>> =>
    HttpClient.get<ApiResponse<AvailableAdvance>>(`/advance-transactions/available/${checkinId}${roomId ? `?room_id=${roomId}` : ''}`),

  /**
   * Process an advance transaction using the stored procedure.
   * This handles: Booking Receipt, Addition, Refund, Cancel, Posting.
   * Use this method when you want the full transaction logic (balance updates, locks, etc.)
   */
  processTransaction: (payload: AdvanceTransactionPayload): Promise<ApiResponse<AdvanceTransactionProcessResponse>> =>
    HttpClient.post<ApiResponse<AdvanceTransactionProcessResponse>>('/advance-transactions/transaction', payload),

  operation: <T = any>(
  action: string,
  payload: any = {}
): Promise<ApiResponse<T>> =>
  HttpClient.post<ApiResponse<T>>(
    "/advance-transactions/operations",
    {
      action,
      ...payload,
    }
  ),

  /**
   * Create a transaction (legacy direct insert or call stored procedure).
   * If your backend routes /advance-transactions to the stored procedure, this will work.
   * Otherwise, use processTransaction for explicit stored procedure calls.
   */
  create: (payload: AdvanceTransactionPayload): Promise<ApiResponse<AdvanceTransaction>> =>
    HttpClient.post<ApiResponse<AdvanceTransaction>>('/advance-transactions', payload),

  /**
   * Update an existing transaction (use with caution; direct updates may bypass business logic)
   */
  update: (id: number, payload: Partial<AdvanceTransactionPayload>): Promise<ApiResponse<AdvanceTransaction>> =>
    HttpClient.put<ApiResponse<AdvanceTransaction>>(`/advance-transactions/${id}`, payload),

  /**
   * Soft-delete or cancel a transaction (change status)
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/advance-transactions/${id}`),

  /**
   * Transfer all advances from one room to another within the same checkin
   */
  transferToRoom: (payload: TransferRoomPayload): Promise<ApiResponse<{ transferred: number }>> =>
    HttpClient.post<ApiResponse<{ transferred: number }>>('/advance-transactions/transfer-room', payload),

  /**
   * Swap advances between two rooms (both must be in the same checkin or different)
   */
  swapBetweenRooms: (payload: SwapRoomsAdvancePayload): Promise<ApiResponse<{ swapped_a: number; swapped_b: number }>> =>
    HttpClient.post<ApiResponse<{ swapped_a: number; swapped_b: number }>>('/advance-transactions/swap-rooms', payload),
};

export default AdvanceTransactionService;