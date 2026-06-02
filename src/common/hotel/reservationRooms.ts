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

export interface ReservationRoomPayload {
  reservation_id?: number;
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

const ReservationRoomService = {
  list: (params: { reservation_id: number }): Promise<ApiResponse<ReservationRoom[]>> =>
    HttpClient.get<ApiResponse<ReservationRoom[]>>('/reservation-rooms', { params }),

  get: (id: number): Promise<ApiResponse<ReservationRoom>> =>
    HttpClient.get<ApiResponse<ReservationRoom>>(`/reservation-rooms/${id}`),

  create: (payload: ReservationRoomPayload): Promise<ApiResponse<ReservationRoom>> =>
    HttpClient.post<ApiResponse<ReservationRoom>>('/reservation-rooms', payload),

  update: (id: number, payload: ReservationRoomPayload): Promise<ApiResponse<ReservationRoom>> =>
    HttpClient.put<ApiResponse<ReservationRoom>>(`/reservation-rooms/${id}`, payload),

  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/reservation-rooms/${id}`)
};

export default ReservationRoomService;