import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import type { Fixture } from '../fixtures/types.js';
import type { Screenshot, ScreenshotProvider, Viewport } from './types.js';

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

      // readability HTML 多数没有 viewport meta，导致内容宽度不受约束。
      // 注入 CSS 强制所有元素适配视口宽度。
      await page.addStyleTag({
        content: [
          `html { width: ${viewport.width}px !important; overflow-x: hidden !important; }`,
          `body { width: ${viewport.width}px !important; max-width: ${viewport.width}px !important; overflow-x: hidden !important; margin: 0 !important; padding: 0 !important; }`,
          `body * { max-width: ${viewport.width}px !important; box-sizing: border-box !important; }`,
          `img, video, table, pre, iframe { max-width: 100% !important; height: auto !important; }`,
          `table { table-layout: fixed !important; word-wrap: break-word !important; }`,
        ].join('\n'),
      });

      // 等待字体和图片渲染稳定
      await page.waitForTimeout(500);
      await page.evaluate(() => document.fonts?.ready);

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
