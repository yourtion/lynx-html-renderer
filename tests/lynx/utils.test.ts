import { describe, expect, it } from 'vitest';
import type { LynxNode, LynxTextNode } from '../../src/lynx/types';
import {
  hasMarks,
  isTextNode,
  mergeAdjacentTextNodes,
  mergeAllTextNodes,
} from '../../src/lynx/utils';

describe('Lynx Utils', () => {
  describe('mergeAdjacentTextNodes', () => {
    it('should merge two adjacent text nodes without marks', () => {
      const nodes: LynxNode[] = [
        { kind: 'text', content: 'Hello ' },
        { kind: 'text', content: 'World' },
      ];

      const result = mergeAdjacentTextNodes(nodes);

      expect(result).toHaveLength(1);
      expect(result[0].kind).toBe('text');
      expect(result[0].content).toBe('Hello World');
    });

    it('should not merge text nodes with different marks', () => {
      const nodes: LynxNode[] = [
        { kind: 'text', content: 'Hello ', marks: { bold: true } },
        { kind: 'text', content: 'World', marks: { italic: true } },
      ];

      const result = mergeAdjacentTextNodes(nodes);

      expect(result).toHaveLength(2);
      expect(result[0].marks).toEqual({ bold: true });
      expect(result[1].marks).toEqual({ italic: true });
    });

    it('should merge text nodes with same marks', () => {
      const nodes: LynxNode[] = [
        { kind: 'text', content: 'Hello ', marks: { bold: true } },
        { kind: 'text', content: 'World', marks: { bold: true } },
      ];

      const result = mergeAdjacentTextNodes(nodes);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Hello World');
      expect(result[0].marks).toEqual({ bold: true });
    });

    it('should not merge text nodes when one has marks and other does not', () => {
      const nodes: LynxNode[] = [
        { kind: 'text', content: 'Hello ', marks: { bold: true } },
        { kind: 'text', content: 'World' },
      ];

      const result = mergeAdjacentTextNodes(nodes);

      expect(result).toHaveLength(2);
    });

    it('should not merge element nodes', () => {
      const nodes: LynxNode[] = [
        { kind: 'element', tag: 'view', props: {}, children: [] },
        { kind: 'element', tag: 'view', props: {}, children: [] },
      ];

      const result = mergeAdjacentTextNodes(nodes);

      expect(result).toHaveLength(2);
    });

    it('should handle mixed element and text nodes', () => {
      const textNode1: LynxTextNode = { kind: 'text', content: 'Hello' };
      const elementNode = {
        kind: 'element',
        tag: 'view',
        props: {},
        children: [],
      } as const;
      const textNode2: LynxTextNode = { kind: 'text', content: 'World' };

      const result = mergeAdjacentTextNodes([
        textNode1,
        elementNode,
        textNode2,
      ]);

      expect(result).toHaveLength(3);
    });

    it('should merge multiple consecutive text nodes', () => {
      const nodes: LynxNode[] = [
        { kind: 'text', content: 'One ' },
        { kind: 'text', content: 'Two ' },
        { kind: 'text', content: 'Three' },
      ];

      const result = mergeAdjacentTextNodes(nodes);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('One Two Three');
    });

    it('should handle empty array', () => {
      const result = mergeAdjacentTextNodes([]);

      expect(result).toEqual([]);
    });

    it('should handle single node', () => {
      const nodes: LynxNode[] = [{ kind: 'text', content: 'Single' }];

      const result = mergeAdjacentTextNodes(nodes);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Single');
    });

    it('should merge nodes with br meta but keep whitespace', () => {
      const nodes: LynxNode[] = [
        { kind: 'text', content: 'Hello ', meta: { source: 'br' } },
        { kind: 'text', content: 'World' },
      ];

      const result = mergeAdjacentTextNodes(nodes);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Hello World');
      expect(result[0].meta).toBeUndefined();
    });

    it('should trim trailing whitespace from text before br', () => {
      const nodes: LynxNode[] = [
        { kind: 'text', content: 'Hello ' },
        { kind: 'text', content: 'World', meta: { source: 'br' } },
      ];

      const result = mergeAdjacentTextNodes(nodes);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('HelloWorld');
    });

    it('should preserve marks when merging', () => {
      const nodes: LynxNode[] = [
        { kind: 'text', content: 'Bold ', marks: { bold: true } },
        { kind: 'text', content: 'text', marks: { bold: true } },
      ];

      const result = mergeAdjacentTextNodes(nodes);

      expect(result).toHaveLength(1);
      expect(result[0].marks).toEqual({ bold: true });
    });

    it('should handle complex mark objects', () => {
      const nodes: LynxNode[] = [
        {
          kind: 'text',
          content: 'Formatted ',
          marks: { bold: true, italic: true, code: true },
        },
        {
          kind: 'text',
          content: 'text',
          marks: { bold: true, italic: true, code: true },
        },
      ];

      const result = mergeAdjacentTextNodes(nodes);

      expect(result).toHaveLength(1);
      expect(result[0].marks).toEqual({
        bold: true,
        italic: true,
        code: true,
      });
    });

    it('should merge nodes when one has empty marks and other has undefined marks', () => {
      const nodes: LynxNode[] = [
        { kind: 'text', content: 'Text1', marks: {} },
        { kind: 'text', content: 'Text2' },
      ];

      const result = mergeAdjacentTextNodes(nodes);

      // Empty marks {} and undefined both become {} after || {} normalization
      // So they should merge
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Text1Text2');
    });

    it('should handle marks with false values', () => {
      const nodes: LynxNode[] = [
        {
          kind: 'text',
          content: 'Text1 ',
          marks: { bold: true, italic: false },
        },
        {
          kind: 'text',
          content: 'Text2',
          marks: { bold: true, italic: false },
        },
      ];

      const result = mergeAdjacentTextNodes(nodes);

      expect(result).toHaveLength(1);
      expect(result[0].marks).toEqual({ bold: true, italic: false });
    });
  });

  describe('isTextNode', () => {
    it('should return true for text nodes', () => {
      const node: LynxTextNode = { kind: 'text', content: 'Hello' };

      expect(isTextNode(node)).toBe(true);
    });

    it('should return false for element nodes', () => {
      const node = {
        kind: 'element',
        tag: 'view',
        props: {},
        children: [],
      } as const;

      expect(isTextNode(node)).toBe(false);
    });

    it('should provide type narrowing', () => {
      const node: LynxNode = { kind: 'text', content: 'Test' };

      if (isTextNode(node)) {
        // TypeScript should know this is a LynxTextNode
        expect(node.content).toBeDefined();
        // @ts-expect-error - tag should not exist on text node
        const _tag = node.tag;
      }
    });
  });

  describe('hasMarks', () => {
    it('should return true when marks have at least one true value', () => {
      expect(hasMarks({ bold: true })).toBe(true);
      expect(hasMarks({ bold: true, italic: false })).toBe(true);
    });

    it('should return false when all marks are false', () => {
      expect(hasMarks({ bold: false, italic: false })).toBe(false);
    });

    it('should return false when marks is undefined', () => {
      expect(hasMarks(undefined)).toBe(false);
    });

    it('should return false when marks is empty object', () => {
      expect(hasMarks({})).toBe(false);
    });

    it('should handle complex mark objects', () => {
      expect(
        hasMarks({ bold: true, italic: true, code: false, link: false }),
      ).toBe(true);
      expect(hasMarks({ bold: false, italic: false, code: false })).toBe(false);
    });

    it('should handle marks with only false values', () => {
      expect(hasMarks({ bold: false })).toBe(false);
      expect(hasMarks({ bold: false, italic: false, underline: false })).toBe(
        false,
      );
    });
  });

  describe('mergeAllTextNodes', () => {
    it('should merge text nodes at root level', () => {
      const node: LynxNode = {
        kind: 'element',
        tag: 'root',
        props: {},
        children: [
          { kind: 'text', content: 'Hello ' },
          { kind: 'text', content: 'World' },
        ],
      };

      const result = mergeAllTextNodes(node);

      expect(result.kind).toBe('element');
      expect(result.children).toHaveLength(1);
      expect(result.children[0].kind).toBe('text');
      if (result.children[0].kind === 'text') {
        expect(result.children[0].content).toBe('Hello World');
      }
    });

    it('should recursively merge nested text nodes', () => {
      const node: LynxNode = {
        kind: 'element',
        tag: 'root',
        props: {},
        children: [
          {
            kind: 'element',
            tag: 'child',
            props: {},
            children: [
              { kind: 'text', content: 'Nested ' },
              { kind: 'text', content: 'text' },
            ],
          },
        ],
      };

      const result = mergeAllTextNodes(node);

      expect(result.kind).toBe('element');
      expect(result.children).toHaveLength(1);
      if (result.children[0].kind === 'element') {
        expect(result.children[0].children).toHaveLength(1);
        if (result.children[0].children[0].kind === 'text') {
          expect(result.children[0].children[0].content).toBe('Nested text');
        }
      }
    });

    it('should handle deeply nested structures', () => {
      const node: LynxNode = {
        kind: 'element',
        tag: 'root',
        props: {},
        children: [
          {
            kind: 'element',
            tag: 'level1',
            props: {},
            children: [
              {
                kind: 'element',
                tag: 'level2',
                props: {},
                children: [
                  { kind: 'text', content: 'Deep ' },
                  { kind: 'text', content: 'merge' },
                ],
              },
            ],
          },
        ],
      };

      const result = mergeAllTextNodes(node);

      if (result.kind === 'element') {
        if (result.children[0]?.kind === 'element') {
          if (result.children[0].children[0]?.kind === 'element') {
            expect(result.children[0].children[0].children).toHaveLength(1);
          }
        }
      }
    });

    it('should return same node for text node input', () => {
      const node: LynxTextNode = { kind: 'text', content: 'Single' };

      const result = mergeAllTextNodes(node);

      expect(result).toBe(node);
      expect(result.content).toBe('Single');
    });

    it('should handle complex mixed structures', () => {
      const node: LynxNode = {
        kind: 'element',
        tag: 'root',
        props: {},
        children: [
          { kind: 'text', content: 'Before ' },
          {
            kind: 'element',
            tag: 'element',
            props: {},
            children: [
              { kind: 'text', content: 'Inside ' },
              { kind: 'text', content: 'element ' },
            ],
          },
          { kind: 'text', content: 'After' },
        ],
      };

      const result = mergeAllTextNodes(node);

      expect(result.kind).toBe('element');
      expect(result.children).toHaveLength(3);
    });

    it('should not merge text nodes with different marks', () => {
      const node: LynxNode = {
        kind: 'element',
        tag: 'root',
        props: {},
        children: [
          { kind: 'text', content: 'Bold', marks: { bold: true } },
          { kind: 'text', content: 'Normal' },
        ],
      };

      const result = mergeAllTextNodes(node);

      if (result.kind === 'element') {
        expect(result.children).toHaveLength(2);
      }
    });
  });
});
