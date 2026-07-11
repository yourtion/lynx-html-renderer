// fixture-utils.ts
// Provider 和回归测试共用的 fixture 注入 + 页面导航 + 渲染等待逻辑

import type { Page } from '@playwright/test';

const WEB_PREVIEW_BASE =
  'http://localhost:3000/__web_preview?casename=index.web.bundle';

/**
 * 检查 shadow DOM 中是否已渲染出实际文本内容（不只是 skeleton）。
 */
async function hasRenderedContent(page: Page): Promise<number> {
  return page.evaluate(() => {
    const shadow = document.querySelector('lynx-view')?.shadowRoot;
    if (!shadow) return 0;
    return shadow.querySelectorAll('[lynx-tag="text"], [lynx-tag="raw-text"]')
      .length;
  });
}

/**
 * 设置 localStorage globalProps 注入 fixture id，导航到 Web Preview，
 * 等待 web-core 渲染出实际内容（shadow DOM 中出现 text 节点）。
 *
 * @returns 渲染的 text 节点数量（0 表示渲染失败）
 */
export async function navigateWithFixture(
  page: Page,
  fixtureId: string,
): Promise<number> {
  // web-core 从 localStorage key 'lynx-web-core-global-props' 读取 globalProps
  await page.addInitScript(`
    localStorage.setItem('lynx-web-core-global-props', ${JSON.stringify(JSON.stringify({ fixture: fixtureId }))});
  `);

  // goto 可能因 web-core wasm 加载缓慢而卡住，设置超时
  // 用 'commit' 而非 'domcontentloaded'，后者在 COEP 环境下可能永不触发
  try {
    await page.goto(WEB_PREVIEW_BASE, {
      waitUntil: 'commit',
      timeout: 15_000,
    });
  } catch {
    return 0;
  }

  // 等待 web-core 加载并渲染出 lynx-view 元素
  try {
    await page.waitForSelector('lynx-view', { timeout: 10_000 });
  } catch {
    return 0;
  }

  // 等待 shadow DOM 中出现实际的文本内容节点
  // 注意：部分大/复杂 fixture 可能因 HTMLRenderer 限制无法渲染，
  // 此时等待超时后返回 0，调用方应跳过该 fixture
  try {
    await page.waitForFunction(
      () => {
        const shadow = document.querySelector('lynx-view')?.shadowRoot;
        if (!shadow) return false;
        return (
          shadow.querySelectorAll('[lynx-tag="text"], [lynx-tag="raw-text"]')
            .length > 0
        );
      },
      { timeout: 10_000 },
    );
  } catch {
    // 渲染超时——检查 page 是否仍然可用
    if (page.isClosed()) return 0;
    try {
      const count = await hasRenderedContent(page);
      if (count === 0) return 0;
    } catch {
      return 0;
    }
  }

  // 等待渲染稳定（图片加载、布局计算）
  await page.waitForTimeout(2000);
  return hasRenderedContent(page);
}

/**
 * 测量 lynx-view Shadow DOM 内实际内容的完整高度。
 * Playwright 的 fullPage 看不到 shadow 内容，需要手动测量后扩展视口。
 */
export async function measureShadowContentHeight(page: Page): Promise<number> {
  return page.evaluate(() => {
    const lynxView = document.querySelector('lynx-view');
    const shadow = lynxView?.shadowRoot;
    if (!shadow) return 0;
    let maxBottom = 0;
    for (const el of shadow.querySelectorAll('*')) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom > maxBottom) maxBottom = rect.bottom;
    }
    const viewRect = lynxView?.getBoundingClientRect();
    if (viewRect && viewRect.bottom > maxBottom) maxBottom = viewRect.bottom;
    return Math.ceil(maxBottom);
  });
}
