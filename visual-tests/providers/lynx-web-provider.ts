import { chromium } from '@playwright/test';
import type { ScreenshotProvider, Screenshot, Viewport } from './types.js';
import type { Fixture } from '../fixtures/types.js';

/**
 * Lynx Web Preview provider。
 * 通过 rspeedy dev server 的 /__web_preview 路径渲染 Lynx 组件。
 * App.tsx 根据 ?fixture=<id> query param 加载对应 HTML。
 */
export class LynxWebProvider implements ScreenshotProvider {
  readonly name = 'lynx-web' as const;
  readonly available = true;

  private browser: import('@playwright/test').Browser | null = null;
  private baseUrl: string;

  /**
   * @param baseUrl rspeedy dev server 的 Web Preview 基础 URL
   *   形如 http://localhost:3000/__web_preview
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
      // 通过 query param 指定 fixture，App.tsx 会 fetch 并渲染
      const url = `${this.baseUrl}?fixture=${fixture.id}`;
      await page.goto(url, { waitUntil: 'networkidle' });

      // 等待 web-core (wasm) 加载并渲染出元素
      await page.waitForFunction(
        () => {
          const root = document.getElementById('root');
          return root && root.children.length > 0;
        },
        { timeout: 30_000 },
      );

      // 等待渲染稳定（web-core 异步渲染）
      await page.waitForTimeout(1000);

      const buf = await page.screenshot({ fullPage: true, type: 'png' });

      return {
        buffer: buf,
        width: viewport.width,
        height: viewport.height,
        provider: this.name,
      };
    } finally {
      await page.close();
    }
  }
}
