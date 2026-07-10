import { test, expect } from '@playwright/test';
import { fixtures } from './fixtures/index.js';

/**
 * 回归测试：对每个 fixture 截取 Lynx Web Preview 渲染结果，
 * 与已提交的 baseline 截图对比。
 *
 * 更新 baseline：pnpm test:visual:update
 */
const WEB_PREVIEW_BASE = 'http://localhost:3000/__web_preview?casename=index.web.bundle';

for (const fixture of fixtures) {
  test(`regression: ${fixture.id}`, async ({ page }) => {
    await page.goto(`${WEB_PREVIEW_BASE}&fixture=${fixture.id}`, {
      waitUntil: 'networkidle',
    });

    // 等待 web-core 渲染出元素（内容在 lynx-view 的 Shadow DOM 中）
    await page.waitForFunction(
      () => {
        const lynxView = document.querySelector('lynx-view');
        return lynxView?.shadowRoot?.children.length > 1;
      },
      { timeout: 30_000 },
    );

    // 等待渲染稳定
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot(`${fixture.id}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
}
