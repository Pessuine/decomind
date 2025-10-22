import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "https://api.example.com",
  timeout: 10000,
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.error?.message || "加载失败，请重试";
    return Promise.reject(new Error(message));
  }
);

export default api;
