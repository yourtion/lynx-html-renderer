import type {
  HtmlToLynxPlugin,
  NodePostProcessor,
  StyleHandler,
  TagHandler,
  TransformContext,
} from './typings';

class PluginManager {
  private plugins: HtmlToLynxPlugin[] = [];
  private tagHandlers: Map<string, TagHandler[]> = new Map();
  private styleHandlers: StyleHandler[] = [];
  private nodePostProcessors: NodePostProcessor[] = [];

  constructor() {
    this.registerBuiltinPlugins();
  }

  private registerBuiltinPlugins() {
    // 这里可以注册内置插件
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
        this.tagHandlers.get(tag)?.push(handler);
      },
      registerStyleHandler: (handler) => {
        this.styleHandlers.push(handler);
      },
      registerNodePostProcessor: (processor) => {
        this.nodePostProcessors.push(processor);
      },
    };

    plugin.setup(ctx);
  }

  getTagHandlers(tag: string): TagHandler[] {
    return this.tagHandlers.get(tag) || [];
  }

  getStyleHandlers(): StyleHandler[] {
    return this.styleHandlers;
  }

  getNodePostProcessors(): NodePostProcessor[] {
    return this.nodePostProcessors;
  }
}

export const pluginManager = new PluginManager();
export { PluginManager };
