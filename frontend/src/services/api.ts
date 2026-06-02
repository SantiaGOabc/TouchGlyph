import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthPage = window.location.pathname === '/login';
      if (!isAuthPage) {
        window.dispatchEvent(new CustomEvent('session:expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
