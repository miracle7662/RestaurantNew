// services/hotelSettings.ts
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface HotelUiSettings {
    hotelid: number;
    show_left_category: boolean;
    show_room_text: boolean;
    room_box_size: number;
    // Background colors
    color_vacant: string;
    color_occupied: string;
    color_cleaning: string;
    color_bill: string;
    color_reserved: string;
    color_maintenance: string;
    color_reservation: string;
    // Text colors
    text_color_vacant: string;
    text_color_occupied: string;
    text_color_cleaning: string;
    text_color_reserved: string;
    text_color_maintenance: string;
    text_color_reservation: string;
    // Border colors
    border_color_vacant: string;
    border_color_occupied: string;
    border_color_cleaning: string;
    border_color_reserved: string;
    border_color_maintenance: string;
    border_color_reservation: string;
    // Occupied warning colors
    occupied_warning_bg: string;
    occupied_warning_text: string;
    occupied_expired_bg: string;
    occupied_expired_text: string;
    dark_mode: boolean;
}

export interface HotelSettingsPayload {
    hotelid: number;
    show_left_category?: boolean;
    show_room_text?: boolean;
    room_box_size?: number;
    color_vacant?: string;
    color_occupied?: string;
    color_cleaning?: string;
    color_reserved?: string;
    color_maintenance?: string;
    color_reservation?: string;
    text_color_vacant?: string;
    text_color_occupied?: string;
    text_color_cleaning?: string;
    text_color_reserved?: string;
    text_color_maintenance?: string;
    text_color_reservation?: string;
    border_color_vacant?: string;
    border_color_occupied?: string;
    border_color_cleaning?: string;
    border_color_reserved?: string;
    border_color_maintenance?: string;
    border_color_reservation?: string;
    occupied_warning_bg?: string;
    occupied_warning_text?: string;
    occupied_expired_bg?: string;
    occupied_expired_text?: string;
    dark_mode?: boolean;
    updated_by_id?: number;
}

const HotelSettingsService = {
    get: (hotelId: number): Promise<ApiResponse<any>> =>
        HttpClient.get<ApiResponse<any>>('/hotel-settings', { params: { hotelid: hotelId } }),

    update: (payload: HotelSettingsPayload): Promise<ApiResponse<any>> =>
        HttpClient.post<ApiResponse<any>>('/hotel-settings', payload),

    reset: (hotelId: number): Promise<ApiResponse<any>> =>
        HttpClient.post<ApiResponse<any>>('/hotel-settings/reset', { hotelid: hotelId })
};

export default HotelSettingsService;