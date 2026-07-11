import { chromium } from '@playwright/test';
import sharp from 'sharp';
import {
  measureShadowContentHeight,
  navigateWithFixture,
} from '../fixture-utils.js';
import type { Fixture } from '../fixtures/types.js';
import type { Screenshot, ScreenshotProvider, Viewport } from './types.js';

/**
 * Lynx Web Preview provider。
 * 通过 rspeedy dev server 的 /__web_preview 路径渲染 Lynx 组件。
 * App.tsx 从 lynx.__globalProps.fixture 读 id 查编译时注册表。
 */
export class LynxWebProvider implements ScreenshotProvider {
  readonly name = 'lynx-web' as const;
  readonly available = true;

  private browser: import('@playwright/test').Browser | null = null;

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
      const textCount = await navigateWithFixture(page, fixture.id);
      if (textCount === 0) {
        throw new Error(
          `Fixture "${fixture.id}" rendered no content (HTMLRenderer may not support this HTML)`,
        );
      }

      // web-core 用 Shadow DOM 渲染，Playwright 的 fullPage 看不到 shadow 内容高度。
      // 手动测量实际内容高度，调整视口后再截全页。
      const contentHeight = await measureShadowContentHeight(page);
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
