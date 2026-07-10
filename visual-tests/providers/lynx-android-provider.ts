import type { ScreenshotProvider, Screenshot, Viewport } from './types.js';
import { ProviderNotImplementedError } from './types.js';
import type { Fixture } from '../fixtures/types.js';

/**
 * Lynx Android 原生渲染 provider（预留）。
 *
 * 未来接入路径：
 * 1. Android 模拟器 + adb exec-out screencap -p
 * 2. 云真机服务
 * 3. LynxExplorer + UIAutomator
 */
export class LynxAndroidProvider implements ScreenshotProvider {
  readonly name = 'lynx-android' as const;
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
