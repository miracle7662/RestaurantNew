import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

export interface Fragment {
  fragment_id: number
  name: string
  status: number
  created_date: string
  updated_date: string
}

export interface FragmentPayload {
  fragment_id?: number
  name: string
  status: number
  created_date?: string
  updated_date?: string
}

const FragmentService = {
  list: (params?: { q?: string }): Promise<ApiResponse<Fragment[]>> =>
    HttpClient.get<ApiResponse<Fragment[]>>('/fragments', { params }),

  create: (payload: FragmentPayload): Promise<ApiResponse<Fragment>> =>
    HttpClient.post<ApiResponse<Fragment>>('/fragments', payload),

  update: (id: number, payload: FragmentPayload): Promise<ApiResponse<Fragment>> =>
    HttpClient.put<ApiResponse<Fragment>>(`/fragments/${id}`, payload),

  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/fragments/${id}`)
}

export default FragmentService