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
   */
  registerByTag(tag: string, adapter: LynxRenderAdapter): void {
    this.tagMap.set(tag, adapter);
  }

  /**
   * Register an adapter for a specific role
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

// Export the registry instance (will be initialized in index.tsx)
export { AdapterRegistry };
