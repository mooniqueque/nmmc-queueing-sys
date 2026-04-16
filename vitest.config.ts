import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'nmmcqueue-backend/src/**/*.spec.ts',
      'nmmcqueue-backend/src/**/*.spec.tsx',
      'packages/shared/src/**/*.spec.ts',
      'packages/shared/src/**/*.spec.tsx',
    ],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: './tests/reports/coverage/vitest',
      reporter: ['text', 'html', 'json'],
    },
  },
  resolve: {
    alias: {
      '@nmmc/types': path.resolve(__dirname, './packages/shared-types/src/index.ts'),
      '@nmmc/shared': path.resolve(__dirname, './packages/shared/src/index.ts'),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '.')],
    },
  },
});