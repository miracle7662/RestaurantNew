// src/common/api/hotelRegistrations.ts
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface HotelRegistration {
  mst_hotelid: number;
  hotel_name: string;
  brand_name: string | null;
  email: string;
  mobile: string | null;
  whatsappno: string | null;
  address: string | null;
  cityid: number | null;
  stateid: number | null;
  countryid: number | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  username: string | null;
  password: string | null;
  self_online_booking_allow: number;
  partner_booking_allow: number;
  hotel_type: string | null;
  hotel_owner_name: string | null;
  hotel_owner_mobile: string | null;
  hotel_contact_person: string | null;
  hotel_contact_mobile: string | null;
  check_in_time: string;
  check_out_time: string;
  rating: number | null;
  status: number;
  hotel_gstno: string | null;
  hotel_pan_no: string | null;
  shop_act_no: string | null;
  fssai_no: string | null;
  hsn_code: string | null;
  sac_code: string | null;
  website: string | null;
  istaxable: number;
  istaxinclude: number;
  created_by_id: number | null;
  created_date: string;
  updated_by_id: number | null;
  updated_date: string;
  subscription_id: number | null;
  subscription_validity: string | null;
}

export interface HotelRegistrationPayload {
  hotel_name: string;
  brand_name?: string | null;
  email: string;
  password?: string;
  confirm_password?: string;
  mobile?: string | null;
  whatsappno?: string | null;
  address?: string | null;
  cityid?: number | null;
  stateid?: number | null;
  countryid?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  username?: string | null;
  self_online_booking_allow?: number;
  partner_booking_allow?: number;
  hotel_type?: string | null;
  hotel_owner_name?: string | null;
  hotel_owner_mobile?: string | null;
  hotel_contact_person?: string | null;
  hotel_contact_mobile?: string | null;
  check_in_time?: string;
  check_out_time?: string;
  rating?: number | null;
  status?: number;
  hotel_gstno?: string | null;
  hotel_pan_no?: string | null;
  shop_act_no?: string | null;
  fssai_no?: string | null;
  hsn_code?: string | null;
  sac_code?: string | null;
  website?: string | null;
  istaxable?: number;
  istaxinclude?: number;
  subscription_id?: number | null;
  subscription_validity?: string | null;
}

const HotelRegistrationService = {
  list: (params?: { q?: string }): Promise<ApiResponse<HotelRegistration[]>> =>
    HttpClient.get<ApiResponse<HotelRegistration[]>>('/hotel-registrations', { params }),

  // NEW: Get a single hotel by ID
  get: (id: number): Promise<ApiResponse<HotelRegistration>> =>
    HttpClient.get<ApiResponse<HotelRegistration>>(`/hotel-registrations/${id}`),

  create: (payload: HotelRegistrationPayload): Promise<ApiResponse<HotelRegistration>> =>
    HttpClient.post<ApiResponse<HotelRegistration>>('/hotel-registrations', payload),

  update: (id: number, payload: HotelRegistrationPayload): Promise<ApiResponse<HotelRegistration>> =>
    HttpClient.put<ApiResponse<HotelRegistration>>(`/hotel-registrations/${id}`, payload),

  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/hotel-registrations/${id}`),
};

export default HotelRegistrationService;