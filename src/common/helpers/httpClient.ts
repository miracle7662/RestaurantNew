import axios, { AxiosError, AxiosRequestConfig } from "axios";

const _httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

/* ───────── Request Interceptor ───────── */

_httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ───────── Response Interceptor ───────── */

const errorHandler = (error: AxiosError<{ message?: string }>) => {
  const status = error.response?.status;

  const message =
    (status === 401 && "Invalid credentials") ||
    (status === 403 && "Access forbidden") ||
    (status === 404 && "Resource not found") ||
    error.response?.data?.message ||
    error.message ||
    "Something went wrong";

  return Promise.reject(new Error(message));
};

_httpClient.interceptors.response.use(
  (response) => response.data,
  errorHandler
);

/* ───────── HttpClient Wrapper ───────── */

export const HttpClient = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    _httpClient.get(url, config),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    _httpClient.post(url, data, config),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    _httpClient.put(url, data, config),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    _httpClient.patch(url, data, config),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    _httpClient.delete(url, config),

  client: _httpClient,
};

export default HttpClient;
