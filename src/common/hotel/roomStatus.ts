// services/roomStatus.ts
/**
 * Room Status Service – API service for room status management
 */

import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

/* ----------------------------------------------------------------------
 * Type Definitions
 * ---------------------------------------------------------------------- */

export interface RoomStatus {
    room_status_id: number;
    status_name: string;
    status_color: string;
    is_active: number;
    created_date?: string;
    updated_date?: string;
}

export interface RoomStatusPayload {
    status_name: string;
    status_color?: string;
    is_active?: number;
}

/* ----------------------------------------------------------------------
 * Room Status Service
 * ---------------------------------------------------------------------- */

const RoomStatusService = {
    /**
     * Get all room statuses
     */
    list: (params?: { is_active?: number }): Promise<ApiResponse<RoomStatus[]>> =>
        HttpClient.get<ApiResponse<RoomStatus[]>>('/room-status', { params }),

    /**

     * Create a new room status
     */
    create: (payload: RoomStatusPayload): Promise<ApiResponse<RoomStatus>> =>
        HttpClient.post<ApiResponse<RoomStatus>>('/room-status', payload),

    /**
     * Update an existing room status
     */
    update: (id: number, payload: RoomStatusPayload): Promise<ApiResponse<RoomStatus>> =>
        HttpClient.put<ApiResponse<RoomStatus>>(`/room-status/${id}`, payload),

    /**
     * Delete a room status
     */
    remove: (id: number): Promise<ApiResponse<null>> =>
        HttpClient.delete<ApiResponse<null>>(`/room-status/${id}`),

    /**
     * Get a single room status by ID
     */
    get: (id: number): Promise<ApiResponse<RoomStatus>> =>
        HttpClient.get<ApiResponse<RoomStatus>>(`/room-status/${id}`),
};

export default RoomStatusService;