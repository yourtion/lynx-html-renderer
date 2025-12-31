import { describe, it, expect, beforeEach } from 'vitest';
import { AdapterRegistry } from '../../src/render/adapter-registry';
import type { LynxElementNode, LynxRenderAdapter } from '../../src/lynx/types';

describe('AdapterRegistry', () => {
  let registry: AdapterRegistry;
  let fallbackAdapter: LynxRenderAdapter;

  beforeEach(() => {
    fallbackAdapter = {
      canHandle: () => true,
      render: () => 'fallback',
    };
    registry = new AdapterRegistry(fallbackAdapter);
  });

  const createMockNode = (
    tag: string,
    role?: string,
  ): LynxElementNode => ({
    kind: 'element',
    tag,
    props: {},
    children: [],
    ...(role ? { role } : {}),
  });

  describe('constructor', () => {
    it('should initialize with fallback adapter', () => {
      const node = createMockNode('unknown');
      const adapter = registry.resolve(node);

      expect(adapter).toBe(fallbackAdapter);
    });

    it('should store fallback adapter', () => {
      expect(registry).toBeDefined();
    });
  });

  describe('registerByTag', () => {
    it('should register adapter for a tag', () => {
      const textAdapter: LynxRenderAdapter = {
        canHandle: (node) => node.tag === 'text',
        render: () => 'text',
      };

      registry.registerByTag('text', textAdapter);

      const node = createMockNode('text');
      const adapter = registry.resolve(node);

      expect(adapter).toBe(textAdapter);
    });

    it('should allow registering multiple tags', () => {
      const textAdapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'text',
      };
      const viewAdapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'view',
      };

      registry.registerByTag('text', textAdapter);
      registry.registerByTag('view', viewAdapter);

      expect(registry.resolve(createMockNode('text'))).toBe(textAdapter);
      expect(registry.resolve(createMockNode('view'))).toBe(viewAdapter);
    });

    it('should overwrite existing tag adapter', () => {
      const adapter1: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'v1',
      };
      const adapter2: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'v2',
      };

      registry.registerByTag('text', adapter1);
      registry.registerByTag('text', adapter2);

      const node = createMockNode('text');
      const result = registry.resolve(node);

      expect(result.render()).toBe('v2');
    });
  });

  describe('registerByRole', () => {
    it('should register adapter for a role', () => {
      const paragraphAdapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'paragraph',
      };

      registry.registerByRole('paragraph', paragraphAdapter);

      const node = createMockNode('text', 'paragraph');
      const adapter = registry.resolve(node);

      expect(adapter).toBe(paragraphAdapter);
    });

    it('should allow registering multiple roles', () => {
      const paragraphAdapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'paragraph',
      };
      const headingAdapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'heading',
      };

      registry.registerByRole('paragraph', paragraphAdapter);
      registry.registerByRole('heading', headingAdapter);

      expect(
        registry.resolve(createMockNode('text', 'paragraph')),
      ).toBe(paragraphAdapter);
      expect(
        registry.resolve(createMockNode('text', 'heading')),
      ).toBe(headingAdapter);
    });

    it('should overwrite existing role adapter', () => {
      const adapter1: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'v1',
      };
      const adapter2: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'v2',
      };

      registry.registerByRole('paragraph', adapter1);
      registry.registerByRole('paragraph', adapter2);

      const node = createMockNode('text', 'paragraph');
      const result = registry.resolve(node);

      expect(result.render()).toBe('v2');
    });

    it('should not match role when node has no role', () => {
      const roleAdapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'role',
      };

      registry.registerByRole('paragraph', roleAdapter);

      const node = createMockNode('text');
      const adapter = registry.resolve(node);

      expect(adapter).toBe(fallbackAdapter);
    });
  });

  describe('resolve', () => {
    it('should prioritize tag adapter over role adapter', () => {
      const tagAdapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'tag',
      };
      const roleAdapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'role',
      };

      registry.registerByTag('text', tagAdapter);
      registry.registerByRole('paragraph', roleAdapter);

      const node = createMockNode('text', 'paragraph');
      const adapter = registry.resolve(node);

      expect(adapter).toBe(tagAdapter);
      expect(adapter.render()).toBe('tag');
    });

    it('should use role adapter when no tag adapter exists', () => {
      const roleAdapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'role',
      };

      registry.registerByRole('paragraph', roleAdapter);

      const node = createMockNode('text', 'paragraph');
      const adapter = registry.resolve(node);

      expect(adapter).toBe(roleAdapter);
    });

    it('should fallback to default adapter when no match', () => {
      const node = createMockNode('unknown');
      const adapter = registry.resolve(node);

      expect(adapter).toBe(fallbackAdapter);
    });

    it('should handle tag-only match', () => {
      const tagAdapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'tag-match',
      };

      registry.registerByTag('view', tagAdapter);

      const node = createMockNode('view');
      const adapter = registry.resolve(node);

      expect(adapter).toBe(tagAdapter);
    });

    it('should handle role-only match', () => {
      const roleAdapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'role-match',
      };

      registry.registerByRole('button', roleAdapter);

      const node = createMockNode('view', 'button');
      const adapter = registry.resolve(node);

      expect(adapter).toBe(roleAdapter);
    });

    it('should not match tag adapter with different tag', () => {
      const tagAdapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'text',
      };

      registry.registerByTag('text', tagAdapter);

      const node = createMockNode('view');
      const adapter = registry.resolve(node);

      expect(adapter).toBe(fallbackAdapter);
    });

    it('should not match role adapter with different role', () => {
      const roleAdapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'paragraph',
      };

      registry.registerByRole('paragraph', roleAdapter);

      const node = createMockNode('view', 'heading');
      const adapter = registry.resolve(node);

      expect(adapter).toBe(fallbackAdapter);
    });

    it('should handle nodes with both tag and role', () => {
      const tagAdapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'tag',
      };
      const roleAdapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'role',
      };

      registry.registerByTag('text', tagAdapter);
      registry.registerByRole('heading', roleAdapter);

      const node = createMockNode('text', 'heading');
      const adapter = registry.resolve(node);

      // Tag should take priority
      expect(adapter).toBe(tagAdapter);
    });

    it('should return fallback for node with role but no matching adapters', () => {
      const node = createMockNode('custom', 'custom-role');
      const adapter = registry.resolve(node);

      expect(adapter).toBe(fallbackAdapter);
    });
  });

  describe('performance', () => {
    it('should provide O(1) tag lookup performance', () => {
      const adapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'found',
      };

      registry.registerByTag('text', adapter);

      const node = createMockNode('text');

      // Should be fast even with many lookups
      const iterations = 10000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        registry.resolve(node);
      }

      const duration = performance.now() - start;
      const avgTime = duration / iterations;

      // Should average less than 0.1ms per lookup
      expect(avgTime).toBeLessThan(0.1);
    });

    it('should provide O(1) role lookup performance', () => {
      const adapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'found',
      };

      registry.registerByRole('paragraph', adapter);

      const node = createMockNode('text', 'paragraph');

      const iterations = 10000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        registry.resolve(node);
      }

      const duration = performance.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(0.1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty tag name', () => {
      const adapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'empty',
      };

      registry.registerByTag('', adapter);

      const node = createMockNode('');
      const resolved = registry.resolve(node);

      expect(resolved).toBe(adapter);
    });

    it('should not match empty role (empty string is falsy)', () => {
      const adapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'empty',
      };

      registry.registerByRole('', adapter);

      const node = createMockNode('text', '');
      const resolved = registry.resolve(node);

      // Empty string '' is falsy, so role matching is skipped
      // Should return fallback adapter instead
      expect(resolved).toEqual(fallbackAdapter);
    });

    it('should handle special characters in tag names', () => {
      const adapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'special',
      };

      registry.registerByTag('custom-tag', adapter);

      const node = createMockNode('custom-tag');
      const resolved = registry.resolve(node);

      expect(resolved).toBe(adapter);
    });

    it('should handle case-sensitive tag matching', () => {
      const adapter: LynxRenderAdapter = {
        canHandle: () => true,
        render: () => 'Text',
      };

      registry.registerByTag('Text', adapter);

      const lowercaseNode = createMockNode('text');
      const uppercaseNode = createMockNode('Text');

      expect(registry.resolve(lowercaseNode)).toBe(fallbackAdapter);
      expect(registry.resolve(uppercaseNode)).toBe(adapter);
    });
  });
});
