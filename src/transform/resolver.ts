import { builtinPlugins } from './plugins';
import type { PluginConfig, TransformPhase, TransformPlugin } from './types';

/**
 * 插件解析器
 */
export class TransformPluginResolver {
  private plugins: TransformPlugin[] = [];

  constructor(config?: PluginConfig) {
    this.plugins = this.resolvePlugins(config);
  }

  /**
   * 解析插件列表
   * 1. 加载内建插件
   * 2. 移除被 disable 的插件
   * 3. 用 replace 覆盖同名插件
   * 4. 合并 extra 插件
   * 5. 按 phase → order 排序
   */
  private resolvePlugins(config?: PluginConfig): TransformPlugin[] {
    let plugins: TransformPlugin[] = [];

    // 1. 加载内建插件
    plugins = builtinPlugins.filter((p) => p.enabledByDefault !== false);

    // 2. 移除被禁用的插件
    if (config?.disable) {
      const disabledSet = new Set(config.disable);
      plugins = plugins.filter((p) => !disabledSet.has(p.name));
    }

    // 3. 替换同名插件
    if (config?.replace) {
      plugins = plugins.map((p) => {
        const replacement = config.replace![p.name];
        return replacement ? replacement : p;
      });
    }

    // 4. 合并额外插件
    if (config?.extra) {
      plugins = [...plugins, ...config.extra];
    }

    // 5. 按 phase → order 排序
    const phaseOrder: Record<TransformPhase, number> = {
      normalize: 1,
      structure: 2,
      capability: 3,
      finalize: 4,
    };

    plugins.sort((a, b) => {
      const phaseDiff = phaseOrder[a.phase] - phaseOrder[b.phase];
      if (phaseDiff !== 0) return phaseDiff;

      return (a.order ?? 0) - (b.order ?? 0);
    });

    return plugins;
  }

  /**
   * 按阶段获取插件
   */
  getPluginsByPhase(phase: TransformPhase): TransformPlugin[] {
    return this.plugins.filter((p) => p.phase === phase);
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): TransformPlugin[] {
    return [...this.plugins];
  }
}
