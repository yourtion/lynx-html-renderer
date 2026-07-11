import { defineConfig } from '@playwright/test';

/**
 * 回归模式配置：
 * 启动 rspeedy dev server，用 LynxWebProvider 截图，
 * 与 __screenshots__/ 下已提交的 baseline 做 toHaveScreenshot 对比。
 */
export default defineConfig({
  testDir: '.',
  testMatch: 'regression.spec.ts',
  timeout: 180_000,

  // 截图 baseline 存放目录
  snapshotPathTemplate: '{snapshotDir}/{testName}/{projectName}.png',
  snapshotDir: '__screenshots__',

  // rspeedy dev 需要交互式终端（QR code），不适合 Playwright 自动管理。
  // 运行测试前请手动启动：cd example && PORT=3000 rspeedy dev
  // Playwright 会自动检测端口 3000 是否已有 server 在运行。

  use: {
    viewport: { width: 375, height: 812 },
  },

  projects: [
    {
      name: 'lynx-web',
      use: {
        // COOP/COEP for web-core SharedArrayBuffer
        // 注意：不要用 devices['Desktop Chrome']，它的 viewport 会覆盖上面的 375x812
        launchOptions: {
          args: ['--cross-origin-isolate'],
        },
      },
    },
  ],
});
