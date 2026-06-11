import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
  server: {
    proxy: {
      // Redirige todas las peticiones bajo /api/student al microservicio de estudiantes
      '/api/student': {
        target: 'http://127.0.0.1:5003',
        changeOrigin: true,
        secure: false,
      },
      // Redirige todas las peticiones bajo /api/teacher al microservicio de profesores
      '/api/teacher': {
        target: 'http://127.0.0.1:5002',
        changeOrigin: true,
        secure: false,
      },
      // Redirige todas las peticiones bajo /api/admin al microservicio de administración
      '/api/admin': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      },
      // Redirige todas las peticiones bajo /api/devices al microservicio de dispositivos
      '/api/devices': {
        target: 'http://127.0.0.1:5004',
        changeOrigin: true,
        secure: false,
      },
      // Health check al user_service
      '/api/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      // El resto de peticiones /api/* van al user_service (login, registro, etc.)
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})