import type { Fixture } from '../fixtures/types.js';

/** 视口尺寸 */
export interface Viewport {
  width: number;
  height: number;
}

/** 截图结果 */
export interface Screenshot {
  /** 图片 PNG Buffer */
  buffer: Buffer;
  /** 实际宽度 */
  width: number;
  /** 实际高度 */
  height: number;
  /** 产生此截图的 provider 名 */
  provider: string;
}

/** 截图采集器接口 — 每个平台一个实现 */
export interface ScreenshotProvider {
  /** 平台标识 */
  readonly name: ProviderName;

  /** 此 provider 当前是否可用（iOS/Android 未实现时为 false） */
  readonly available: boolean;

  /** 初始化资源，全局调一次 */
  setup(): Promise<void>;

  /** 释放资源，全局调一次 */
  teardown(): Promise<void>;

  /** 给定 fixture 和视口，返回截图 */
  capture(fixture: Fixture, viewport: Viewport): Promise<Screenshot>;
}

/** 所有支持的 provider 名称 */
export type ProviderName =
  | 'chromium'
  | 'lynx-web'
  | 'lynx-ios'
  | 'lynx-android';

/** Provider 未实现错误 */
export class ProviderNotImplementedError extends Error {
  constructor(providerName: string) {
    super(`Provider "${providerName}" is not implemented yet`);
    this.name = 'ProviderNotImplementedError';
  }
}
