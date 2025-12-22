import { describe, expect, it } from 'vitest';
import { transformHTML } from '../../html-parser';
import { HTMLRenderer } from '../../index';
import { pluginManager } from '../../plugin-system';
import type {
  HtmlToLynxPlugin,
  LynxElementNode,
  LynxTextNode,
} from '../../typings';

describe('HTMLRenderer', () => {
  it('should be defined and return an array', () => {
    const result = HTMLRenderer({ html: 'Hello World' });
    expect(HTMLRenderer).toBeDefined();
    expect(typeof HTMLRenderer).toBe('function');
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should integrate with plugin system correctly', () => {
    // 测试HTMLRenderer与插件系统的集成
    const html = '<div><strong>Test</strong></div>';
    const result = HTMLRenderer({ html });
    expect(result).toBeDefined();
    expect(result.length).toBe(1);
  });

  it('should handle complex HTML structures', () => {
    // 保留一个复杂HTML结构测试，确保整体功能正常
    const html =
      '<div><h1>Title</h1><p>Paragraph <em>with</em> <strong>formatting</strong></p><ul><li>Item 1</li><li>Item 2</li></ul></div>';
    const result = HTMLRenderer({ html });
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
  });
});

describe('html-parser', () => {
  it('should handle tag handlers correctly (html-parser.ts:124-138)', () => {
    // 创建一个测试插件，注册自定义标签处理器
    const testPlugin: HtmlToLynxPlugin = {
      name: 'test-tag-handler',
      setup: (ctx) => {
        ctx.registerTagHandler('custom-tag', (node, context) => {
          return {
            kind: 'element',
            tag: 'view',
            props: {},
            children: context.transformChildren(node.children || []),
            meta: { sourceTag: 'custom-tag' },
          };
        });
      },
    };

    // 注册插件
    pluginManager.registerPlugin(testPlugin);

    // 测试自定义标签渲染
    const result = transformHTML('<custom-tag>Hello Custom Tag</custom-tag>');
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].kind).toBe('element');
    expect((result[0] as LynxElementNode).tag).toBe('view');
  });

  it('should apply node post processors correctly', () => {
    // 创建一个测试插件，注册节点后处理器
    const testPlugin: HtmlToLynxPlugin = {
      name: 'test-post-processor',
      setup: (ctx) => {
        ctx.registerNodePostProcessor((node) => {
          if (node.kind === 'text') {
            return {
              ...node,
              content: node.content.toUpperCase(),
            };
          }
          return node;
        });
      },
    };

    // 注册插件
    pluginManager.registerPlugin(testPlugin);

    // 测试节点后处理器是否被应用
    const result = transformHTML('<div>hello world</div>');
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].kind).toBe('element');
    expect(
      ((result[0] as LynxElementNode).children[0] as LynxTextNode).kind,
    ).toBe('text');
    expect(
      ((result[0] as LynxElementNode).children[0] as LynxTextNode).content,
    ).toBe('HELLO WORLD');
  });
});
