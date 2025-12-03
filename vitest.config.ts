import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/persistence/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/persistence/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@core': resolve(__dirname, './src/core'),
      '@game': resolve(__dirname, './src/game'),
      '@renderer': resolve(__dirname, './src/renderer'),
      '@ui': resolve(__dirname, './src/ui'),
      '@persistence': resolve(__dirname, './src/persistence'),
    },
  },
})
