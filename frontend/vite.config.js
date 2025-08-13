import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/bikes': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/service-requests': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    esbuild: {
      loader: 'jsx',
      jsx: 'automatic',
      include: /src\/.*\.[jt]sx?$/,
    },
  },
});
