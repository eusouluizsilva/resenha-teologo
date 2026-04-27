import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      output: {
        // Separa libs grandes em chunks proprios para que mudancas de codigo
        // nao invalidem o cache delas e o navegador possa baixar em paralelo.
        // Vite 8/rolldown exige funcao em vez de objeto.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('framer-motion')) return 'framer-motion'
          if (id.includes('@clerk/')) return 'clerk'
          if (id.includes('/convex/')) return 'convex'
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router-dom/')
          ) {
            return 'react-vendor'
          }
          return undefined
        },
      },
    },
  },
})
