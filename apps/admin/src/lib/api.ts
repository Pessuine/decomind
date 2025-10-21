import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE || '/api';

const client = axios.create({
  baseURL: apiBase,
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
