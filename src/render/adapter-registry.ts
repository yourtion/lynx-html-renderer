import type { LynxElementNode, LynxRenderAdapter } from './types';

/**
 * Adapter registry for O(1) adapter lookup performance
 *
 * Uses Map data structures indexed by tag and role for fast resolution
 */
class AdapterRegistry {
  private tagMap = new Map<string, LynxRenderAdapter>();
  private roleMap = new Map<string, LynxRenderAdapter>();
  private fallbackAdapter: LynxRenderAdapter;

  constructor(fallbackAdapter: LynxRenderAdapter) {
    this.fallbackAdapter = fallbackAdapter;
  }

  /**
   * Register an adapter for a specific tag
   * @param tag - The HTML/Lynx tag name (e.g., 'view', 'text', 'image')
   * @param adapter - The adapter to handle nodes with this tag
   */
  registerByTag(tag: string, adapter: LynxRenderAdapter): void {
    this.tagMap.set(tag, adapter);
  }

  /**
   * Register an adapter for a specific role
   * @param role - The element role (e.g., 'table', 'row', 'cell')
   * @param adapter - The adapter to handle nodes with this role
   */
  registerByRole(role: string, adapter: LynxRenderAdapter): void {
    this.roleMap.set(role, adapter);
  }

  /**
   * Resolve the appropriate adapter for a node
   * Priority: tag > role > fallback
   */
  resolve(node: LynxElementNode): LynxRenderAdapter {
    // First try to match by tag (O(1))
    const tagAdapter = this.tagMap.get(node.tag);
    if (tagAdapter) {
      return tagAdapter;
    }

    // Then try to match by role (O(1))
    if (node.role) {
      const roleAdapter = this.roleMap.get(node.role);
      if (roleAdapter) {
        return roleAdapter;
      }
    }

    // Finally, return the fallback adapter
    return this.fallbackAdapter;
  }
}

// Global registry instance (initialized in index.tsx)
let globalRegistry: AdapterRegistry | null = null;

/**
 * Set the global adapter registry instance
 * @internal This is used internally by the library
 */
export function setGlobalRegistry(registry: AdapterRegistry): void {
  globalRegistry = registry;
}

/**
 * Get the global adapter registry instance
 *
 * Use this to access the registry for advanced customization.
 *
 * @returns The global adapter registry instance
 * @throws Error if the registry has not been initialized
 *
 * @example
 * ```typescript
 * const registry = getAdapterRegistry();
 * registry.registerByTag('custom-tag', myCustomAdapter);
 * ```
 */
export function getAdapterRegistry(): AdapterRegistry {
  if (!globalRegistry) {
    throw new Error(
      'Adapter registry not initialized. Make sure HTMLRenderer is imported first.',
    );
  }
  return globalRegistry;
}

/**
 * Register a custom adapter for a specific HTML/Lynx tag
 *
 * Use this to extend the renderer with custom tag handling.
 *
 * @param tag - The tag name to register (e.g., 'video', 'audio')
 * @param adapter - The adapter that will render nodes with this tag
 *
 * @example
 * ```typescript
 * import { registerAdapterByTag, LynxRenderAdapter } from 'lynx-html-renderer';
 *
 * const videoAdapter: LynxRenderAdapter = {
 *   render(node, ctx) {
 *     return <video src={node.props.src} />;
 *   }
 * };
 *
 * registerAdapterByTag('video', videoAdapter);
 * ```
 */
export function registerAdapterByTag(
  tag: string,
  adapter: LynxRenderAdapter,
): void {
  getAdapterRegistry().registerByTag(tag, adapter);
}

/**
 * Register a custom adapter for a specific element role
 *
 * Use this to extend the renderer with custom role-based handling.
 * Role-based adapters have lower priority than tag-based adapters.
 *
 * @param role - The role to register (e.g., 'navigation', 'article')
 * @param adapter - The adapter that will render nodes with this role
 *
 * @example
 * ```typescript
 * import { registerAdapterByRole, LynxRenderAdapter } from 'lynx-html-renderer';
 *
 * const navigationAdapter: LynxRenderAdapter = {
 *   render(node, ctx) {
 *     return <view style={{ flexDirection: 'row' }}>{ctx.renderChildren(node)}</view>;
 *   }
 * };
 *
 * registerAdapterByRole('navigation', navigationAdapter);
 * ```
 */
export function registerAdapterByRole(
  role: string,
  adapter: LynxRenderAdapter,
): void {
  getAdapterRegistry().registerByRole(role, adapter);
}

export { AdapterRegistry };

export type { LynxRenderAdapter };
