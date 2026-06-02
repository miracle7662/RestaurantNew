// agentRoomCheckin.ts
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface AgentRoomCheckin {
  checkin_transaction_id: number;
  checkin_id: number;
  reg_no: string;
  hotelid: number;
  guest_id: number;
  agent_id: number | null;
  agent_name: string | null;
  agent_code: string | null;
  commission_type: 'PERCENTAGE' | 'FIXED' | null;
  commission_value: number | null;
  commission_amount: number | null;
  agent_cgst_percent: number | null;
  agent_cgst_amount: number | null;
  agent_sgst_percent: number | null;
  agent_sgst_amount: number | null;
  agent_igst_percent: number | null;
  agent_igst_amount: number | null;
  agent_cess_percent: number | null;
  agent_cess_amount: number | null;
  agent_tds_percent: number | null;
  agent_tds_amount: number | null;
  agent_tcs_percent: number | null;
  agent_tcs_amount: number | null;
  agent_service_fee: number | null;
  agent_total_commission: number | null;
  agent_pay_to_hotel: number | null;
  room_id: number;
  room_number: string;
  room_category_id: number | null;
  converted_category_id: number | null;
  total_room_charges: number | null;
  total_extra_charges: number | null;
  grand_total_amount: number | null;
  payment_method: string | null;
  plan_name: string | null;
  booking_id: string | null;
  booking_date: string | null;
  status: 'active' | 'checked_out' | 'cancelled';
  is_billed: number;
  is_dayend: number;
  created_by_id: number | null;
  created_date: string;
  updated_by_id: number | null;
  updated_date: string;
}

export interface AgentRoomCheckinPayload {
  checkin_id: number;
  reg_no: string;
  hotelid: number;
  guest_id: number;
  agent_id?: number | null;
  agent_name?: string | null;
  agent_code?: string | null;
  commission_type?: 'PERCENTAGE' | 'FIXED' | null;
  commission_value?: number | null;
  commission_amount?: number | null;
  agent_cgst_percent?: number | null;
  agent_cgst_amount?: number | null;
  agent_sgst_percent?: number | null;
  agent_sgst_amount?: number | null;
  agent_igst_percent?: number | null;
  agent_igst_amount?: number | null;
  agent_cess_percent?: number | null;
  agent_cess_amount?: number | null;
  agent_tds_percent?: number | null;
  agent_tds_amount?: number | null;
  agent_tcs_percent?: number | null;
  agent_tcs_amount?: number | null;
  agent_service_fee?: number | null;
  agent_total_commission?: number | null;
  agent_pay_to_hotel?: number | null;
  room_id: number;
  room_number: string;
  room_category_id?: number | null;
  converted_category_id?: number | null;
  total_room_charges?: number | null;
  total_extra_charges?: number | null;
  grand_total_amount?: number | null;
  payment_method?: string | null;
  plan_name?: string | null;
  booking_id?: string | null;
  booking_date?: string | null;
  status?: 'active' | 'checked_out' | 'cancelled';
  is_billed?: number;
  is_dayend?: number;
  created_by_id?: number | null;
}

export interface AgentRoomCheckinResponse {
  checkin_transaction_id: number;
  checkin_id: number;
  reg_no: string;
  agent_name: string;
  commission_amount: number;
  agent_total_commission: number;
  agent_pay_to_hotel: number;
}

const AgentRoomCheckinService = {
  /**
   * Create agent room checkin record
   * Called only when travel agent is selected during checkin
   */
  create: (payload: AgentRoomCheckinPayload): Promise<ApiResponse<AgentRoomCheckinResponse>> =>
    HttpClient.post<ApiResponse<AgentRoomCheckinResponse>>('/agent-room-checkins', payload),

  /**
   * Get agent room checkin by checkin_id
   */
  getByCheckinId: (checkinId: number): Promise<ApiResponse<AgentRoomCheckin[]>> =>
    HttpClient.get<ApiResponse<AgentRoomCheckin[]>>(`/agent-room-checkins/checkin/${checkinId}`),

  /**
   * Get agent room checkin by guest_id
   */
  getByGuestId: (guestId: number): Promise<ApiResponse<AgentRoomCheckin[]>> =>
    HttpClient.get<ApiResponse<AgentRoomCheckin[]>>(`/agent-room-checkins/guest/${guestId}`),

  /**
   * Update agent room checkin
   */
  update: (id: number, payload: Partial<AgentRoomCheckinPayload>): Promise<ApiResponse<AgentRoomCheckin>> =>
    HttpClient.put<ApiResponse<AgentRoomCheckin>>(`/agent-room-checkins/${id}`, payload),

  /**
   * Delete agent room checkin
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/agent-room-checkins/${id}`)
};

export default AgentRoomCheckinService;