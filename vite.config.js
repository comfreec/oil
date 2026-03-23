import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/datago': {
        target: 'https://api.data.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/datago/, ''),
      },
    },
  },
})
