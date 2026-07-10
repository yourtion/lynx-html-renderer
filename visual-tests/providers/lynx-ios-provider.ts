import type { ScreenshotProvider, Screenshot, Viewport } from './types.js';
import { ProviderNotImplementedError } from './types.js';
import type { Fixture } from '../fixtures/types.js';

/**
 * Lynx iOS 原生渲染 provider（预留）。
 *
 * 未来接入路径：
 * 1. Xcode 模拟器 + xcrun simctl io booted screenshot（macOS only）
 * 2. 云真机服务（AWS Device Farm / BrowserStack）
 * 3. LynxExplorer + WebDriverAgent
 */
export class LynxIOSProvider implements ScreenshotProvider {
  readonly name = 'lynx-ios' as const;
  readonly available = false;

  async setup(): Promise<void> {
    throw new ProviderNotImplementedError(this.name);
  }

  async teardown(): Promise<void> {
    // no-op
  }

  async capture(_fixture: Fixture, _viewport: Viewport): Promise<Screenshot> {
    throw new ProviderNotImplementedError(this.name);
  }
}
