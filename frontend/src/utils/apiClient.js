import axios from 'axios';

// Vite používá import.meta.env; podpora původního CRA prefixu nahrazena proměnnou VITE_API_BASE_URL.
const baseURL = (import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:5001';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Attach Authorization header if token present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401/403 handler: clear token and redirect to login with return URL
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      try {
        localStorage.removeItem('token');
      } catch (e) {
        /* ignore storage */
      }
      if (typeof window !== 'undefined') {
        const current = window.location.pathname + window.location.search;
        if (!current.startsWith('/login')) {
          window.location.href = `/login?redirect=${encodeURIComponent(current)}`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
