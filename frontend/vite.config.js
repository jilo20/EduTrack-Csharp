import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Requests to /api go to the C# API, so the browser never has a cross-origin (CORS) problem in development.
    proxy: {
      '/api': 'http://localhost:5025',
    },
  },
})
