import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // Trocamos localhost por 127.0.0.1 para forçar IPv4
        target: 'http://127.0.0.1:7000', 
        changeOrigin: true,
        secure: false,
      },
      '/setup': {
        target: 'http://127.0.0.1:7000',
        changeOrigin: true,
        secure: false,
      },
      '/manifest.json': {
        target: 'http://127.0.0.1:7000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});