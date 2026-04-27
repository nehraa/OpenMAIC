import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@shared': resolve(__dirname, '../shared')
    }
  },
  test: {
    include: ['lib/**/*.test.ts'],
    setupFiles: ['./lib/test-setup.ts'],
    globals: true
  }
});