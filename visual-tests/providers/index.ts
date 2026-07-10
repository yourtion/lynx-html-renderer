import type { ScreenshotProvider } from './types.js';
import { ChromiumProvider } from './chromium-provider.js';
import { LynxWebProvider } from './lynx-web-provider.js';
import { LynxIOSProvider } from './lynx-ios-provider.js';
import { LynxAndroidProvider } from './lynx-android-provider.js';

/**
 * 创建所有 provider 实例。
 *
 * @param lynxWebBaseUrl rspeedy dev server 的 Web Preview URL，
 *   仅 LynxWebProvider 需要。形如 http://localhost:3000/__web_preview
 */
export function createProviders(lynxWebBaseUrl: string): ScreenshotProvider[] {
  return [
    new ChromiumProvider(),
    new LynxWebProvider(lynxWebBaseUrl),
    new LynxIOSProvider(),
    new LynxAndroidProvider(),
  ];
}
