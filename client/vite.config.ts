import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'http://localhost:5100/api';
  const proxyTarget = env.VITE_PROXY_TARGET || apiUrl.replace(/\/api\/?$/, '');

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true
        },
        '/socket.io': {
          target: proxyTarget,
          ws: true,
          changeOrigin: true
        }
      }
    }
  }
})
