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

  _httpClient.interceptors.request.use((config) => {
    const session = localStorage.getItem('WINDOW_AUTH_SESSION')
    if (session) {
      const user = JSON.parse(session)
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`
      }
    }
    return config
  }, (error) => Promise.reject(error))

  _httpClient.interceptors.response.use((response) => {
    return response.data
  }, _errorHandler)

  return {
    get: (url: string, config = {}) => _httpClient.get(url, config),
    post: (url: string, data: any, config = {}) => _httpClient.post(url, data, config),
    patch: (url: string, config = {}) => _httpClient.patch(url, config),
    put: (url: string, data: any, config = {}) => _httpClient.put(url, data, config),
    delete: (url: string, config = {}) => _httpClient.delete(url, config),
    client: _httpClient,
  }
}

export default HttpClient()
