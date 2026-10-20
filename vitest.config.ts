/// <reference types="vitest/globals" />
/// <reference types="node" />

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['server/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/main.tsx',
        'src/vite-env.d.ts',
        '**/*.types.ts',
        '**/*.schema.ts',
        'server/config/env.ts',
      ],
    },
    passWithNoTests: true,
    testTimeout: 30000,
  },
});
