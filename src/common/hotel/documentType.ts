import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface DocumentType {
  id: number;
  document_type_name: string;
  has_front: number;
  has_back: number;
  status: number;
  created_by_id?: number;
  created_date: string;
  updated_by_id?: number;
  updated_date: string;
}

export interface DocumentTypePayload {
  document_type_name: string;
  has_front?: boolean;
  has_back?: boolean;
  status?: number;
}

const DocumentTypeService = {
  list: (params?: { status?: number }): Promise<ApiResponse<DocumentType[]>> =>
    HttpClient.get<ApiResponse<DocumentType[]>>('/document-types', { params }),

  get: (id: number): Promise<ApiResponse<DocumentType>> =>
    HttpClient.get<ApiResponse<DocumentType>>(`/document-types/${id}`),

  create: (payload: DocumentTypePayload): Promise<ApiResponse<DocumentType>> =>
    HttpClient.post<ApiResponse<DocumentType>>('/document-types', payload),

  update: (id: number, payload: DocumentTypePayload): Promise<ApiResponse<DocumentType>> =>
    HttpClient.put<ApiResponse<DocumentType>>(`/document-types/${id}`, payload),

  delete: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/document-types/${id}`)
};

export default DocumentTypeService;