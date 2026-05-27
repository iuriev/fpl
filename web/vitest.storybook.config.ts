import { defineConfig } from 'vitest/config';
import path from 'path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig(async () => ({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    name: 'storybook',
    globals: true,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
    setupFiles: ['@storybook/addon-vitest/internal/setup-file'],
  },
  plugins: [
    ...(await storybookTest({ configDir: path.resolve(__dirname, '.storybook') })),
  ],
}));
