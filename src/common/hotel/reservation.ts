// services/reservation.ts
// Single-API reservation service. One call creates/updates/fetches the
// reservation together with all of its rooms (reservation_rooms) and its
// booked-by link (reservation_booked_by) — mirrors the checkIn.ts pattern
// where checkin_master + checkin_detail_master + checkin_guest_room_charges
// + checkin_guest_folio_master are all handled through one endpoint.

import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface ReservationRoom {
    room_row_id: number;
    reservation_id: number;
    room_category_id: number | null;
    converted_category_id: number | null;
    total_rooms: number;
    pax_count: number;
    pax_price: number;
    pax_tax: number;
    ex_pax_count: number;
    ex_pax_price: number;
    ex_pax_tax: number;
    ex_pax_tax_percent: number;
    ex_pax_total: number;
    child_count: number;
    child_price: number;
    child_tax: number;
    child_tax_percent: number;
    child_total: number;
    driver_count: number;
    driver_price: number;
    driver_tax: number;
    driver_tax_percent: number;
    driver_total: number;
    discount_percent: number;
    discount_amount: number;
    total_amount: number;
}

export interface ReservationRoomInput {
    room_row_id?: number; // present on edit-load rows, ignored on insert
    room_category_id?: number | null;
    converted_category_id?: number | null;
    total_rooms?: number;
    pax_count?: number;
    pax_price?: number;
    pax_tax?: number;
    ex_pax_count?: number;
    ex_pax_price?: number;
    ex_pax_tax?: number;
    ex_pax_tax_percent?: number;
    ex_pax_total?: number;
    child_count?: number;
    child_price?: number;
    child_tax?: number;
    child_tax_percent?: number;
    child_total?: number;
    driver_count?: number;
    driver_price?: number;
    driver_tax?: number;
    driver_tax_percent?: number;
    driver_total?: number;
    discount_percent?: number;
    discount_amount?: number;
    total_amount?: number;
}

export interface ReservationBookedByLink {
    id: number;
    reservation_id: number;
    booked_by_id: number;
    booked_by_name?: string;
    mobile1?: string;
    email?: string;
}

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
    // Embedded child data returned by GET /reservations/:id
    rooms?: ReservationRoom[];
    booked_by?: ReservationBookedByLink | null;
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
    created_by_id?: number;

    // Embedded child rows — same request inserts/replaces rooms + booked-by
    rooms?: ReservationRoomInput[];
    booked_by_id?: number | null;
}

const ReservationService = {
    list: (params?: { hotelid?: number; q?: string }): Promise<ApiResponse<Reservation[]>> =>
        HttpClient.get<ApiResponse<Reservation[]>>('/reservations', { params }),

    get: (id: number): Promise<ApiResponse<Reservation>> =>
        HttpClient.get<ApiResponse<Reservation>>(`/reservations/${id}`),

    getNextNumber: (params?: { hotelid?: number }): Promise<ApiResponse<{ reservation_no: string }>> =>
        HttpClient.get<ApiResponse<{ reservation_no: string }>>('/reservations/next-number', { params }),

    // Single call: inserts hotel_reservations + reservation_rooms (each item
    // in payload.rooms) + reservation_booked_by (if payload.booked_by_id set)
    create: (payload: ReservationPayload): Promise<ApiResponse<Reservation>> =>
        HttpClient.post<ApiResponse<Reservation>>('/reservations', payload),

    // Single call: updates hotel_reservations and replaces its rooms +
    // booked-by link in one transaction (old rows deleted, new ones inserted)
    update: (id: number, payload: ReservationPayload): Promise<ApiResponse<Reservation>> =>
        HttpClient.put<ApiResponse<Reservation>>(`/reservations/${id}`, payload),

    // Deletes the reservation together with its rooms + booked-by link
    remove: (id: number): Promise<ApiResponse<null>> =>
        HttpClient.delete<ApiResponse<null>>(`/reservations/${id}`)
};

export default ReservationService;