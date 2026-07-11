import { chromium } from '@playwright/test';
import sharp from 'sharp';
import type { Fixture } from '../fixtures/types.js';
import type { Screenshot, ScreenshotProvider, Viewport } from './types.js';

/**
 * Lynx Web Preview provider。
 * 通过 rspeedy dev server 的 /__web_preview 路径渲染 Lynx 组件。
 * App.tsx 通过 URL ?fixture=<id> 从编译时注册表查找对应 HTML。
 */
export class LynxWebProvider implements ScreenshotProvider {
  readonly name = 'lynx-web' as const;
  readonly available = true;

  private browser: import('@playwright/test').Browser | null = null;
  private baseUrl: string;

  /**
   * @param baseUrl rspeedy dev server 的 Web Preview 基础 URL（含 casename 参数）
   *   形如 http://localhost:3000/__web_preview?casename=index.web.bundle
   */
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async setup(): Promise<void> {
    this.browser = await chromium.launch({
      args: ['--cross-origin-isolate'],
    });
  }

  async teardown(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
  }

  async capture(fixture: Fixture, viewport: Viewport): Promise<Screenshot> {
    if (!this.browser) {
      throw new Error('LynxWebProvider not initialized — call setup() first');
    }

    const page = await this.browser.newPage({ viewport });

    try {
      // web-core 在初始化时从 localStorage 读取 globalProps（key: lynx-web-core-global-props）。
      // 在页面 JS 执行前设置此值，App 即可通过 lynx.__globalProps.fixture 读到 fixture id。
      await page.addInitScript(`
        localStorage.setItem('lynx-web-core-global-props', ${JSON.stringify(JSON.stringify({ fixture: fixture.id }))});
      `);

      await page.goto(this.baseUrl, { waitUntil: 'networkidle' });

      // 等待 web-core 渲染出元素（内容在 lynx-view 的 Shadow DOM 中）
      await page.waitForFunction(
        () => {
          const lynxView = document.querySelector('lynx-view');
          return lynxView?.shadowRoot?.children.length > 1;
        },
        { timeout: 30_000 },
      );

      // 等待渲染稳定（web-core 异步渲染）
      await page.waitForTimeout(1500);

      // web-core 用 Shadow DOM 渲染，Playwright 的 fullPage 看不到 shadow 内容高度。
      // 手动测量实际内容高度，调整视口后再截全页。
      const contentHeight = await page.evaluate(() => {
        const lynxView = document.querySelector('lynx-view');
        const shadow = lynxView?.shadowRoot;
        if (!shadow) return 0;
        let maxBottom = 0;
        for (const el of shadow.querySelectorAll('*')) {
          const rect = el.getBoundingClientRect();
          if (rect.bottom > maxBottom) maxBottom = rect.bottom;
        }
        const viewRect = lynxView?.getBoundingClientRect();
        if (viewRect && viewRect.bottom > maxBottom)
          maxBottom = viewRect.bottom;
        return Math.ceil(maxBottom);
      });

      if (contentHeight > viewport.height) {
        await page.setViewportSize({
          width: viewport.width,
          height: contentHeight,
        });
        await page.waitForTimeout(300);
      }

      const buf = await page.screenshot({ fullPage: true, type: 'png' });
      const meta = await sharp(buf).metadata();

      return {
        buffer: buf,
        width: meta.width ?? viewport.width,
        height: meta.height ?? viewport.height,
        provider: this.name,
      };
    } finally {
      await page.close();
    }
  }
}
