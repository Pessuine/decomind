import { defineStore } from 'pinia';
import axios from 'axios';

interface LoginPayload {
  password: string;
  totp: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('admin_token') || ''
  }),
  getters: {
    isAuthed: (state) => Boolean(state.token)
  },
  actions: {
    async login(payload: LoginPayload) {
      const { data } = await axios.post('/admin/login', payload);
      this.token = data.token;
      localStorage.setItem('admin_token', this.token);
    },
    logout() {
      this.token = '';
      localStorage.removeItem('admin_token');
    }
  }
});

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers['x-admin-token'] = token;
  }
  const base = import.meta.env.VITE_ADMIN_API || window.__ADMIN_API__ || '/';
  config.baseURL = config.baseURL || base;
  return config;
});
