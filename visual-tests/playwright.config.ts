import { defineConfig, devices } from '@playwright/test';

/**
 * 回归模式配置：
 * 启动 rspeedy dev server，用 LynxWebProvider 截图，
 * 与 __screenshots__/ 下已提交的 baseline 做 toHaveScreenshot 对比。
 */
export default defineConfig({
  testDir: '.',
  testMatch: 'regression.spec.ts',

  // 截图 baseline 存放目录
  snapshotPathTemplate: '{snapshotDir}/{testName}/{projectName}.png',
  snapshotDir: '__screenshots__',

  // webServer：自动启动 rspeedy dev
  webServer: {
    command: 'rspeedy dev',
    port: 3000,
    cwd: '../example',
    env: { PORT: '3000' },
    reuseExistingServer: true,
    timeout: 120_000,
  },

  use: {
    viewport: { width: 375, height: 812 },
  },

  projects: [
    {
      name: 'lynx-web',
      use: {
        ...devices['Desktop Chrome'],
        // COOP/COEP for web-core SharedArrayBuffer
        launchOptions: {
          args: ['--cross-origin-isolate'],
        },
      },
    },
  ],
});
