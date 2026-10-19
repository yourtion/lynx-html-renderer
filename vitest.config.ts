import { realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createVitestConfig } from '@lynx-js/react/testing-library/vitest-config';
import { defineConfig, mergeConfig } from 'vitest/config';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
// Follow the node_modules symlink (e.g. in a Stryker sandbox) to the real
// project root, so the Vite dev server allows serving Lynx testing-library
// setup files that resolve outside the current working directory.
const realProjectRoot = dirname(
  realpathSync(resolve(__dirname, 'node_modules')),
);

const defaultConfig = await createVitestConfig();
const config = defineConfig({
  resolve: {
    alias: {
      '@lynx-html-renderer': resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      allow: [realProjectRoot],
    },
  },
  test: {
    include: ['tests/**/*', 'example/src/__tests__/**/*'],
    exclude: [
      '**/__snapshots__/**/*',
      '**/*.snap',
      '**/node_modules/**',
      '**/baselines.config.ts',
      'tests/types/**',
    ],
  },
});

export default mergeConfig(defaultConfig, config);
