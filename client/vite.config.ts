import { defineConfig } from 'vite';

export default defineConfig({
  // Serve d:\work\demoSlot\assets directly (available at /sprites/...)
  publicDir: '../assets',
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/healthz': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
});
