import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 402) {
      window.dispatchEvent(new CustomEvent('paywall', { detail: error.response.data }));
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (error, fallback = 'Something went wrong.') =>
  error?.response?.data?.message || fallback;
