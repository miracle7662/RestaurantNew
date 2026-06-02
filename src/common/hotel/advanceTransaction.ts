// frontend/src/common/api/advanceTransaction.ts
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface AdvanceTransaction {
  advance_id: number;
  hotel_id: number;
  checkin_id: number;
  detail_id: number | null;
  room_id: number | null;
  guest_name: string;
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
}

export interface AdvanceTransactionPayload {
  hotel_id: number;
  checkin_id: number;
  detail_id?: number | null;
  room_id?: number | null;
  guest_name: string;
  room_no: string;
  transaction_type: string;
  receipt_no?: string;
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
  items?: any[];
  cancel_items?: any[];
  selected_refunds?: any[];
  refund_items?: any[];
  posting_items?: any[];
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

const AdvanceTransactionService = {
  list: (params?: { checkin_id?: number; hotel_id?: number; room_id?: number }): Promise<ApiResponse<AdvanceTransaction[]>> =>
    HttpClient.get<ApiResponse<AdvanceTransaction[]>>('/advance-transactions', { params }),

  get: (id: number): Promise<ApiResponse<AdvanceTransaction>> =>
    HttpClient.get<ApiResponse<AdvanceTransaction>>(`/advance-transactions/${id}`),

  getSummary: (checkinId: number): Promise<ApiResponse<AdvanceSummary>> =>
    HttpClient.get<ApiResponse<AdvanceSummary>>(`/advance-transactions/summary/${checkinId}`),

  getSummaryForRoom: (checkinId: number, roomId: number): Promise<ApiResponse<AdvanceSummary>> =>
    HttpClient.get<ApiResponse<AdvanceSummary>>(`/advance-transactions/summary/${checkinId}/room/${roomId}`),

  getAvailableAdvance: (checkinId: number, roomId?: number): Promise<ApiResponse<AvailableAdvance>> =>
    HttpClient.get<ApiResponse<AvailableAdvance>>(`/advance-transactions/available/${checkinId}${roomId ? `?room_id=${roomId}` : ''}`),

  create: (payload: AdvanceTransactionPayload): Promise<ApiResponse<AdvanceTransaction>> =>
    HttpClient.post<ApiResponse<AdvanceTransaction>>('/advance-transactions', payload),

  update: (id: number, payload: Partial<AdvanceTransactionPayload>): Promise<ApiResponse<AdvanceTransaction>> =>
    HttpClient.put<ApiResponse<AdvanceTransaction>>(`/advance-transactions/${id}`, payload),

  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/advance-transactions/${id}`),

  transferToRoom: (payload: TransferRoomPayload): Promise<ApiResponse<{ transferred: number }>> =>
    HttpClient.post<ApiResponse<{ transferred: number }>>('/advance-transactions/transfer-room', payload),

  swapBetweenRooms: (payload: SwapRoomsAdvancePayload): Promise<ApiResponse<{ swapped_a: number; swapped_b: number }>> =>
    HttpClient.post<ApiResponse<{ swapped_a: number; swapped_b: number }>>('/advance-transactions/swap-rooms', payload),
};

export default AdvanceTransactionService;