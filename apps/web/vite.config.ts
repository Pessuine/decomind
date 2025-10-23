import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 4173
  },
  build: {
    outDir: 'dist'
  },
  resolve: {
    alias: {
      shared: path.resolve(__dirname, '../../packages/shared/src')
    }
  }
});
