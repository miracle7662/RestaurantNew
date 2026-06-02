import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

export interface Feature {
  feature_id: number
  feature: string
  description?: string
  status: number
  created_by_id: number
  created_date: string
  updated_by_id: number
  updated_date: string
}

export interface FeaturePayload {
  feature_id?: number
  feature: string
  description?: string
  status: number
  created_by_id?: number
  created_date?: string
  updated_by_id?: number
  updated_date?: string
}

const FeatureService = {
  list: (params?: { q?: string }): Promise<ApiResponse<Feature[]>> =>
    HttpClient.get<ApiResponse<Feature[]>>('/features', { params }),

  create: (payload: FeaturePayload): Promise<ApiResponse<Feature>> =>
    HttpClient.post<ApiResponse<Feature>>('/features', payload),

  update: (id: number, payload: FeaturePayload): Promise<ApiResponse<Feature>> =>
    HttpClient.put<ApiResponse<Feature>>(`/features/${id}`, payload),

  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/features/${id}`)
}

export default FeatureService