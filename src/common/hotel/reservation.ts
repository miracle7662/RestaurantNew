// services/reservation.ts
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface Reservation {
    reservation_id: number;
    reservation_no: string;
    guest_id: number;
    title: string;
    reservation_name: string;
    phone1: string;
    phone2: string;
    email: string;
    address: string;
    country_id: number | null;
    state_id: number | null;
    city_id: number | null;
    id_type: string | null;
    id_number: string;
    company_id: number | null;
    gst: string;
    group_name: string;
    reservation_date: string;
    arrival_date: string;
    arrival_time: string;
    departure_date: string;
    departure_time: string;
    nights: number;
    guest_type: string | null;
    billing_instructions: string;
    special_instructions: string;
    booking_taken_by: string;
    reservation_mode: string | null;
    confirmation_mode: string | null;
    pickup: string;
    drop_location: string;
    status: string;
    hotelid: number;
    created_by_id: number;
    created_at: string;
    updated_at?: string;
    updated_by_id?: number;
}

export interface ReservationPayload {
    reservation_no?: string;
    guest_id?: number;
    title?: string;
    reservation_name?: string;
    phone1?: string;
    phone2?: string;
    email?: string;
    address?: string;
    room_no?: string;
    country_id?: number | null;
    state_id?: number | null;
    city_id?: number | null;
    id_type?: string | null;
    id_number?: string;
    company_id?: number | null;
    gst?: string;
    group_name?: string;
    reservation_date?: string;
    arrival_date?: string;
    arrival_time?: string;
    departure_date?: string;
    departure_time?: string;
    nights?: number;
    guest_type?: string | null;
    billing_instructions?: string;
    special_instructions?: string;
    booking_taken_by?: string;
    reservation_mode?: string | null;
    confirmation_mode?: string | null;
    pickup?: string | null;
    drop_location?: string;
    status?: string;
    hotelid?: number;
    updated_by_id?: number;
    created_by_id?: number;
}

const ReservationService = {
    list: (params?: { hotelid?: number; q?: string }): Promise<ApiResponse<Reservation[]>> =>
        HttpClient.get<ApiResponse<Reservation[]>>('/reservations', { params }),

    get: (id: number): Promise<ApiResponse<Reservation>> =>
        HttpClient.get<ApiResponse<Reservation>>(`/reservations/${id}`),

    getNextNumber: (params?: { hotelid?: number }): Promise<ApiResponse<{ reservation_no: string }>> =>
        HttpClient.get<ApiResponse<{ reservation_no: string }>>('/reservations/next-number', { params }),

    create: (payload: ReservationPayload): Promise<ApiResponse<Reservation>> =>
        HttpClient.post<ApiResponse<Reservation>>('/reservations', payload),

    update: (id: number, payload: ReservationPayload): Promise<ApiResponse<Reservation>> =>
        HttpClient.put<ApiResponse<Reservation>>(`/reservations/${id}`, payload),

    remove: (id: number): Promise<ApiResponse<null>> =>
        HttpClient.delete<ApiResponse<null>>(`/reservations/${id}`)
};

export default ReservationService;