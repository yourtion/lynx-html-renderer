import { createVitestConfig } from '@lynx-js/react/testing-library/vitest-config';
import { defineConfig, mergeConfig } from 'vitest/config';

const defaultConfig = await createVitestConfig();
const config = defineConfig({
  test: {
    include: ['src/__tests__/**/*', 'example/src/__tests__/**/*'],
    exclude: ['**/__snapshots__/**/*', '**/*.snap', '**/node_modules/**'],
  },
});

export default mergeConfig(defaultConfig, config);
