import axios from 'axios'

const ErrorCodeMessages: { [key: number]: string } = {
  401: 'Invalid credentials',
  403: 'Access Forbidden',
  404: 'Resource or page not found',
}

function HttpClient() {
  const _errorHandler = (error: any) =>
    Promise.reject(
      Object.keys(ErrorCodeMessages).includes(error?.response?.status)
        ? ErrorCodeMessages[error.response.status]
        : error.response.data && error.response.data.message
          ? error.response.data.message
          : error.message || error,
    )

  const _httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 6000,
  headers: {
    'Content-Type': 'application/json',
  },
})


  _httpClient.interceptors.response.use((response) => {
    return response.data
  }, _errorHandler)

  return {
    get: <T = any>(url: string, config?: any): Promise<T> => _httpClient.get(url, config),
    post: <T = any>(url: string, data: any, config?: any): Promise<T> => _httpClient.post(url, data, config),
    patch: <T = any>(url: string, config?: any): Promise<T> => _httpClient.patch(url, config),
    put: <T = any>(url: string, config?: any): Promise<T> => _httpClient.put(url, config),
    delete: <T = any>(url: string, config?: any): Promise<T> => _httpClient.delete(url, config),
    client: _httpClient,
  }
}

export default HttpClient()
