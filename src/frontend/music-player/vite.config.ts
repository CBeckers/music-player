import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'cadebeckers.com',
      'www.cadebeckers.com'
    ],
    cors: true
  }
})
