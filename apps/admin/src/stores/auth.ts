import { defineStore } from 'pinia';
import api from '../lib/api';

interface LoginPayload {
  password: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('admin_token') || '',
    loading: false,
    error: '',
  }),
  actions: {
    async login(payload: LoginPayload) {
      this.loading = true;
      this.error = '';
      try {
        const res = await api.post('/admin/login', payload);
        this.token = res.data.data.token;
        localStorage.setItem('admin_token', this.token);
      } catch (err) {
        this.error = '登录失败，请检查口令';
        throw err;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.token = '';
      localStorage.removeItem('admin_token');
    },
  },
});
