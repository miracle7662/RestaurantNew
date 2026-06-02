import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface ReservationBookedBy {
  id: number;
  reservation_id: number;
  booked_by_id: number;
}

export interface ReservationBookedByPayload {
  reservation_id?: number;
  booked_by_id?: number;
}

const ReservationBookedByService = {
  list: (params: { reservation_id: number }): Promise<ApiResponse<ReservationBookedBy[]>> =>
    HttpClient.get<ApiResponse<ReservationBookedBy[]>>('/reservation-booked-by', { params }),

  create: (payload: ReservationBookedByPayload): Promise<ApiResponse<ReservationBookedBy>> =>
    HttpClient.post<ApiResponse<ReservationBookedBy>>('/reservation-booked-by', payload),

  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/reservation-booked-by/${id}`)
};

export default ReservationBookedByService;