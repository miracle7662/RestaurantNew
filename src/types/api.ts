export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data: T
  error?: string
}

export interface ApiError {
  success: false
  message: string
  error?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
