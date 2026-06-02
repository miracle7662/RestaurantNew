// roomStatusLog.ts
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface RoomStatusLog {
    log_id: number;
    room_id: number;
    room_no: string;
    previous_status: string;
    new_status: string;
    status_type: 'dirty' | 'block' | 'maint' | 'reservation';
    blocked_by: string | null;
    in_house_guest_name: string | null;
    reason: string | null;
    expected_hours: number;
    reservation_guest_id: number | null;
    reservation_datetime: string | null;
    hotelid: number;
    created_by_id: number;
    created_date: string;
}

export interface CreateRoomStatusLogPayload {
    room_id: number;
    room_no: string;
    previous_status: string;
    new_status: string;
    status_type: 'dirty' | 'block' | 'maint' | 'reservation';
    blocked_by?: string;
    in_house_guest_name?: string;
    reason?: string;
    expected_hours?: number;
    reservation_guest_id?: number;
    reservation_datetime?: string;
    hotelid: number;
    created_by_id?: number;
}

const RoomStatusLogService = {
    list: (params?: { hotelid?: number; room_id?: number; status_type?: string }): Promise<ApiResponse<RoomStatusLog[]>> =>
        HttpClient.get<ApiResponse<RoomStatusLog[]>>('/room-status-logs', { params }),

    create: (payload: CreateRoomStatusLogPayload): Promise<ApiResponse<RoomStatusLog>> =>
        HttpClient.post<ApiResponse<RoomStatusLog>>('/room-status-logs', payload),

    getByRoom: (roomId: number, params?: { hotelid?: number }): Promise<ApiResponse<RoomStatusLog[]>> =>
        HttpClient.get<ApiResponse<RoomStatusLog[]>>(`/room-status-logs/room/${roomId}`, { params }),
};

export default RoomStatusLogService;