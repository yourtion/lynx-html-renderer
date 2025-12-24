import { createVitestConfig } from '@lynx-js/react/testing-library/vitest-config';
import { defineConfig, mergeConfig } from 'vitest/config';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const defaultConfig = await createVitestConfig();
const config = defineConfig({
  resolve: {
    alias: {
      '@lynx-html-renderer': resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['tests/**/*', 'example/src/__tests__/**/*'],
    exclude: ['**/__snapshots__/**/*', '**/*.snap', '**/node_modules/**'],
  },
});

export default mergeConfig(defaultConfig, config);
