import { describe, expect, it } from 'vitest';
import { transformHTML } from '../../html-parser';
import { pluginManager } from '../../plugin-system';
import type { HtmlToLynxPlugin } from '../../typings';

describe('html-parser default transform logic', () => {
  // 保存原始插件，以便测试后恢复
  let originalPlugins: HtmlToLynxPlugin[];

  beforeEach(() => {
    // 清除所有插件，测试默认转换逻辑
    // 这里我们需要模拟一个没有插件的环境
    // 保存原始的get方法
    originalPlugins = (
      pluginManager as unknown as { plugins: HtmlToLynxPlugin[] }
    ).plugins;
    (pluginManager as unknown as { plugins: HtmlToLynxPlugin[] }).plugins = [];

    // 重置处理器注册表
    (
      pluginManager as unknown as {
        processors: Map<string, Map<string, unknown>>;
      }
    ).processors = new Map();
    // 注意：PROCESSOR_CATEGORIES是私有常量，我们直接使用已知的类别
    const categories = [
      'tagProcessor',
      'styleProcessor',
      'nodePostProcessor',
      'htmlTransformProcessor',
      'childrenTransformProcessor',
      'nodeTransformProcessor',
      'topLevelMergeProcessor',
    ];
    categories.forEach((category: string) => {
      (
        pluginManager as unknown as {
          processors: Map<string, Map<string, unknown>>;
        }
      ).processors.set(category, new Map());
    });
  });

  afterEach(() => {
    // 恢复原始插件
    (pluginManager as unknown as { plugins: HtmlToLynxPlugin[] }).plugins =
      originalPlugins;
    // 重新注册内置插件
    (
      pluginManager as unknown as { registerBuiltinPlugins: () => void }
    ).registerBuiltinPlugins();
  });

  it('should handle text nodes with default transform logic', () => {
    const result = transformHTML('Hello World');
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    // 即使没有插件，默认逻辑也应该处理文本节点
  });

  it('should handle empty text nodes correctly', () => {
    const result = transformHTML('   ');
    expect(result).toEqual([]);
  });

  it('should handle tag nodes with default transform logic', () => {
    const result = transformHTML('<div>Content</div>');
    expect(result).toEqual([]); // 默认逻辑没有插件时应该返回空数组
  });

  it('should handle unknown tags with default transform logic', () => {
    const result = transformHTML('<unknown-tag>Content</unknown-tag>');
    expect(result).toEqual([]);
  });

  it('should handle nested nodes with default transform logic', () => {
    const result = transformHTML(
      '<div><p>Hello <strong>World</strong></p></div>',
    );
    expect(result).toEqual([]);
  });
});
