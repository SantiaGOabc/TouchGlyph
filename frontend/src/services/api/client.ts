import axios from 'axios';

export function createApiClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        const isAuthPage = window.location.pathname === '/login';
        if (!isAuthPage) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}
