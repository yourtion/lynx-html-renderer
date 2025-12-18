import { builtinPlugin } from './plugins/builtin';
import type {
  ChildrenTransformProcessor,
  HtmlToLynxPlugin,
  HtmlTransformProcessor,
  NodePostProcessor,
  NodeTransformProcessor,
  StyleHandler,
  TagHandler,
  TopLevelMergeProcessor,
  TransformContext,
  ProcessorBase,
} from './typings';

/**
 * 处理器注册表项
 */
interface HandlerRegistryEntry<T> {
  handler: T;
  type?: string;
  priority?: number;
}

class PluginManager {
  private plugins: HtmlToLynxPlugin[] = [];
  private tagHandlers: Map<string, HandlerRegistryEntry<TagHandler>[]> =
    new Map();
  private styleHandlers: HandlerRegistryEntry<StyleHandler>[] = [];
  private nodePostProcessors: HandlerRegistryEntry<NodePostProcessor>[] = [];
  private htmlTransformProcessors: HandlerRegistryEntry<HtmlTransformProcessor>[] =
    [];
  private childrenTransformProcessors: HandlerRegistryEntry<ChildrenTransformProcessor>[] =
    [];
  private nodeTransformProcessors: HandlerRegistryEntry<NodeTransformProcessor>[] =
    [];
  private topLevelMergeProcessors: HandlerRegistryEntry<TopLevelMergeProcessor>[] =
    [];
  private disabledProcessorTypes: Set<string> = new Set();

  constructor() {
    this.registerBuiltinPlugins();
  }

  private registerBuiltinPlugins() {
    this.registerPlugin(builtinPlugin);
  }

  registerPlugin(plugin: HtmlToLynxPlugin) {
    this.plugins.push(plugin);
    this.plugins.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    this.setupPlugin(plugin);
  }

  private setupPlugin(plugin: HtmlToLynxPlugin) {
    const ctx: TransformContext = {
      registerTagHandler: (tag, handler) => {
        if (!this.tagHandlers.has(tag)) {
          this.tagHandlers.set(tag, []);
        }

        const taggedHandler = handler as TagHandler & Partial<ProcessorBase>;
        const entry: HandlerRegistryEntry<TagHandler> = {
          handler,
          type: taggedHandler.type,
          priority: taggedHandler.priority ?? 0,
        };

        this.tagHandlers.get(tag)?.push(entry);
        this.tagHandlers
          .get(tag)
          ?.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
      },
      registerStyleHandler: (handler) => {
        const taggedHandler = handler as StyleHandler & Partial<ProcessorBase>;
        const entry: HandlerRegistryEntry<StyleHandler> = {
          handler,
          type: taggedHandler.type,
          priority: taggedHandler.priority ?? 0,
        };

        this.styleHandlers.push(entry);
        this.styleHandlers.sort(
          (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
        );
      },
      registerNodePostProcessor: (processor) => {
        const taggedProcessor = processor as NodePostProcessor &
          Partial<ProcessorBase>;
        const entry: HandlerRegistryEntry<NodePostProcessor> = {
          handler: processor,
          type: taggedProcessor.type,
          priority: taggedProcessor.priority ?? 0,
        };

        this.nodePostProcessors.push(entry);
        this.nodePostProcessors.sort(
          (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
        );
      },
      registerHtmlTransformProcessor: (processor) => {
        const taggedProcessor = processor as HtmlTransformProcessor &
          Partial<ProcessorBase>;
        const entry: HandlerRegistryEntry<HtmlTransformProcessor> = {
          handler: processor,
          type: taggedProcessor.type,
          priority: taggedProcessor.priority ?? 0,
        };

        this.htmlTransformProcessors.push(entry);
        this.htmlTransformProcessors.sort(
          (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
        );
      },
      registerChildrenTransformProcessor: (processor) => {
        const taggedProcessor = processor as ChildrenTransformProcessor &
          Partial<ProcessorBase>;
        const entry: HandlerRegistryEntry<ChildrenTransformProcessor> = {
          handler: processor,
          type: taggedProcessor.type,
          priority: taggedProcessor.priority ?? 0,
        };

        this.childrenTransformProcessors.push(entry);
        this.childrenTransformProcessors.sort(
          (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
        );
      },
      registerNodeTransformProcessor: (processor) => {
        const taggedProcessor = processor as NodeTransformProcessor &
          Partial<ProcessorBase>;
        const entry: HandlerRegistryEntry<NodeTransformProcessor> = {
          handler: processor,
          type: taggedProcessor.type,
          priority: taggedProcessor.priority ?? 0,
        };

        this.nodeTransformProcessors.push(entry);
        this.nodeTransformProcessors.sort(
          (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
        );
      },
      registerTopLevelMergeProcessor: (processor) => {
        const taggedProcessor = processor as TopLevelMergeProcessor &
          Partial<ProcessorBase>;
        const entry: HandlerRegistryEntry<TopLevelMergeProcessor> = {
          handler: processor,
          type: taggedProcessor.type,
          priority: taggedProcessor.priority ?? 0,
        };

        this.topLevelMergeProcessors.push(entry);
        this.topLevelMergeProcessors.sort(
          (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
        );
      },
    };

    plugin.setup(ctx);
  }

  /**
   * 获取指定标签的处理器列表（过滤掉已禁用的处理器）
   */
  getTagHandlers(tag: string): TagHandler[] {
    const handlers = this.tagHandlers.get(tag) || [];
    return handlers
      .filter((entry) => !this.disabledProcessorTypes.has(entry.type || ''))
      .map((entry) => entry.handler);
  }

  /**
   * 获取样式处理器列表（过滤掉已禁用的处理器）
   */
  getStyleHandlers(): StyleHandler[] {
    return this.styleHandlers
      .filter((entry) => !this.disabledProcessorTypes.has(entry.type || ''))
      .map((entry) => entry.handler);
  }

  /**
   * 获取节点后处理器列表（过滤掉已禁用的处理器）
   */
  getNodePostProcessors(): NodePostProcessor[] {
    return this.nodePostProcessors
      .filter((entry) => !this.disabledProcessorTypes.has(entry.type || ''))
      .map((entry) => entry.handler);
  }

  /**
   * 获取HTML转换处理器列表（过滤掉已禁用的处理器）
   */
  getHtmlTransformProcessors(): HtmlTransformProcessor[] {
    return this.htmlTransformProcessors
      .filter((entry) => !this.disabledProcessorTypes.has(entry.type || ''))
      .map((entry) => entry.handler);
  }

  /**
   * 获取子节点转换处理器列表（过滤掉已禁用的处理器）
   */
  getChildrenTransformProcessors(): ChildrenTransformProcessor[] {
    return this.childrenTransformProcessors
      .filter((entry) => !this.disabledProcessorTypes.has(entry.type || ''))
      .map((entry) => entry.handler);
  }

  /**
   * 获取节点转换处理器列表（过滤掉已禁用的处理器）
   */
  getNodeTransformProcessors(): NodeTransformProcessor[] {
    return this.nodeTransformProcessors
      .filter((entry) => !this.disabledProcessorTypes.has(entry.type || ''))
      .map((entry) => entry.handler);
  }

  /**
   * 获取顶层节点合并处理器列表（过滤掉已禁用的处理器）
   */
  getTopLevelMergeProcessors(): TopLevelMergeProcessor[] {
    return this.topLevelMergeProcessors
      .filter((entry) => !this.disabledProcessorTypes.has(entry.type || ''))
      .map((entry) => entry.handler);
  }

  /**
   * 禁用指定类型的处理器
   */
  disableProcessor(type: string): void {
    this.disabledProcessorTypes.add(type);
  }

  /**
   * 启用指定类型的处理器
   */
  enableProcessor(type: string): void {
    this.disabledProcessorTypes.delete(type);
  }

  /**
   * 检查处理器是否已禁用
   */
  isProcessorDisabled(type: string): boolean {
    return this.disabledProcessorTypes.has(type);
  }

  /**
   * 在指定类型的处理器之前插入自定义处理器
   */
  insertBefore<
    T extends
      | TagHandler
      | StyleHandler
      | NodePostProcessor
      | HtmlTransformProcessor
      | ChildrenTransformProcessor
      | NodeTransformProcessor
      | TopLevelMergeProcessor,
  >(
    type: string,
    handler: T,
    targetType:
      | 'tag'
      | 'style'
      | 'postProcessor'
      | 'htmlTransform'
      | 'childrenTransform'
      | 'nodeTransform'
      | 'topLevelMerge',
    tag?: string,
  ): void {
    const taggedHandler = handler as T & Partial<ProcessorBase>;
    const insertEntry = {
      handler,
      type: taggedHandler.type,
      priority: taggedHandler.priority ?? 0,
    };

    if (targetType === 'tag' && tag) {
      const handlers = this.tagHandlers.get(tag) || [];
      const index = handlers.findIndex((entry) => entry.type === type);
      if (index !== -1) {
        handlers.splice(
          index,
          0,
          insertEntry as HandlerRegistryEntry<TagHandler>,
        );
      } else {
        handlers.push(insertEntry as HandlerRegistryEntry<TagHandler>);
      }
      this.tagHandlers.set(tag, handlers);
    } else if (targetType === 'style') {
      const index = this.styleHandlers.findIndex(
        (entry) => entry.type === type,
      );
      if (index !== -1) {
        this.styleHandlers.splice(
          index,
          0,
          insertEntry as HandlerRegistryEntry<StyleHandler>,
        );
      } else {
        this.styleHandlers.push(
          insertEntry as HandlerRegistryEntry<StyleHandler>,
        );
      }
    } else if (targetType === 'postProcessor') {
      const index = this.nodePostProcessors.findIndex(
        (entry) => entry.type === type,
      );
      if (index !== -1) {
        this.nodePostProcessors.splice(
          index,
          0,
          insertEntry as HandlerRegistryEntry<NodePostProcessor>,
        );
      } else {
        this.nodePostProcessors.push(
          insertEntry as HandlerRegistryEntry<NodePostProcessor>,
        );
      }
    } else if (targetType === 'htmlTransform') {
      const index = this.htmlTransformProcessors.findIndex(
        (entry) => entry.type === type,
      );
      if (index !== -1) {
        this.htmlTransformProcessors.splice(
          index,
          0,
          insertEntry as HandlerRegistryEntry<HtmlTransformProcessor>,
        );
      } else {
        this.htmlTransformProcessors.push(
          insertEntry as HandlerRegistryEntry<HtmlTransformProcessor>,
        );
      }
    } else if (targetType === 'childrenTransform') {
      const index = this.childrenTransformProcessors.findIndex(
        (entry) => entry.type === type,
      );
      if (index !== -1) {
        this.childrenTransformProcessors.splice(
          index,
          0,
          insertEntry as HandlerRegistryEntry<ChildrenTransformProcessor>,
        );
      } else {
        this.childrenTransformProcessors.push(
          insertEntry as HandlerRegistryEntry<ChildrenTransformProcessor>,
        );
      }
    } else if (targetType === 'nodeTransform') {
      const index = this.nodeTransformProcessors.findIndex(
        (entry) => entry.type === type,
      );
      if (index !== -1) {
        this.nodeTransformProcessors.splice(
          index,
          0,
          insertEntry as HandlerRegistryEntry<NodeTransformProcessor>,
        );
      } else {
        this.nodeTransformProcessors.push(
          insertEntry as HandlerRegistryEntry<NodeTransformProcessor>,
        );
      }
    } else if (targetType === 'topLevelMerge') {
      const index = this.topLevelMergeProcessors.findIndex(
        (entry) => entry.type === type,
      );
      if (index !== -1) {
        this.topLevelMergeProcessors.splice(
          index,
          0,
          insertEntry as HandlerRegistryEntry<TopLevelMergeProcessor>,
        );
      } else {
        this.topLevelMergeProcessors.push(
          insertEntry as HandlerRegistryEntry<TopLevelMergeProcessor>,
        );
      }
    }
  }

  /**
   * 在指定类型的处理器之后插入自定义处理器
   */
  insertAfter<
    T extends
      | TagHandler
      | StyleHandler
      | NodePostProcessor
      | HtmlTransformProcessor
      | ChildrenTransformProcessor
      | NodeTransformProcessor
      | TopLevelMergeProcessor,
  >(
    type: string,
    handler: T,
    targetType:
      | 'tag'
      | 'style'
      | 'postProcessor'
      | 'htmlTransform'
      | 'childrenTransform'
      | 'nodeTransform'
      | 'topLevelMerge',
    tag?: string,
  ): void {
    const taggedHandler = handler as T & Partial<ProcessorBase>;
    const insertEntry = {
      handler,
      type: taggedHandler.type,
      priority: taggedHandler.priority ?? 0,
    };

    if (targetType === 'tag' && tag) {
      const handlers = this.tagHandlers.get(tag) || [];
      const index = handlers.findIndex((entry) => entry.type === type);
      if (index !== -1) {
        handlers.splice(
          index + 1,
          0,
          insertEntry as HandlerRegistryEntry<TagHandler>,
        );
      } else {
        handlers.push(insertEntry as HandlerRegistryEntry<TagHandler>);
      }
      this.tagHandlers.set(tag, handlers);
    } else if (targetType === 'style') {
      const index = this.styleHandlers.findIndex(
        (entry) => entry.type === type,
      );
      if (index !== -1) {
        this.styleHandlers.splice(
          index + 1,
          0,
          insertEntry as HandlerRegistryEntry<StyleHandler>,
        );
      } else {
        this.styleHandlers.push(
          insertEntry as HandlerRegistryEntry<StyleHandler>,
        );
      }
    } else if (targetType === 'postProcessor') {
      const index = this.nodePostProcessors.findIndex(
        (entry) => entry.type === type,
      );
      if (index !== -1) {
        this.nodePostProcessors.splice(
          index + 1,
          0,
          insertEntry as HandlerRegistryEntry<NodePostProcessor>,
        );
      } else {
        this.nodePostProcessors.push(
          insertEntry as HandlerRegistryEntry<NodePostProcessor>,
        );
      }
    } else if (targetType === 'htmlTransform') {
      const index = this.htmlTransformProcessors.findIndex(
        (entry) => entry.type === type,
      );
      if (index !== -1) {
        this.htmlTransformProcessors.splice(
          index + 1,
          0,
          insertEntry as HandlerRegistryEntry<HtmlTransformProcessor>,
        );
      } else {
        this.htmlTransformProcessors.push(
          insertEntry as HandlerRegistryEntry<HtmlTransformProcessor>,
        );
      }
    } else if (targetType === 'childrenTransform') {
      const index = this.childrenTransformProcessors.findIndex(
        (entry) => entry.type === type,
      );
      if (index !== -1) {
        this.childrenTransformProcessors.splice(
          index + 1,
          0,
          insertEntry as HandlerRegistryEntry<ChildrenTransformProcessor>,
        );
      } else {
        this.childrenTransformProcessors.push(
          insertEntry as HandlerRegistryEntry<ChildrenTransformProcessor>,
        );
      }
    } else if (targetType === 'nodeTransform') {
      const index = this.nodeTransformProcessors.findIndex(
        (entry) => entry.type === type,
      );
      if (index !== -1) {
        this.nodeTransformProcessors.splice(
          index + 1,
          0,
          insertEntry as HandlerRegistryEntry<NodeTransformProcessor>,
        );
      } else {
        this.nodeTransformProcessors.push(
          insertEntry as HandlerRegistryEntry<NodeTransformProcessor>,
        );
      }
    } else if (targetType === 'topLevelMerge') {
      const index = this.topLevelMergeProcessors.findIndex(
        (entry) => entry.type === type,
      );
      if (index !== -1) {
        this.topLevelMergeProcessors.splice(
          index + 1,
          0,
          insertEntry as HandlerRegistryEntry<TopLevelMergeProcessor>,
        );
      } else {
        this.topLevelMergeProcessors.push(
          insertEntry as HandlerRegistryEntry<TopLevelMergeProcessor>,
        );
      }
    }
  }
}

export const pluginManager = new PluginManager();
export { PluginManager };
