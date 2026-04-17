import axios from 'axios';
import { AppConfig } from '../../types/config';
import { getAPIUrl } from '../../config';

let currentConfig: AppConfig | null = null;

// Global axios instance with dynamic baseURL
const api = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

export const configureBackend = (config: AppConfig) => {
  currentConfig = config;
  
  // Set dynamic baseURL from config
  api.defaults.baseURL = getAPIUrl(config);
  
  console.log(`🔗 Axios configured: ${api.defaults.baseURL}/api`);
  
  // Auth interceptor
  api.interceptors.request.use(
    (request) => {
      const token = localStorage.getItem('token');
      if (token) {
        request.headers.Authorization = `Bearer ${token}`;
      }
      return request;
    },
    (error) => Promise.reject(error)
  );
  
  // Response interceptor for token refresh/401
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        // Could redirect to login or refresh token here
        window.location.href = '/auth/minimal/login';
      }
      return Promise.reject(error);
    }
  );
};

// Export configured instance
export default api;

// Getter for current config
export const getCurrentConfig = () => currentConfig;
