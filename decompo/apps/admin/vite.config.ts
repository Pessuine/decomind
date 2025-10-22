import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: Number(process.env.VITE_ADMIN_PORT || 4174),
    host: "0.0.0.0",
  },
});
