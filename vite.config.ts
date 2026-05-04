import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    createHtmlPlugin({
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@convex': path.resolve(__dirname, './convex'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Mapa simples lib -> chunk. Cada bucket ganha seu próprio bundle para
        // que mudanças de código de aplicação não invalidem o cache da lib.
        // Vite 8/rolldown exige função em vez de objeto. Casamos por substring
        // de path; libs que não aparecem aqui herdam o split padrão do rollup.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          const buckets: Record<string, string[]> = {
            'react-vendor': ['/react/', '/react-dom/', '/react-router-dom/'],
            clerk: ['@clerk/'],
            convex: ['node_modules/convex/'],
            'framer-motion': ['framer-motion'],
            markdown: ['react-markdown', 'remark-gfm', 'rehype-sanitize', 'marked'],
          }
          for (const [chunk, patterns] of Object.entries(buckets)) {
            if (patterns.some((p) => id.includes(p))) return chunk
          }
          return undefined
        },
      },
    },
  },
})
