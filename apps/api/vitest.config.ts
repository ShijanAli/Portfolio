import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    env: { CRON_SECRET: 'test-cron-secret-0123456789' },
    include: ['src/**/*.test.ts'],
    fileParallelism: false,
  },
});
