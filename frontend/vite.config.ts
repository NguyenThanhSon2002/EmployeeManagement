import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8080',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.warn('[vite proxy] Backend is not reachable at http://127.0.0.1:8080:', err.message);
            try {
              if (
                res &&
                'writeHead' in res &&
                typeof res.writeHead === 'function' &&
                !res.headersSent &&
                !('destroyed' in res && res.destroyed) &&
                !('writableEnded' in res && res.writableEnded)
              ) {
                res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(
                  JSON.stringify({
                    success: false,
                    error: {
                      code: 'BACKEND_UNAVAILABLE',
                      message: 'Backend server is currently unavailable. Please ensure Spring Boot is running on port 8080.',
                    },
                  })
                );
              }
            } catch {
              // Ignore exception if socket/response was closed concurrently
            }
          });
        },
      },
      '/uploads': {
        target: process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
});
