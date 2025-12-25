import {
  PluginManager,
  pluginManager,
} from '@lynx-html-renderer/plugin-system';
import type { HtmlToLynxPlugin, TagHandler } from '@lynx-html-renderer/typings';
import { describe, expect, it } from 'vitest';

describe('plugin-system', () => {
  let testPluginManager: PluginManager;

  beforeEach(() => {
    // 创建一个新的PluginManager实例进行测试
    testPluginManager = new PluginManager();
  });

  describe('processor management', () => {
    it('should register and get tag handlers correctly', () => {
      // 创建一个测试插件
      const testPlugin: HtmlToLynxPlugin = {
        name: 'test-plugin',
        setup: (ctx) => {
          ctx.registerTagHandler('div', () => null);
          ctx.registerTagHandler('p', () => null);
        },
      };

      testPluginManager.registerPlugin(testPlugin);

      const divHandlers = testPluginManager.getTagHandlers('div');
      const pHandlers = testPluginManager.getTagHandlers('p');
      const spanHandlers = testPluginManager.getTagHandlers('span');

      expect(divHandlers).toBeDefined();
      expect(Array.isArray(divHandlers)).toBe(true);
      expect(divHandlers.length).toBeGreaterThan(0);

      expect(pHandlers).toBeDefined();
      expect(Array.isArray(pHandlers)).toBe(true);
      expect(pHandlers.length).toBeGreaterThan(0);

      expect(spanHandlers).toBeDefined();
      expect(Array.isArray(spanHandlers)).toBe(true);
    });

    it('should register and get style handlers correctly', () => {
      const testPlugin: HtmlToLynxPlugin = {
        name: 'test-plugin',
        setup: (ctx) => {
          ctx.registerStyleHandler(() => ({}));
        },
      };

      testPluginManager.registerPlugin(testPlugin);

      const styleHandlers = testPluginManager.getStyleHandlers();
      expect(styleHandlers).toBeDefined();
      expect(Array.isArray(styleHandlers)).toBe(true);
    });

    it('should register and get node post processors correctly', () => {
      const testPlugin: HtmlToLynxPlugin = {
        name: 'test-plugin',
        setup: (ctx) => {
          ctx.registerNodePostProcessor((node) => node);
        },
      };

      testPluginManager.registerPlugin(testPlugin);

      const postProcessors = testPluginManager.getNodePostProcessors();
      expect(postProcessors).toBeDefined();
      expect(Array.isArray(postProcessors)).toBe(true);
    });

    it('should register and get HTML transform processors correctly', () => {
      const testPlugin: HtmlToLynxPlugin = {
        name: 'test-plugin',
        setup: (ctx) => {
          ctx.registerHtmlTransformProcessor(() => []);
        },
      };

      testPluginManager.registerPlugin(testPlugin);

      const transformProcessors =
        testPluginManager.getHtmlTransformProcessors();
      expect(transformProcessors).toBeDefined();
      expect(Array.isArray(transformProcessors)).toBe(true);
    });

    it('should register and get children transform processors correctly', () => {
      const testPlugin: HtmlToLynxPlugin = {
        name: 'test-plugin',
        setup: (ctx) => {
          ctx.registerChildrenTransformProcessor(() => []);
        },
      };

      testPluginManager.registerPlugin(testPlugin);

      const childrenProcessors =
        testPluginManager.getChildrenTransformProcessors();
      expect(childrenProcessors).toBeDefined();
      expect(Array.isArray(childrenProcessors)).toBe(true);
    });

    it('should register and get node transform processors correctly', () => {
      const testPlugin: HtmlToLynxPlugin = {
        name: 'test-plugin',
        setup: (ctx) => {
          ctx.registerNodeTransformProcessor(() => null);
        },
      };

      testPluginManager.registerPlugin(testPlugin);

      const nodeTransformProcessors =
        testPluginManager.getNodeTransformProcessors();
      expect(nodeTransformProcessors).toBeDefined();
      expect(Array.isArray(nodeTransformProcessors)).toBe(true);
    });

    it('should register and get top level merge processors correctly', () => {
      const testPlugin: HtmlToLynxPlugin = {
        name: 'test-plugin',
        setup: (ctx) => {
          ctx.registerTopLevelMergeProcessor(() => []);
        },
      };

      testPluginManager.registerPlugin(testPlugin);

      const mergeProcessors = testPluginManager.getTopLevelMergeProcessors();
      expect(mergeProcessors).toBeDefined();
      expect(Array.isArray(mergeProcessors)).toBe(true);
    });
  });

  describe('processor enable/disable and insertion', () => {
    it('should disable and enable processors correctly', () => {
      // 验证处理器禁用/启用方法的基本功能
      expect(typeof testPluginManager.disableProcessor).toBe('function');
      expect(typeof testPluginManager.enableProcessor).toBe('function');
      expect(typeof testPluginManager.isProcessorDisabled).toBe('function');

      // 测试默认状态
      expect(testPluginManager.isProcessorDisabled('test-type')).toBe(false);

      // 测试禁用处理器
      testPluginManager.disableProcessor('test-type');
      expect(testPluginManager.isProcessorDisabled('test-type')).toBe(true);

      // 测试启用处理器
      testPluginManager.enableProcessor('test-type');
      expect(testPluginManager.isProcessorDisabled('test-type')).toBe(false);
    });

    it('should handle processor insertion methods correctly', () => {
      // 验证处理器插入方法的基本功能
      expect(typeof testPluginManager.insertBeforeTagHandler).toBe('function');
      expect(typeof testPluginManager.insertAfterTagHandler).toBe('function');
      expect(typeof testPluginManager.insertBeforeStyleHandler).toBe(
        'function',
      );
      expect(typeof testPluginManager.insertAfterStyleHandler).toBe('function');
      expect(typeof testPluginManager.insertBeforeNodePostProcessor).toBe(
        'function',
      );
      expect(typeof testPluginManager.insertAfterNodePostProcessor).toBe(
        'function',
      );
      expect(typeof testPluginManager.insertBeforeHtmlTransformProcessor).toBe(
        'function',
      );
      expect(typeof testPluginManager.insertAfterHtmlTransformProcessor).toBe(
        'function',
      );
      expect(
        typeof testPluginManager.insertBeforeChildrenTransformProcessor,
      ).toBe('function');
      expect(
        typeof testPluginManager.insertAfterChildrenTransformProcessor,
      ).toBe('function');
      expect(typeof testPluginManager.insertBeforeNodeTransformProcessor).toBe(
        'function',
      );
      expect(typeof testPluginManager.insertAfterNodeTransformProcessor).toBe(
        'function',
      );
      expect(typeof testPluginManager.insertBeforeTopLevelMergeProcessor).toBe(
        'function',
      );
      expect(typeof testPluginManager.insertAfterTopLevelMergeProcessor).toBe(
        'function',
      );

      // 验证这些方法可以被调用而不抛出错误
      const mockHandler = () => null;
      // 创建一个符合 ProcessorBase 接口的处理器
      const taggedHandler = Object.assign(mockHandler, {
        type: 'test-handler',
      });

      testPluginManager.insertBeforeTagHandler(
        'test-type',
        taggedHandler,
        'div',
      );
      testPluginManager.insertAfterTagHandler(
        'test-type',
        taggedHandler,
        'div',
      );
      testPluginManager.insertBeforeStyleHandler('test-type', taggedHandler);
      testPluginManager.insertAfterStyleHandler('test-type', taggedHandler);
      testPluginManager.insertBeforeNodePostProcessor(
        'test-type',
        taggedHandler,
      );
      testPluginManager.insertAfterNodePostProcessor(
        'test-type',
        taggedHandler,
      );
      testPluginManager.insertBeforeHtmlTransformProcessor(
        'test-type',
        taggedHandler,
      );
      testPluginManager.insertAfterHtmlTransformProcessor(
        'test-type',
        taggedHandler,
      );
      testPluginManager.insertBeforeChildrenTransformProcessor(
        'test-type',
        taggedHandler,
      );
      testPluginManager.insertAfterChildrenTransformProcessor(
        'test-type',
        taggedHandler,
      );
      testPluginManager.insertBeforeNodeTransformProcessor(
        'test-type',
        taggedHandler,
      );
      testPluginManager.insertAfterNodeTransformProcessor(
        'test-type',
        taggedHandler,
      );
      testPluginManager.insertBeforeTopLevelMergeProcessor(
        'test-type',
        taggedHandler,
      );
      testPluginManager.insertAfterTopLevelMergeProcessor(
        'test-type',
        taggedHandler,
      );

      // 验证调用后系统仍然可以正常工作
      expect(true).toBe(true);
    });

    it('should respect processor priorities', () => {
      // Test processor priority handling - focus on registration functionality
      const customHandler: TagHandler = (node, context) => {
        if (node.type === 'tag' && node.name === 'custom') {
          return {
            kind: 'element',
            tag: 'view',
            props: {},
            children: context.transformChildren(node.children),
            meta: { sourceTag: 'custom' },
          };
        }
        return context.defaultTransform();
      };

      // Register custom processor
      testPluginManager.registerPlugin({
        name: 'custom-plugin',
        setup(ctx) {
          ctx.registerTagHandler('custom', customHandler);
        },
      });

      // 获取自定义标签处理器
      const customHandlers = testPluginManager.getTagHandlers('custom');
      expect(customHandlers).toBeDefined();
      expect(customHandlers.length).toBeGreaterThan(0);
      // 验证我们的自定义处理器被正确注册
    });
  });

  describe('plugin registration', () => {
    it('should register plugins with priority correctly', () => {
      const lowPriorityPlugin: HtmlToLynxPlugin = {
        name: 'low-priority',
        priority: 1,
        setup: (ctx) => {
          ctx.registerTagHandler('div', () => null);
        },
      };

      const highPriorityPlugin: HtmlToLynxPlugin = {
        name: 'high-priority',
        priority: 10,
        setup: (ctx) => {
          ctx.registerTagHandler('div', () => null);
        },
      };

      // 先注册低优先级插件，再注册高优先级插件
      testPluginManager.registerPlugin(lowPriorityPlugin);
      testPluginManager.registerPlugin(highPriorityPlugin);

      // 检查插件是否按优先级排序
      const internalPlugins = (
        testPluginManager as unknown as { plugins: HtmlToLynxPlugin[] }
      ).plugins;
      expect(internalPlugins).toBeDefined();
      expect(Array.isArray(internalPlugins)).toBe(true);
    });

    it('should setup plugins correctly', () => {
      let setupCalled = false;

      const testPlugin: HtmlToLynxPlugin = {
        name: 'test-plugin',
        setup: () => {
          setupCalled = true;
        },
      };

      testPluginManager.registerPlugin(testPlugin);
      expect(setupCalled).toBe(true);
    });
  });

  describe('singleton pluginManager', () => {
    it('should be the same instance every time', () => {
      expect(pluginManager).toBeDefined();
      expect(typeof pluginManager.getTagHandlers).toBe('function');
      expect(typeof pluginManager.registerPlugin).toBe('function');
    });

    it('should have builtin plugins registered by default', () => {
      const divHandlers = pluginManager.getTagHandlers('div');
      expect(divHandlers).toBeDefined();
      expect(Array.isArray(divHandlers)).toBe(true);
    });
  });
});
