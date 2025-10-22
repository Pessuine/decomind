import { defineStore } from "pinia";
import api from "@/api/client";

export const useAuthStore = defineStore("auth", {
  state: () => ({ isAuthenticated: false, loading: false, error: "" }),
  actions: {
    async login(password: string) {
      this.loading = true;
      this.error = "";
      try {
        await api.post("/v1/admin/login", { password });
        this.isAuthenticated = true;
        return true;
      } catch (err: any) {
        this.error = err.message || "登录失败";
        this.isAuthenticated = false;
        return false;
      } finally {
        this.loading = false;
      }
    },
    async logout() {
      await api.post("/v1/admin/logout");
      this.isAuthenticated = false;
    },
    async check() {
      try {
        await api.get("/v1/admin/overview");
        this.isAuthenticated = true;
        return true;
      } catch {
        this.isAuthenticated = false;
        return false;
      }
    },
  },
});
