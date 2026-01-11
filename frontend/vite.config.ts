import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy RPC requests to Casper testnet to avoid CORS issues
      '/rpc': {
        target: 'https://node.testnet.casper.network',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})
