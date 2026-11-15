import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', 'bin/**', 'dist/**'],
    testTimeout: 20000,
    hookTimeout: 20000,
    pool: 'forks',
    reporters: ['default'],
  },
})
