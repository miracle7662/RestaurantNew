// services/room.ts
/**
 * Room Service – Clean API service for room management
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

/* ----------------------------------------------------------------------
 * Type Definitions
 * ---------------------------------------------------------------------- */

export interface Room {
    room_id: number;
    room_no: string;
    room_name: string;
    display_name?: string;
    room_category_id: number;
    category_name?: string;
    room_ext_no?: string;
    room_status_id: number;
    room_status?: string;
    status_color?: string;
    department_id?: number;
    department_name?: string;
    block_id?: number;
    block_name?: string;
    floor_id?: number;
    floor_name?: string;
    hotelid: number;
    created_date?: string;
    updated_date?: string;
    created_by_id?: number;
    updated_by_id?: number;
}

export interface RoomPayload {
    room_no: string;
    room_name: string;
    display_name?: string;
    room_category_id: number;
    room_ext_no?: string;
    room_status_id?: number;
    department_id?: number;
    block_id?: number;
    floor_id?: number;
    hotelid?: number;
    created_by_id?: number;
    updated_by_id?: number;
     room_status ?: string
}

/* ----------------------------------------------------------------------
 * Room Service
 * ---------------------------------------------------------------------- */

const RoomService = {
    /**
     * Get all rooms – expects hotelid as a query parameter
     */
    list: (params?: { hotelid?: number; q?: string }): Promise<ApiResponse<Room[]>> =>
        HttpClient.get<ApiResponse<Room[]>>('/rooms', { params }),

    /**
     * Create a new room
     */
    create: (payload: RoomPayload): Promise<ApiResponse<Room>> =>
        HttpClient.post<ApiResponse<Room>>('/rooms', payload),

    /**
     * Update an existing room
     */
    update: (id: number, payload: RoomPayload): Promise<ApiResponse<Room>> =>
        HttpClient.put<ApiResponse<Room>>(`/rooms/${id}`, payload),

    /**
     * Delete a room
     */
    remove: (id: number): Promise<ApiResponse<null>> =>
        HttpClient.delete<ApiResponse<null>>(`/rooms/${id}`),

    /**
     * Get a single room by ID
     */
    get: (id: number): Promise<ApiResponse<Room>> =>
        HttpClient.get<ApiResponse<Room>>(`/rooms/${id}`),
};

export default RoomService;