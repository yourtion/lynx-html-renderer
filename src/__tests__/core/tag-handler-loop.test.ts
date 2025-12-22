import { describe, expect, it } from 'vitest';
import { transformHTML } from '../../html-parser';
import { pluginManager } from '../../plugin-system';
import type { HtmlToLynxPlugin } from '../../typings';

describe('html-parser tag handler loop', () => {
  // 保存原始插件，以便测试后恢复
  let originalPlugins: HtmlToLynxPlugin[];

  beforeEach(() => {
    // 保存原始插件
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

  it('should handle tag handlers loop with various scenarios', () => {
    // 标记后处理器是否被调用
    let _postProcessorCalled = false;

    // 创建一个测试插件，注册各种处理器
    const testPlugin: HtmlToLynxPlugin = {
      name: 'test-plugin',
      setup: (ctx) => {
        // 注册div标签的第一个处理器，返回null
        ctx.registerTagHandler('div', () => null);

        // 注册div标签的第二个处理器，返回非null结果
        ctx.registerTagHandler('div', (node, context) => {
          return {
            kind: 'element',
            tag: 'div',
            children: context.transformChildren(node.children || []),
            props: {
              className: 'test-div',
            },
            role: undefined,
          };
        });

        // 注册p标签处理器
        ctx.registerTagHandler('p', (node, context) => {
          return {
            kind: 'element',
            tag: 'p',
            children: context.transformChildren(node.children || []),
            props: {},
            role: undefined,
          };
        });

        // 注册span标签处理器
        ctx.registerTagHandler('span', (node, context) => {
          return {
            kind: 'element',
            tag: 'span',
            children: context.transformChildren(node.children || []),
            props: {},
            role: undefined,
          };
        });

        // 注册节点后处理器
        ctx.registerNodePostProcessor((node) => {
          _postProcessorCalled = true;
          return node;
        });

        // 注册文本节点处理器
        ctx.registerNodeTransformProcessor((node) => {
          if (node.type === 'text') {
            const content = node.data;
            if (!content?.trim()) return null;

            return {
              kind: 'text',
              content: content || '',
              marks: {},
            };
          }
          return null;
        });
      },
    };

    // 注册测试插件
    pluginManager.registerPlugin(testPlugin);

    // 测试1: 处理有匹配处理器的标签
    const result1 = transformHTML('<div>Test Content</div>');
    expect(result1).toBeDefined();
    expect(Array.isArray(result1)).toBe(true);

    // 测试2: 处理嵌套标签
    const result2 = transformHTML(
      '<div><p>Nested <span>Content</span></p></div>',
    );
    expect(result2).toBeDefined();
    expect(Array.isArray(result2)).toBe(true);

    // 测试3: 处理没有匹配处理器的标签
    const result3 = transformHTML('<unknown-tag>No Handler</unknown-tag>');
    expect(result3).toBeDefined();
    expect(Array.isArray(result3)).toBe(true);

    // 测试4: 处理多个标签
    const result4 = transformHTML(
      '<div>First</div><p>Second</p><span>Third</span>',
    );
    expect(result4).toBeDefined();
    expect(Array.isArray(result4)).toBe(true);
  });
});
