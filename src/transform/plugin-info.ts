/**
 * Plugin information and introspection API
 */

import { getBuiltinPlugins } from './plugins';

/**
 * Get information about all builtin plugins
 * @returns Array of plugin metadata
 */
export function getPluginInfo(): PluginInfo[] {
  const plugins = getBuiltinPlugins();

  return plugins.map((plugin) => ({
    name: plugin.name,
    phase: plugin.phase,
    order: plugin.order ?? 0,
    enabledByDefault: plugin.enabledByDefault ?? true,
  }));
}

/**
 * Get plugin information by name
 * @param name - Plugin name
 * @returns Plugin info or undefined if not found
 */
export function getPluginInfoByName(name: string): PluginInfo | undefined {
  const plugins = getBuiltinPlugins();
  const plugin = plugins.find((p) => p.name === name);

  if (!plugin) {
    return undefined;
  }

  return {
    name: plugin.name,
    phase: plugin.phase,
    order: plugin.order ?? 0,
    enabledByDefault: plugin.enabledByDefault ?? true,
  };
}

/**
 * Get plugins by phase
 * @param phase - Transform phase
 * @returns Array of plugin info for the specified phase
 */
export function getPluginsByPhase(phase: TransformPhase): PluginInfo[] {
  const allPlugins = getPluginInfo();
  return allPlugins
    .filter((p) => p.phase === phase)
    .sort((a, b) => a.order - b.order);
}

/**
 * Plugin metadata interface
 */
export interface PluginInfo {
  /** Plugin name */
  name: string;

  /** Execution phase */
  phase: TransformPhase;

  /** Execution order within phase */
  order: number;

  /** Whether enabled by default */
  enabledByDefault: boolean;
}

// Import TransformPhase type
import type { TransformPhase } from './types';
