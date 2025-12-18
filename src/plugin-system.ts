import { builtinPlugin } from './plugins/builtin';
import type {
  ChildrenTransformProcessor,
  HtmlToLynxPlugin,
  HtmlTransformProcessor,
  NodePostProcessor,
  NodeTransformProcessor,
  ProcessorBase,
  StyleHandler,
  TagHandler,
  TopLevelMergeProcessor,
  TransformContext,
} from './typings';

/**
 * 处理器注册表项
 */
interface HandlerRegistryEntry<T> {
  handler: T;
  type?: string;
  priority?: number;
}

// 定义所有处理器类别
const PROCESSOR_CATEGORIES = {
  TAG_PROCESSOR: 'tagProcessor',
  STYLE_PROCESSOR: 'styleProcessor',
  NODE_POST_PROCESSOR: 'nodePostProcessor',
  HTML_TRANSFORM_PROCESSOR: 'htmlTransformProcessor',
  CHILDREN_TRANSFORM_PROCESSOR: 'childrenTransformProcessor',
  NODE_TRANSFORM_PROCESSOR: 'nodeTransformProcessor',
  TOP_LEVEL_MERGE_PROCESSOR: 'topLevelMergeProcessor',
} as const;

class PluginManager {
  private plugins: HtmlToLynxPlugin[] = [];
  // 统一的处理器注册表
  // 外层 Map 的 key 是处理器类别，内层 Map 的 key 是标签名（对于标签处理器）或 'global'（对于全局处理器）
  private processors: Map<string, Map<string, HandlerRegistryEntry<any>[]>> =
    new Map();
  private disabledProcessorTypes: Set<string> = new Set();

  constructor() {
    // 初始化所有处理器类别
    Object.values(PROCESSOR_CATEGORIES).forEach((category) => {
      this.processors.set(category, new Map());
    });
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

  /**
   * 通用处理器注册方法
   */
  private registerProcessor<T>(category: string, key: string, handler: T) {
    const taggedHandler = handler as T & Partial<ProcessorBase>;
    const entry: HandlerRegistryEntry<T> = {
      handler,
      type: taggedHandler.type,
      priority: taggedHandler.priority ?? 0,
    };

    const categoryMap = this.processors.get(category);
    if (!categoryMap) return;

    const handlers = categoryMap.get(key) || [];
    handlers.push(entry as HandlerRegistryEntry<any>);

    // 按优先级排序
    handlers.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    categoryMap.set(key, handlers);
  }

  /**
   * 在指定类型的处理器之前插入自定义处理器
   */
  private insertBefore<T>(
    category: string,
    type: string,
    handler: T,
    tagOrKey?: string,
  ): void {
    const taggedHandler = handler as T & Partial<ProcessorBase>;
    const insertEntry = {
      handler,
      type: taggedHandler.type,
      priority: taggedHandler.priority ?? 0,
    };

    const categoryMap = this.processors.get(category);
    if (!categoryMap) return;

    // 确定键名 - 对于标签处理器使用标签名，其他使用 'global'
    const key =
      category === PROCESSOR_CATEGORIES.TAG_PROCESSOR && tagOrKey
        ? tagOrKey
        : 'global';

    const handlers = categoryMap.get(key) || [];
    const index = handlers.findIndex((entry) => entry.type === type);
    if (index !== -1) {
      handlers.splice(index, 0, insertEntry as HandlerRegistryEntry<any>);
    } else {
      handlers.push(insertEntry as HandlerRegistryEntry<any>);
    }
    categoryMap.set(key, handlers);
  }

  /**
   * 在指定类型的处理器之后插入自定义处理器
   */
  private insertAfter<T>(
    category: string,
    type: string,
    handler: T,
    tagOrKey?: string,
  ): void {
    const taggedHandler = handler as T & Partial<ProcessorBase>;
    const insertEntry = {
      handler,
      type: taggedHandler.type,
      priority: taggedHandler.priority ?? 0,
    };

    const categoryMap = this.processors.get(category);
    if (!categoryMap) return;

    // 确定键名 - 对于标签处理器使用标签名，其他使用 'global'
    const key =
      category === PROCESSOR_CATEGORIES.TAG_PROCESSOR && tagOrKey
        ? tagOrKey
        : 'global';

    const handlers = categoryMap.get(key) || [];
    const index = handlers.findIndex((entry) => entry.type === type);
    if (index !== -1) {
      handlers.splice(index + 1, 0, insertEntry as HandlerRegistryEntry<any>);
    } else {
      handlers.push(insertEntry as HandlerRegistryEntry<any>);
    }
    categoryMap.set(key, handlers);
  }

  /**
   * 通用处理器获取方法
   */
  private getProcessors<T>(category: string, tagOrKey?: string): T[] {
    const categoryMap = this.processors.get(category);
    if (!categoryMap) return [];

    // 确定键名 - 对于标签处理器使用标签名，其他使用 'global'
    const key =
      category === PROCESSOR_CATEGORIES.TAG_PROCESSOR && tagOrKey
        ? tagOrKey
        : 'global';

    const handlers = categoryMap.get(key) || [];
    return handlers
      .filter((entry) => !this.disabledProcessorTypes.has(entry.type || ''))
      .map((entry) => entry.handler);
  }

  private setupPlugin(plugin: HtmlToLynxPlugin) {
    const ctx: TransformContext = {
      registerTagHandler: (tag, handler) => {
        this.registerProcessor(
          PROCESSOR_CATEGORIES.TAG_PROCESSOR,
          tag,
          handler,
        );
      },
      registerStyleHandler: (handler) => {
        this.registerProcessor(
          PROCESSOR_CATEGORIES.STYLE_PROCESSOR,
          'global',
          handler,
        );
      },
      registerNodePostProcessor: (processor) => {
        this.registerProcessor(
          PROCESSOR_CATEGORIES.NODE_POST_PROCESSOR,
          'global',
          processor,
        );
      },
      registerHtmlTransformProcessor: (processor) => {
        this.registerProcessor(
          PROCESSOR_CATEGORIES.HTML_TRANSFORM_PROCESSOR,
          'global',
          processor,
        );
      },
      registerChildrenTransformProcessor: (processor) => {
        this.registerProcessor(
          PROCESSOR_CATEGORIES.CHILDREN_TRANSFORM_PROCESSOR,
          'global',
          processor,
        );
      },
      registerNodeTransformProcessor: (processor) => {
        this.registerProcessor(
          PROCESSOR_CATEGORIES.NODE_TRANSFORM_PROCESSOR,
          'global',
          processor,
        );
      },
      registerTopLevelMergeProcessor: (processor) => {
        this.registerProcessor(
          PROCESSOR_CATEGORIES.TOP_LEVEL_MERGE_PROCESSOR,
          'global',
          processor,
        );
      },
    };

    plugin.setup(ctx);
  }

  /**
   * 获取指定标签的处理器列表（过滤掉已禁用的处理器）
   */
  getTagHandlers(tag: string): TagHandler[] {
    return this.getProcessors<TagHandler>(
      PROCESSOR_CATEGORIES.TAG_PROCESSOR,
      tag,
    );
  }

  /**
   * 获取样式处理器列表（过滤掉已禁用的处理器）
   */
  getStyleHandlers(): StyleHandler[] {
    return this.getProcessors<StyleHandler>(
      PROCESSOR_CATEGORIES.STYLE_PROCESSOR,
    );
  }

  /**
   * 获取节点后处理器列表（过滤掉已禁用的处理器）
   */
  getNodePostProcessors(): NodePostProcessor[] {
    return this.getProcessors<NodePostProcessor>(
      PROCESSOR_CATEGORIES.NODE_POST_PROCESSOR,
    );
  }

  /**
   * 获取HTML转换处理器列表（过滤掉已禁用的处理器）
   */
  getHtmlTransformProcessors(): HtmlTransformProcessor[] {
    return this.getProcessors<HtmlTransformProcessor>(
      PROCESSOR_CATEGORIES.HTML_TRANSFORM_PROCESSOR,
    );
  }

  /**
   * 获取子节点转换处理器列表（过滤掉已禁用的处理器）
   */
  getChildrenTransformProcessors(): ChildrenTransformProcessor[] {
    return this.getProcessors<ChildrenTransformProcessor>(
      PROCESSOR_CATEGORIES.CHILDREN_TRANSFORM_PROCESSOR,
    );
  }

  /**
   * 获取节点转换处理器列表（过滤掉已禁用的处理器）
   */
  getNodeTransformProcessors(): NodeTransformProcessor[] {
    return this.getProcessors<NodeTransformProcessor>(
      PROCESSOR_CATEGORIES.NODE_TRANSFORM_PROCESSOR,
    );
  }

  /**
   * 获取顶层节点合并处理器列表（过滤掉已禁用的处理器）
   */
  getTopLevelMergeProcessors(): TopLevelMergeProcessor[] {
    return this.getProcessors<TopLevelMergeProcessor>(
      PROCESSOR_CATEGORIES.TOP_LEVEL_MERGE_PROCESSOR,
    );
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
   * 在指定类型的标签处理器之前插入自定义处理器
   */
  insertBeforeTagHandler<T extends TagHandler>(
    type: string,
    handler: T,
    tag: string,
  ): void {
    this.insertBefore(PROCESSOR_CATEGORIES.TAG_PROCESSOR, type, handler, tag);
  }

  /**
   * 在指定类型的样式处理器之前插入自定义处理器
   */
  insertBeforeStyleHandler<T extends StyleHandler>(
    type: string,
    handler: T,
  ): void {
    this.insertBefore(PROCESSOR_CATEGORIES.STYLE_PROCESSOR, type, handler);
  }

  /**
   * 在指定类型的节点后处理器之前插入自定义处理器
   */
  insertBeforeNodePostProcessor<T extends NodePostProcessor>(
    type: string,
    processor: T,
  ): void {
    this.insertBefore(
      PROCESSOR_CATEGORIES.NODE_POST_PROCESSOR,
      type,
      processor,
    );
  }

  /**
   * 在指定类型的HTML转换处理器之前插入自定义处理器
   */
  insertBeforeHtmlTransformProcessor<T extends HtmlTransformProcessor>(
    type: string,
    processor: T,
  ): void {
    this.insertBefore(
      PROCESSOR_CATEGORIES.HTML_TRANSFORM_PROCESSOR,
      type,
      processor,
    );
  }

  /**
   * 在指定类型的子节点转换处理器之前插入自定义处理器
   */
  insertBeforeChildrenTransformProcessor<T extends ChildrenTransformProcessor>(
    type: string,
    processor: T,
  ): void {
    this.insertBefore(
      PROCESSOR_CATEGORIES.CHILDREN_TRANSFORM_PROCESSOR,
      type,
      processor,
    );
  }

  /**
   * 在指定类型的节点转换处理器之前插入自定义处理器
   */
  insertBeforeNodeTransformProcessor<T extends NodeTransformProcessor>(
    type: string,
    processor: T,
  ): void {
    this.insertBefore(
      PROCESSOR_CATEGORIES.NODE_TRANSFORM_PROCESSOR,
      type,
      processor,
    );
  }

  /**
   * 在指定类型的顶层节点合并处理器之前插入自定义处理器
   */
  insertBeforeTopLevelMergeProcessor<T extends TopLevelMergeProcessor>(
    type: string,
    processor: T,
  ): void {
    this.insertBefore(
      PROCESSOR_CATEGORIES.TOP_LEVEL_MERGE_PROCESSOR,
      type,
      processor,
    );
  }

  /**
   * 在指定类型的标签处理器之后插入自定义处理器
   */
  insertAfterTagHandler<T extends TagHandler>(
    type: string,
    handler: T,
    tag: string,
  ): void {
    this.insertAfter(PROCESSOR_CATEGORIES.TAG_PROCESSOR, type, handler, tag);
  }

  /**
   * 在指定类型的样式处理器之后插入自定义处理器
   */
  insertAfterStyleHandler<T extends StyleHandler>(
    type: string,
    handler: T,
  ): void {
    this.insertAfter(PROCESSOR_CATEGORIES.STYLE_PROCESSOR, type, handler);
  }

  /**
   * 在指定类型的节点后处理器之后插入自定义处理器
   */
  insertAfterNodePostProcessor<T extends NodePostProcessor>(
    type: string,
    processor: T,
  ): void {
    this.insertAfter(PROCESSOR_CATEGORIES.NODE_POST_PROCESSOR, type, processor);
  }

  /**
   * 在指定类型的HTML转换处理器之后插入自定义处理器
   */
  insertAfterHtmlTransformProcessor<T extends HtmlTransformProcessor>(
    type: string,
    processor: T,
  ): void {
    this.insertAfter(
      PROCESSOR_CATEGORIES.HTML_TRANSFORM_PROCESSOR,
      type,
      processor,
    );
  }

  /**
   * 在指定类型的子节点转换处理器之后插入自定义处理器
   */
  insertAfterChildrenTransformProcessor<T extends ChildrenTransformProcessor>(
    type: string,
    processor: T,
  ): void {
    this.insertAfter(
      PROCESSOR_CATEGORIES.CHILDREN_TRANSFORM_PROCESSOR,
      type,
      processor,
    );
  }

  /**
   * 在指定类型的节点转换处理器之后插入自定义处理器
   */
  insertAfterNodeTransformProcessor<T extends NodeTransformProcessor>(
    type: string,
    processor: T,
  ): void {
    this.insertAfter(
      PROCESSOR_CATEGORIES.NODE_TRANSFORM_PROCESSOR,
      type,
      processor,
    );
  }

  /**
   * 在指定类型的顶层节点合并处理器之后插入自定义处理器
   */
  insertAfterTopLevelMergeProcessor<T extends TopLevelMergeProcessor>(
    type: string,
    processor: T,
  ): void {
    this.insertAfter(
      PROCESSOR_CATEGORIES.TOP_LEVEL_MERGE_PROCESSOR,
      type,
      processor,
    );
  }
}

export const pluginManager = new PluginManager();
export { PluginManager };
