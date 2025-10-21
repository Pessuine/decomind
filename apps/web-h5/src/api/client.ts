import axios from 'axios';

const runtimeBase = (window as any).__API_BASE__ || '/';
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || runtimeBase
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default client;
