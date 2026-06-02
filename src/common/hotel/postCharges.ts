// frontend/src/common/api/postCharges.ts
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface PostCharge {
  post_charge_id: number;
  checkin_id: number;
  guest_id: number;
  room_id: number;
  detail_id: number | null;
  transaction_type: 'CHARGE' | 'ALLOWANCE';
  post_datetime: string;
  bill_no: string;
  bill_date: string;  
  doc_no: string | null;
  outlet_name: string | null;
  outlet_option_id: number | null;
  outlet_option: string | null;
  description: string | null;
  particulars: string | null;
  amount: number;
  discount: number;
  tax_amount: number;
  total_amount: number;
  hotelid: number;
  created_by_id: number | null;
  updated_by_id: number | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  guest_name?: string;
  room_no?: string;
  reg_no?: string;
  booking_ref?: string;
}

export interface PostChargePayload {
  checkin_id: number;
  guest_id: number;
  room_id: number;
  detail_id?: number | null;
  transaction_type: 'CHARGE' | 'ALLOWANCE';
  post_datetime: string;
  bill_no: string;
  doc_no?: string | null;
  outlet_name?: string | null;
  outlet_option_id?: number | null;
  outlet_option?: string | null;
  description?: string | null;
  particulars?: string | null;
  amount: number;
  discount?: number;
  hotelid: number;
  created_by_id?: number | null;
  updated_by_id?: number | null;
  bill_date?: string;
}

export interface BulkPostChargePayload {
  charges: PostChargePayload[];
}

export interface PostChargeResponse {
  post_charge_id: number;
  total_amount: number;
  message?: string;
}

export interface PostChargeTransferPayload {
  checkin_id: number;
  old_room_id: number;
  new_room_id: number;
}

export interface SwapRoomsPostChargePayload {
  room_a_checkin_id: number;
  room_a_room_id: number;
  room_b_checkin_id: number;
  room_b_room_id: number;
}

const PostChargesService = {
  // GET all post charges with filters
  list: (params?: { 
    checkin_id?: number; 
    guest_id?: number; 
    room_id?: number; 
    hotelid?: number;
    transaction_type?: 'CHARGE' | 'ALLOWANCE';
  }): Promise<ApiResponse<PostCharge[]>> =>
    HttpClient.get<ApiResponse<PostCharge[]>>('/post-charges', { params }),

  // GET single post charge by ID
  get: (id: number): Promise<ApiResponse<PostCharge>> =>
    HttpClient.get<ApiResponse<PostCharge>>(`/post-charges/${id}`),

  // POST - Create new charge/allowance
  create: (payload: PostChargePayload): Promise<ApiResponse<PostChargeResponse>> =>
    HttpClient.post<ApiResponse<PostChargeResponse>>('/post-charges', payload),

  // PUT - Update existing charge/allowance
  update: (id: number, payload: Partial<PostChargePayload>): Promise<ApiResponse<PostChargeResponse>> =>
    HttpClient.put<ApiResponse<PostChargeResponse>>(`/post-charges/${id}`, payload),

  // DELETE - Remove charge/allowance
  delete: (id: number): Promise<ApiResponse<{ deleted_id: number; updated_checkin_total: number }>> =>
    HttpClient.delete<ApiResponse<{ deleted_id: number; updated_checkin_total: number }>>(`/post-charges/${id}`),

  // POST - Bulk create
  createBulk: (payload: BulkPostChargePayload): Promise<ApiResponse<PostChargeResponse[]>> =>
    HttpClient.post<ApiResponse<PostChargeResponse[]>>('/post-charges/bulk', payload),

  // POST - Transfer all post charges (CHARGE + ALLOWANCE) from old room to new room (used during Room Transfer)
  transferToRoom: (payload: PostChargeTransferPayload): Promise<ApiResponse<{ transferred: number }>> =>
    HttpClient.post<ApiResponse<{ transferred: number }>>('/post-charges/transfer-room', payload),

  // POST - Swap post charges (CHARGE + ALLOWANCE) between two rooms (used during Swap Room)
  swapBetweenRooms: (payload: SwapRoomsPostChargePayload): Promise<ApiResponse<{ swapped_a: number; swapped_b: number }>> =>
    HttpClient.post<ApiResponse<{ swapped_a: number; swapped_b: number }>>('/post-charges/swap-rooms', payload),
};

export default PostChargesService;