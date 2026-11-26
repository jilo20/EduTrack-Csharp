import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Requests to /api go to the C# API, so the browser never has a cross-origin (CORS) problem in development.
    // EDUTRACK_API overrides the address (e.g. a test API on another port); the default is the normal API.
    proxy: {
      '/api': process.env.EDUTRACK_API || 'http://localhost:5025',
    },
  },
})
