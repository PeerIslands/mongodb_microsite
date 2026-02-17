import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAuthToken } from '@/utils/sessionStorage';
import { handleTokenExpiration } from '@/utils/auth';

// Extend Axios request config to include _retry property
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_TIMEOUT = 30000;

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL environment variable is not set. Please configure it in your .env file.');
}

// Track if we're currently handling token expiration to prevent multiple calls
let isHandlingTokenExpiration = false;

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available from sessionStorage
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - check if this is token expiration
          const hadToken = !!getAuthToken();
          const originalRequest = error.config as ExtendedAxiosRequestConfig;
          
          // If we had a token and got 401, it's likely expired
          if (hadToken && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;
            
            // Prevent multiple simultaneous token expiration handlers
            if (!isHandlingTokenExpiration) {
              isHandlingTokenExpiration = true;
              
              // Dispatch custom event for components to listen to
              window.dispatchEvent(new CustomEvent('token-expired', {
                detail: { message: 'Session expired. Please log in again.' }
              }));
              
              // Handle token expiration
              handleTokenExpiration();
              
              // Reset flag after delay
              setTimeout(() => {
                isHandlingTokenExpiration = false;
              }, 1000);
            }
          } else {
            // No token or retry already attempted - let component handle it
            console.error('Unauthorized:', error.response.data);
          }
          break;
        case 403:
          console.error('Forbidden:', error.response.data);
          break;
        case 404:
          console.error('Not found:', error.response.data);
          break;
        case 500:
          console.error('Server error:', error.response.data);
          break;
        default:
          console.error('API Error:', error.response.data);
      }
    } else if (error.request) {
      console.error('Network error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;

