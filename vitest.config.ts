import { defineConfig } from 'vitest/config'
import path from 'path'

// Item 12 da auditoria 2026-05-04: Vitest pra cobrir helpers críticos.
// Foco em pure functions que rodam em todo path crítico (slugs, validators,
// admin gating, segurança de identity check). Mutations Convex de full
// integration ficam pra próxima rodada com convex-test.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['convex/**/*.test.ts', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    globals: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@convex': path.resolve(__dirname, './convex'),
    },
  },
})
