import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import type { ScreenshotProvider, Screenshot, Viewport } from './types.js';
import type { Fixture } from '../fixtures/types.js';

/**
 * Chromium 原始 HTML 渲染 provider。
 * 将 fixture HTML 直接在浏览器中渲染并截图，作为「用户眼中的正确渲染」基准。
 */
export class ChromiumProvider implements ScreenshotProvider {
  readonly name = 'chromium' as const;
  readonly available = true;

  private browser: import('@playwright/test').Browser | null = null;

  async setup(): Promise<void> {
    this.browser = await chromium.launch();
  }

  async teardown(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
  }

  async capture(fixture: Fixture, viewport: Viewport): Promise<Screenshot> {
    if (!this.browser) {
      throw new Error('ChromiumProvider not initialized — call setup() first');
    }

    const html = await readFile(fixture.file, 'utf-8');
    const page = await this.browser.newPage({ viewport });

    try {
      await page.setContent(html, { waitUntil: 'load' });
      // 等待字体和图片渲染稳定
      await page.waitForTimeout(500);
      await page.evaluate(() => document.fonts?.ready);

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
