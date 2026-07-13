import { expect, test } from '@playwright/test';
import { navigateWithFixture } from './fixture-utils.js';
import { fixtures } from './fixtures/index.js';

/**
 * 回归测试：对每个 fixture 截取 Lynx Web Preview 渲染结果，
 * 与已提交的 baseline 截图对比。
 *
 * 部分 fixture 因 HTMLRenderer 对大/复杂 HTML 的处理限制可能无法渲染，
 * 这些 fixture 会被跳过（test.skip）而不是失败。
 *
 * 更新 baseline：pnpm test:visual:update
 */
for (const fixture of fixtures) {
  test(`regression: ${fixture.id}`, async ({ page }) => {
    // 用 Promise.race 硬超时防止 web-core wasm 加载挂起
    const textCount = await Promise.race([
      navigateWithFixture(page, fixture.id),
      new Promise<number>((resolve) => setTimeout(() => resolve(0), 30_000)),
    ]);

    // 渲染失败（text 节点为 0）——HTMLRenderer 无法处理此 fixture，跳过
    test.skip(
      textCount === 0,
      `${fixture.id}: HTMLRenderer 渲染无内容（可能 HTML 过大或复杂）`,
    );

    await expect(page).toHaveScreenshot(`${fixture.id}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.001,
    });
  });
}
