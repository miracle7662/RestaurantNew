import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

// ---------- Guest Interfaces ----------
export interface Guest {
  id?: number;
  guest_id: number;
  fragment_id: number | null;
  fragment_name?: string;
  name: string;
  organisation: string | null;
  address: string | null;
  city_id: number | null;
  city_name?: string;
  state_id: number | null;
  state_name?: string;
  country_id: number | null;
  country_name?: string;
  occupation: string | null;
  post_held: string | null;
  phone: string | null;
  mobile: string;
  email: string | null;
  website: string | null;
  purpose: string | null;
  purpose_name?: string;
  arrived_from: string | null;
  arrived_name?: string;
  departure_to: string | null;
  departure_name?: string;
  birthday: string | null;
  anniversary: string | null;
  gender: string;
  nationality_id: number | null;
  nationality?: string;
  guest_type: string | null;
  guest_type_name?: string;
  credit_allowed: number;
  company_id: number | null;
  company_name?: string;
  discount_percent?: number;
  status: number;
  hotelid: number;
  created_by_id: number | null;
  created_at: string;
  updated_by_id: number | null;
  updated_at: string;
  documents?: GuestDocument[];
}

export interface GuestPayload {
  fragment_id?: number | null;
  name: string;
  organisation?: string | null;
  address?: string | null;
  city_id?: number | null;
  state_id?: number | null;
  country_id?: number | null;
  occupation?: string | null;
  post_held?: string | null;
  phone?: string | null;
  mobile: string;
  email?: string | null;
  website?: string | null;
  purpose_id?: number | null;
  arrived_id?: number | null;
  departure_id?: number | null;
  guest_type_id?: number | null;
  purpose?: string | null;
  arrived_from?: string | null;
  departure_to?: string | null;
  guest_type?: string | null;
  birthday?: string | null;
  anniversary?: string | null;
  gender?: string;
  nationality_id?: number | null;
  credit_allowed?: number;
  company_id?: number | null;
  discount_percent?: number;
  status?: number;
  hotelid?: number;
  created_by_id?: number;
  updated_by_id?: number;
}

// ---------- Guest Document Interfaces ----------
export interface GuestDocument {
  document_id: number;
  guest_id: number;
  document_type: string;
  document_no: string;
  front_side: string | null;
  front_side_url?: string | null;
  back_side: string | null;
  back_side_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestDocumentPayload {
  document_type: string;
  document_no: string;
  front_side?: File | string | null;
  back_side?: File | string | null;
}

// ---------- Combined Service ----------
const GuestService = {
  // Guest endpoints
  listGuests: (params?: { hotelid?: number; q?: string }): Promise<ApiResponse<Guest[]>> =>
    HttpClient.get<ApiResponse<Guest[]>>('/guests', { params }),

  list: (params?: { hotelid?: number; q?: string }): Promise<ApiResponse<Guest[]>> =>
    HttpClient.get<ApiResponse<Guest[]>>('/guests', { params }),

  getGuest: (id: number): Promise<ApiResponse<Guest>> =>
    HttpClient.get<ApiResponse<Guest>>(`/guests/${id}`),

  get: (id: number): Promise<ApiResponse<Guest>> =>
    HttpClient.get<ApiResponse<Guest>>(`/guests/${id}`),

  createGuest: (payload: GuestPayload): Promise<ApiResponse<Guest>> =>
    HttpClient.post<ApiResponse<Guest>>('/guests', payload),

create: (payload: GuestPayload): Promise<ApiResponse<Guest>> => {
    // Fix hotel ID mismatch: backend expects 'hotelid', frontend uses 'mst_hotelid'
    const requestPayload: any = { ...payload };
    if (requestPayload.mst_hotelid !== undefined) {
      requestPayload.hotelid = requestPayload.mst_hotelid;
      delete requestPayload.mst_hotelid; // Clean up inconsistent field
    }
    return HttpClient.post<ApiResponse<Guest>>('/guests', requestPayload);
  },

  updateGuest: (id: number, payload: GuestPayload): Promise<ApiResponse<Guest>> =>
    HttpClient.put<ApiResponse<Guest>>(`/guests/${id}`, payload),

  update: (id: number, payload: GuestPayload): Promise<ApiResponse<Guest>> =>
    HttpClient.put<ApiResponse<Guest>>(`/guests/${id}`, payload),

  deleteGuest: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/guests/${id}`),

  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/guests/${id}`),

  // Document endpoints with file upload support
  listDocuments: (guestId: number): Promise<ApiResponse<GuestDocument[]>> =>
    HttpClient.get<ApiResponse<GuestDocument[]>>(`/guests/${guestId}/documents`),

  getDocument: (guestId: number, documentId: number): Promise<ApiResponse<GuestDocument>> =>
    HttpClient.get<ApiResponse<GuestDocument>>(`/guests/${guestId}/documents/${documentId}`),

  createDocument: (guestId: number, payload: GuestDocumentPayload): Promise<ApiResponse<GuestDocument>> => {
    const formData = new FormData();
    formData.append('document_type', payload.document_type);
    formData.append('document_no', payload.document_no);
    if (payload.front_side instanceof File) formData.append('front_side', payload.front_side);
    if (payload.back_side instanceof File) formData.append('back_side', payload.back_side);
    
    return HttpClient.post<ApiResponse<GuestDocument>>(`/guests/${guestId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  updateDocument: (guestId: number, documentId: number, payload: GuestDocumentPayload): Promise<ApiResponse<GuestDocument>> => {
    const formData = new FormData();
    if (payload.document_type) formData.append('document_type', payload.document_type);
    if (payload.document_no) formData.append('document_no', payload.document_no);
    if (payload.front_side instanceof File) formData.append('front_side', payload.front_side);
    if (payload.back_side instanceof File) formData.append('back_side', payload.back_side);
    
    return HttpClient.put<ApiResponse<GuestDocument>>(`/guests/${guestId}/documents/${documentId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  deleteDocument: (guestId: number, documentId: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/guests/${guestId}/documents/${documentId}`)
};

export default GuestService;