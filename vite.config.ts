import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for Roof-ER Learning Generator
// IMPORTANT: Railway deployment requires VITE_GEMINI_API_KEY env var
// This will be automatically embedded at build time by Vite
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
