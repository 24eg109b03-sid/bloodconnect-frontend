import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const frontendRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: frontendRoot,
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/users': process.env.VITE_API_TARGET || 'http://localhost:8080',
      '/requests': process.env.VITE_API_TARGET || 'http://localhost:8080',
      '/donations': process.env.VITE_API_TARGET || 'http://localhost:8080'
    }
  },
  build: {
    outDir: resolve(frontendRoot, '../src/main/resources/static'),
    emptyOutDir: true
  }
});