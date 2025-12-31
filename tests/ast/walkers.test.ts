import { describe, it, expect, vi } from 'vitest';
import { walkAst, walkAstUntil, findAstNodes, findFirstAstNode } from '../../src/ast/walkers';
import type { HtmlAstNode } from '../../src/ast/types';

describe('AST Walkers', () => {
  const createMockNode = (
    type: HtmlAstNode['type'],
    children?: HtmlAstNode[],
  ): HtmlAstNode => {
    const node: HtmlAstNode = { type };
    if (children) {
      node.children = children;
    }
    return node;
  };

  describe('walkAst', () => {
    it('should walk through all nodes in tree', () => {
      const leaf1 = createMockNode('text');
      const leaf2 = createMockNode('text');
      const parent = createMockNode('tag', [leaf1, leaf2]);
      const root = createMockNode('root', [parent]);

      const visited: string[] = [];
      walkAst(root, (node) => {
        visited.push(node.type);
      });

      expect(visited).toEqual(['root', 'tag', 'text', 'text']);
    });

    it('should handle empty children', () => {
      const node = createMockNode('root');

      const visited: string[] = [];
      walkAst(node, (n) => {
        visited.push(n.type);
      });

      expect(visited).toEqual(['root']);
    });

    it('should handle deeply nested structures', () => {
      const deepLeaf = createMockNode('text');
      const mid = createMockNode('tag', [deepLeaf]);
      const root = createMockNode('root', [mid]);

      const depths: number[] = [];
      walkAst(root, () => {
        depths.push(1);
      });

      expect(depths).toEqual([1, 1, 1]);
    });

    it('should call callback with correct node context', () => {
      const textNode = createMockNode('text');
      textNode.data = 'Hello';
      const root = createMockNode('root', [textNode]);

      const nodes: HtmlAstNode[] = [];
      walkAst(root, (node) => {
        nodes.push(node);
      });

      expect(nodes).toHaveLength(2);
      expect(nodes[1]).toBe(textNode);
      expect(nodes[1].data).toBe('Hello');
    });
  });

  describe('walkAstUntil', () => {
    it('should stop traversal when callback returns true', () => {
      const target = createMockNode('text');
      target.data = 'target';
      const other = createMockNode('text');
      other.data = 'other';
      const root = createMockNode('root', [target, other]);

      const visited: string[] = [];
      const result = walkAstUntil(root, (node) => {
        visited.push(node.type);
        return node.data === 'target';
      });

      expect(result).toBe(true);
      expect(visited).toEqual(['root', 'text']);
    });

    it('should return false if condition never met', () => {
      const root = createMockNode('root', [
        createMockNode('text'),
        createMockNode('text'),
      ]);

      const result = walkAstUntil(root, () => false);

      expect(result).toBe(false);
    });

    it('should check root node', () => {
      const root = createMockNode('root');

      const result = walkAstUntil(root, (node) => node.type === 'root');

      expect(result).toBe(true);
    });

    it('should find node in deep structure', () => {
      const target = createMockNode('text');
      target.name = 'findme';
      const mid = createMockNode('tag', [target]);
      const root = createMockNode('root', [mid]);

      const result = walkAstUntil(root, (node) => node.name === 'findme');

      expect(result).toBe(true);
    });

    it('should not traverse siblings after finding match', () => {
      const target = createMockNode('text');
      const sibling = createMockNode('text');
      sibling.data = 'sibling';
      const root = createMockNode('root', [target, sibling]);

      const visited: HtmlAstNode[] = [];
      walkAstUntil(root, (node) => {
        visited.push(node);
        return node.type === 'text';
      });

      // Should only visit root and first text node, not the sibling
      expect(visited).toHaveLength(2);
      expect(visited[1]).toBe(target);
    });
  });

  describe('findAstNodes', () => {
    it('should find all matching nodes', () => {
      const text1 = createMockNode('text');
      const text2 = createMockNode('text');
      const tag = createMockNode('tag');
      const root = createMockNode('root', [text1, tag, text2]);

      const textNodes = findAstNodes(root, (node) => node.type === 'text');

      expect(textNodes).toHaveLength(2);
      expect(textNodes[0]).toBe(text1);
      expect(textNodes[1]).toBe(text2);
    });

    it('should return empty array if no matches', () => {
      const root = createMockNode('root', [createMockNode('tag')]);

      const textNodes = findAstNodes(root, (node) => node.type === 'text');

      expect(textNodes).toEqual([]);
    });

    it('should find nodes by name property', () => {
      const div1 = createMockNode('tag');
      div1.name = 'div';
      const span = createMockNode('tag');
      span.name = 'span';
      const div2 = createMockNode('tag');
      div2.name = 'div';
      const root = createMockNode('root', [div1, span, div2]);

      const divs = findAstNodes(root, (node) => node.name === 'div');

      expect(divs).toHaveLength(2);
    });

    it('should find nodes by complex predicate', () => {
      const target1 = createMockNode('text');
      target1.data = 'match';
      const target2 = createMockNode('text');
      target2.data = 'match';
      const other = createMockNode('text');
      other.data = 'other';
      const root = createMockNode('root', [target1, other, target2]);

      const matches = findAstNodes(root, (node) => node.data === 'match');

      expect(matches).toHaveLength(2);
    });

    it('should handle nested structures correctly', () => {
      const innerText = createMockNode('text');
      const innerTag = createMockNode('tag', [innerText]);
      const outerText = createMockNode('text');
      const root = createMockNode('root', [innerTag, outerText]);

      const allTextNodes = findAstNodes(root, (node) => node.type === 'text');

      expect(allTextNodes).toHaveLength(2);
      expect(allTextNodes[0]).toBe(innerText);
      expect(allTextNodes[1]).toBe(outerText);
    });
  });

  describe('findFirstAstNode', () => {
    it('should return first matching node', () => {
      const text1 = createMockNode('text');
      const text2 = createMockNode('text');
      const root = createMockNode('root', [text1, text2]);

      const result = findFirstAstNode(root, (node) => node.type === 'text');

      expect(result).toBe(text1);
    });

    it('should return undefined if no match', () => {
      const root = createMockNode('root', [createMockNode('tag')]);

      const result = findFirstAstNode(root, (node) => node.type === 'text');

      expect(result).toBeUndefined();
    });

    it('should search in depth-first order', () => {
      const target = createMockNode('text');
      const container = createMockNode('tag', [target]);
      const root = createMockNode('root', [container]);

      const result = findFirstAstNode(root, (node) => node.type === 'text');

      expect(result).toBe(target);
    });

    it('should find node with specific attribute', () => {
      const target = createMockNode('tag');
      target.attribs = { id: 'test' };
      const other = createMockNode('tag');
      other.attribs = { class: 'foo' };
      const root = createMockNode('root', [other, target]);

      const result = findFirstAstNode(root, (node) => node.attribs?.id === 'test');

      expect(result).toBe(target);
    });

    it('should return matching root node', () => {
      const root = createMockNode('root');

      const result = findFirstAstNode(root, () => true);

      expect(result).toBe(root);
    });

    it('should stop after finding first match in deep tree', () => {
      const firstMatch = createMockNode('text');
      firstMatch.data = 'found';
      const secondMatch = createMockNode('text');
      secondMatch.data = 'found';
      const root = createMockNode('root', [firstMatch, secondMatch]);

      const result = findFirstAstNode(root, (node) => node.data === 'found');

      expect(result).toBe(firstMatch);
    });
  });

  describe('edge cases', () => {
    it('should detect circular references', () => {
      const node = createMockNode('text');
      const root = createMockNode('root', [node]);

      // Create circular reference (not normal, but testing robustness)
      // @ts-expect-error - testing edge case
      node.children = [root];

      const visited: number[] = [];
      const callback = (n: HtmlAstNode) => {
        visited.push(1);
        // Prevent infinite loop - this will be hit due to circular reference
        if (visited.length > 10) {
          throw new Error('Too many iterations');
        }
      };

      // Should throw error due to infinite loop detection
      expect(() => walkAst(root, callback)).toThrow();
    });

    it('should handle node without children property', () => {
      const node = createMockNode('text');
      // @ts-expect-error - testing edge case
      delete (node as Partial<HtmlAstNode>).children;

      const visited: string[] = [];
      expect(() => {
        walkAst(node, (n) => {
          visited.push(n.type);
        });
      }).not.toThrow();

      expect(visited).toEqual(['text']);
    });

    it('should work with script and style node types', () => {
      const scriptNode = createMockNode('script');
      const styleNode = createMockNode('style');
      const root = createMockNode('root', [scriptNode, styleNode]);

      const types: string[] = [];
      walkAst(root, (node) => {
        types.push(node.type);
      });

      expect(types).toContain('script');
      expect(types).toContain('style');
    });
  });
});
