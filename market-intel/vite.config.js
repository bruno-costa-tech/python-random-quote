import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  server: {
    proxy: {
      '/proxy/gt': {
        target: 'https://api.geckoterminal.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/proxy\/gt/, ''),
      },
      '/proxy/dex': {
        target: 'https://api.dexscreener.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/proxy\/dex/, ''),
      },
    },
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
})
