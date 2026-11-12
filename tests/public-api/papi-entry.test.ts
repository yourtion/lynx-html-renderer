import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as papiEntry from '@lynx-html-renderer/papi';
import { describe, expect, it } from 'vitest';
import * as rootEntry from '../../src/index';

describe('papi entries', () => {
  it('exports the direct-draw renderer surface from ./papi', () => {
    expect(papiEntry.PapiHTMLRenderer).toBeDefined();
    // buildPapiTree 是 'main thread' worklet：vitest 编译为 { _wkltId } 对象
    expect(papiEntry.buildPapiTree).toBeDefined();
    expect(papiEntry.serializeNodes).toBeTypeOf('function');
  });

  it('also re-exports the papi surface from the package root', () => {
    // 单入口偏好：使用方可从主入口直接拿到 PapiHTMLRenderer；
    // 未使用时依赖 package.json 的 sideEffects 声明被 bundler 裁剪。
    expect(rootEntry.PapiHTMLRenderer).toBeDefined();
    expect(rootEntry.serializeNodes).toBeTypeOf('function');
  });
});

describe('tree-shaking preconditions', () => {
  const pkg = JSON.parse(
    readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'),
  );

  it('marks JS modules side-effect free so unused re-exports get shaken', () => {
    // sideEffects 白名单只允许 CSS；JS 无副作用是未使用的 papi 代码可被裁剪的前提
    const sideEffects = pkg.sideEffects;
    expect(Array.isArray(sideEffects)).toBe(true);
    for (const pattern of sideEffects) {
      expect(String(pattern)).toMatch(/\.css(\.min)?['"]?$/);
    }
  });

  it('keeps ./papi as its own subpath (alternative import route)', () => {
    expect(pkg.exports['./papi']).toBeDefined();
    expect(pkg.exports['./papi'].default).toBe('./src/papi/index.ts');
  });

  it('declares the element API type package as an optional peer', () => {
    expect(pkg.peerDependencies?.['@lynx-js/type-element-api']).toBeDefined();
    expect(
      pkg.peerDependenciesMeta?.['@lynx-js/type-element-api']?.optional,
    ).toBe(true);
  });
});
