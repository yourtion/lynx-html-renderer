import { describe, expect, it } from 'vitest';
import { transformHTML } from '../html-parser.js';
import { pluginManager } from '../plugin-system.js';
import { BuiltinProcessorType } from '../plugins/builtin.js';
import type { HtmlToLynxPlugin } from '../typings.js';

describe('HTML Parser - New Features', () => {
  // 在每个测试前重置插件管理器状态
  beforeEach(() => {
    // 重新启用所有内置处理器
    Object.values(BuiltinProcessorType).forEach((type) => {
      pluginManager.enableProcessor(type);
    });
  });

  // 在每个测试后清理插件管理器状态
  afterEach(() => {
    // 重新启用所有内置处理器
    Object.values(BuiltinProcessorType).forEach((type) => {
      pluginManager.enableProcessor(type);
    });
  });

  // 附加HTML标签测试
  describe('Additional HTML Tags', () => {
    it('should transform article to view', () => {
      const html = '<article>Article Content</article>';
      const result = transformHTML(html);

      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'view',
          props: { style: { flexDirection: 'column' } },
          children: [{ kind: 'text', content: 'Article Content' }],
          meta: { sourceTag: 'article' },
        },
      ]);
    });

    it('should transform header to view', () => {
      const html = '<header>Header Content</header>';
      const result = transformHTML(html);

      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'view',
          props: { style: { flexDirection: 'column' } },
          children: [{ kind: 'text', content: 'Header Content' }],
          meta: { sourceTag: 'header' },
        },
      ]);
    });

    it('should transform footer to view', () => {
      const html = '<footer>Footer Content</footer>';
      const result = transformHTML(html);

      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'view',
          props: { style: { flexDirection: 'column' } },
          children: [{ kind: 'text', content: 'Footer Content' }],
          meta: { sourceTag: 'footer' },
        },
      ]);
    });
  });

  // 表格支持测试
  describe('Table Support', () => {
    it('should transform simple table structure', () => {
      const html = `
        <table>
          <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
          </tr>
          <tr>
            <td>Cell 3</td>
            <td>Cell 4</td>
          </tr>
        </table>
      `;
      const result = transformHTML(html);

      expect(result).toHaveLength(1);
      expect(result[0].kind).toBe('element');
      expect(result[0].tag).toBe('view');
      expect(result[0].meta?.sourceTag).toBe('table');

      // 检查表格有两行
      expect(result[0].children).toHaveLength(2);

      // 检查第一行有两个单元格
      expect(result[0].children[0].kind).toBe('element');
      expect(result[0].children[0].tag).toBe('view');
      expect(result[0].children[0].meta?.sourceTag).toBe('tr');
      expect(result[0].children[0].children).toHaveLength(2);

      // 检查单元格内容
      expect(result[0].children[0].children[0].children[0].content).toBe(
        'Cell 1',
      );
      expect(result[0].children[0].children[1].children[0].content).toBe(
        'Cell 2',
      );
    });

    it('should handle table with thead, tbody and tfoot', () => {
      const html = `
        <table>
          <thead>
            <tr><th>Header 1</th><th>Header 2</th></tr>
          </thead>
          <tbody>
            <tr><td>Data 1</td><td>Data 2</td></tr>
          </tbody>
          <tfoot>
            <tr><td>Footer 1</td><td>Footer 2</td></tr>
          </tfoot>
        </table>
      `;
      const result = transformHTML(html);

      expect(result).toHaveLength(1);
      expect(result[0].kind).toBe('element');
      expect(result[0].tag).toBe('view');

      // 检查表格有三行（thead, tbody, tfoot 被展平）
      expect(result[0].children).toHaveLength(3);
    });
  });

  // 插件系统基础功能测试
  describe('Plugin System - Basic Features', () => {
    it('should allow registering and using a custom tag handler', () => {
      // 创建一个简单的插件，自定义处理 'custom' 标签
      const customPlugin: HtmlToLynxPlugin = {
        name: 'custom-plugin',
        setup(ctx) {
          ctx.registerTagHandler('custom', (node, { transformChildren }) => {
            return {
              kind: 'element',
              tag: 'view',
              props: { style: { backgroundColor: 'red' } },
              children: transformChildren(node.children),
              meta: { sourceTag: 'custom' },
            };
          });
        },
      };

      // 注册插件
      pluginManager.registerPlugin(customPlugin);

      // 测试自定义标签转换
      const html = '<custom>Custom Content</custom>';
      const result = transformHTML(html);

      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'view',
          props: { style: { backgroundColor: 'red' } },
          children: [{ kind: 'text', content: 'Custom Content' }],
          meta: { sourceTag: 'custom' },
        },
      ]);
    });

    it('should allow registering and using a custom style handler', () => {
      // 创建一个简单的插件，自定义处理样式
      const stylePlugin: HtmlToLynxPlugin = {
        name: 'style-plugin',
        setup(ctx) {
          ctx.registerStyleHandler((style, _node) => {
            // 为所有元素添加默认的 border
            return {
              ...style,
              border: '1px solid blue',
            };
          });
        },
      };

      // 注册插件
      pluginManager.registerPlugin(stylePlugin);

      // 测试样式处理
      const html = '<div style="color: red">Styled Content</div>';
      const result = transformHTML(html);

      expect(result[0].props?.style).toEqual({
        flexDirection: 'column',
        color: 'red',
        border: '1px solid blue',
      });
    });

    it('should allow registering and using a node post-processor', () => {
      // 创建一个简单的插件，自定义处理节点后处理
      const postProcessorPlugin: HtmlToLynxPlugin = {
        name: 'post-processor-plugin',
        setup(ctx) {
          ctx.registerNodePostProcessor((node) => {
            // 为所有文本节点添加 'processed' 标记
            if (node.kind === 'text') {
              return {
                ...node,
                content: `${node.content} (processed)`,
              };
            }
            return node;
          });
        },
      };

      // 注册插件
      pluginManager.registerPlugin(postProcessorPlugin);

      // 测试节点后处理
      const html = '<div>Original Content</div>';
      const result = transformHTML(html);

      expect(result[0].children[0].content).toBe(
        'Original Content (processed)',
      );
    });
  });

  // 内置插件测试
  describe('Plugin System - Builtin Plugin', () => {
    it('should have all builtin processor types defined', () => {
      // 测试 BuiltinProcessorType 枚举的完整性
      expect(Object.values(BuiltinProcessorType)).toHaveLength(4);
      expect(BuiltinProcessorType.BASE_TAG_TRANSFORM).toBeDefined();
      expect(BuiltinProcessorType.TEXT_NODE_HANDLER).toBeDefined();
      expect(BuiltinProcessorType.MERGE_ADJACENT_TEXT_NODES).toBeDefined();
      expect(BuiltinProcessorType.STYLE_PARSER).toBeDefined();
    });

    it('should register all builtin processors', () => {
      // 测试内置插件是否正确注册了所有处理器
      const html = '<div><strong>Test</strong></div>';
      const result = transformHTML(html);
      expect(result).toBeDefined();
      expect(result[0].children[0].props?.style?.fontWeight).toBe('bold');
    });
  });

  // 处理器管理测试
  describe('Plugin System - Processor Management', () => {
    it('should check if processor is disabled', () => {
      // 测试isProcessorDisabled方法
      pluginManager.disableProcessor(
        BuiltinProcessorType.MERGE_ADJACENT_TEXT_NODES,
      );
      expect(
        pluginManager.isProcessorDisabled(
          BuiltinProcessorType.MERGE_ADJACENT_TEXT_NODES,
        ),
      ).toBe(true);

      pluginManager.enableProcessor(
        BuiltinProcessorType.MERGE_ADJACENT_TEXT_NODES,
      );
      expect(
        pluginManager.isProcessorDisabled(
          BuiltinProcessorType.MERGE_ADJACENT_TEXT_NODES,
        ),
      ).toBe(false);
    });

    it('should respect processor priorities', () => {
      // 测试处理器优先级
      const highPriorityHandler = (node: any, context: any) => {
        if (node.type === 'tag' && node.name === 'span') {
          return {
            kind: 'element',
            tag: 'text',
            props: { style: { color: 'red' } },
            children: context.transformChildren(node.children),
            meta: { sourceTag: 'span', priority: 'high' },
          };
        }
        return context.defaultTransform();
      };

      const lowPriorityHandler = (node: any, context: any) => {
        if (node.type === 'tag' && node.name === 'span') {
          return {
            kind: 'element',
            tag: 'text',
            props: { style: { color: 'blue' } },
            children: context.transformChildren(node.children),
            meta: { sourceTag: 'span', priority: 'low' },
          };
        }
        return context.defaultTransform();
      };

      // 设置不同优先级
      (highPriorityHandler as any).type = 'highPriorityHandler';
      (highPriorityHandler as any).priority = 200;

      (lowPriorityHandler as any).type = 'lowPriorityHandler';
      (lowPriorityHandler as any).priority = 100;

      // 注册处理器（顺序不影响，优先级决定执行顺序）
      pluginManager.registerPlugin({
        name: 'low-priority-plugin',
        setup(ctx) {
          ctx.registerTagHandler('span', lowPriorityHandler);
        },
      });

      pluginManager.registerPlugin({
        name: 'high-priority-plugin',
        setup(ctx) {
          ctx.registerTagHandler('span', highPriorityHandler);
        },
      });

      const html = '<span>Priority Test</span>';
      const result = transformHTML(html);

      // 验证高优先级处理器被执行
      expect(result[0].meta?.priority).toBe('high');
      expect(result[0].props?.style?.color).toBe('red');
    });
  });
});
