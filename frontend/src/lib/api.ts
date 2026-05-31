import axios from 'axios';
import { getAuthToken, clearStoredSession } from './auth-token';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(
        new Error('Request timed out. Make sure all services are running (npm run dev).')
      );
    }

    if (!error.response) {
      return Promise.reject(
        new Error('Cannot reach API Gateway. Start services with: npm run dev')
      );
    }

    const requestUrl = error.config?.url || '';
    const isAuthAttempt =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/signup') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/verify-otp') ||
      requestUrl.includes('/auth/resend-otp');

    const hadAuthHeader = Boolean(error.config?.headers?.Authorization);

    if (error.response?.status === 401 && !isAuthAttempt && hadAuthHeader) {
      clearStoredSession();
      window.dispatchEvent(new Event('auth:session-expired'));
    }

    return Promise.reject(error);
  }
);

export default api;
