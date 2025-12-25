import type { LynxNode } from '@lynx-html-renderer/typings';
import {
  applyPostProcessors,
  hasMarks,
  isTextNode,
  mergeAdjacentTextNodes,
} from '@lynx-html-renderer/utils/node-helpers';
import { describe, expect, it } from 'vitest';

describe('node-helpers', () => {
  describe('isTextNode', () => {
    it('should return true for text nodes', () => {
      const textNode = { kind: 'text', content: 'Hello' };
      expect(isTextNode(textNode)).toBe(true);
    });

    it('should return false for element nodes', () => {
      const elementNode = {
        kind: 'element',
        tag: 'view',
        props: {},
        children: [],
      };
      expect(isTextNode(elementNode)).toBe(false);
    });
  });

  describe('hasMarks', () => {
    it('should return true when marks have values', () => {
      expect(hasMarks({ bold: true })).toBe(true);
      expect(hasMarks({ italic: true })).toBe(true);
      expect(hasMarks({ bold: true, italic: false })).toBe(true);
    });

    it('should return false for empty marks', () => {
      expect(hasMarks({})).toBe(false);
    });

    it('should return false for marks with all false values', () => {
      expect(hasMarks({ bold: false, italic: false })).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(hasMarks(undefined)).toBe(false);
    });

    it('should handle multiple mark types', () => {
      expect(
        hasMarks({ bold: true, italic: true, underline: false, code: true }),
      ).toBe(true);
    });
  });

  describe('mergeAdjacentTextNodes', () => {
    it('should merge adjacent text nodes', () => {
      const nodes: LynxNode[] = [
        { kind: 'text', content: 'Hello ' },
        { kind: 'text', content: 'World' },
      ];
      const result = mergeAdjacentTextNodes(nodes);
      expect(result).toHaveLength(1);
      expect(result[0].kind).toBe('text');
      expect(result[0].content).toBe('Hello World');
    });

    it('should merge text content', () => {
      const nodes: LynxNode[] = [
        { kind: 'text', content: 'First' },
        { kind: 'text', content: ' ' },
        { kind: 'text', content: 'Second' },
      ];
      const result = mergeAdjacentTextNodes(nodes);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('First Second');
    });

    it('should not merge nodes with different marks', () => {
      const nodes: LynxNode[] = [
        { kind: 'text', content: 'Bold', marks: { bold: true } },
        { kind: 'text', content: 'Italic', marks: { italic: true } },
      ];
      const result = mergeAdjacentTextNodes(nodes);
      // Should not merge because marks are different
      expect(result).toHaveLength(2);
      expect(result[0].marks).toEqual({ bold: true });
      expect(result[1].marks).toEqual({ italic: true });
    });

    it('should not merge when only first node has marks', () => {
      const nodes: LynxNode[] = [
        { kind: 'text', content: 'Text', marks: { bold: true } },
        { kind: 'text', content: 'More' },
      ];
      const result = mergeAdjacentTextNodes(nodes);
      // Should not merge because marks are different ({bold: true} vs undefined)
      expect(result).toHaveLength(2);
      expect(result[0].marks).toEqual({ bold: true });
      expect(result[1].marks).toBeUndefined();
    });

    it('should not merge when only second node has marks', () => {
      const nodes: LynxNode[] = [
        { kind: 'text', content: 'Text' },
        { kind: 'text', content: 'More', marks: { italic: true } },
      ];
      const result = mergeAdjacentTextNodes(nodes);
      // Should not merge because marks are different (undefined vs {italic: true})
      expect(result).toHaveLength(2);
      expect(result[0].marks).toBeUndefined();
      expect(result[1].marks).toEqual({ italic: true });
    });

    it('should not merge non-adjacent text nodes', () => {
      const nodes: LynxNode[] = [
        { kind: 'text', content: 'First' },
        {
          kind: 'element',
          tag: 'view',
          props: {},
          children: [],
        },
        { kind: 'text', content: 'Second' },
      ];
      const result = mergeAdjacentTextNodes(nodes);
      expect(result).toHaveLength(3);
    });

    it('should handle empty array', () => {
      const result = mergeAdjacentTextNodes([]);
      expect(result).toHaveLength(0);
    });

    it('should handle single node', () => {
      const nodes: LynxNode[] = [{ kind: 'text', content: 'Single' }];
      const result = mergeAdjacentTextNodes(nodes);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Single');
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

    it('should merge nodes with identical marks', () => {
      const nodes: LynxNode[] = [
        { kind: 'text', content: 'Bold ', marks: { bold: true } },
        { kind: 'text', content: 'text', marks: { bold: true } },
      ];
      const result = mergeAdjacentTextNodes(nodes);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Bold text');
      expect(result[0].marks).toEqual({ bold: true });
    });

    it('should merge nodes with same complex marks', () => {
      const nodes: LynxNode[] = [
        { kind: 'text', content: 'Bold ', marks: { bold: true, italic: true } },
        { kind: 'text', content: 'and ', marks: { bold: true, italic: true } },
        {
          kind: 'text',
          content: 'italic',
          marks: { bold: true, italic: true },
        },
      ];
      const result = mergeAdjacentTextNodes(nodes);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Bold and italic');
      expect(result[0].marks).toEqual({ bold: true, italic: true });
    });
  });

  describe('applyPostProcessors', () => {
    it('should apply single processor', () => {
      const processor = (node: LynxNode) => ({
        ...node,
        meta: { ...node.meta, processed: true },
      });
      const input = { kind: 'text', content: 'Test' };
      const result = applyPostProcessors(input, [processor]);
      expect(result.meta?.processed).toBe(true);
    });

    it('should apply multiple processors in order', () => {
      const processors = [
        (node: LynxNode) => ({
          ...node,
          meta: { ...node.meta, step1: true },
        }),
        (node: LynxNode) => ({
          ...node,
          meta: { ...node.meta, step2: true },
        }),
      ];
      const input = { kind: 'text', content: 'Test' };
      const result = applyPostProcessors(input, processors);
      expect(result.meta?.step1).toBe(true);
      expect(result.meta?.step2).toBe(true);
    });

    it('should pass processor results to next processor', () => {
      const processors = [
        (node: LynxNode) => ({
          ...node,
          meta: { ...node.meta, value: 'first' },
        }),
        (node: LynxNode) => ({
          ...node,
          meta: { ...node.meta, value: 'second' },
        }),
      ];
      const input = { kind: 'text', content: 'Test' };
      const result = applyPostProcessors(input, processors);
      expect(result.meta?.value).toBe('second');
    });

    it('should handle empty processor array', () => {
      const input = { kind: 'text', content: 'Test' };
      const result = applyPostProcessors(input, []);
      expect(result).toEqual(input);
    });

    it('should preserve node properties through processors', () => {
      const processor = (node: LynxNode) => ({
        ...node,
        meta: { ...node.meta, added: true },
      });
      const input = {
        kind: 'text',
        content: 'Test',
        marks: { bold: true },
      };
      const result = applyPostProcessors(input, [processor]);
      expect(result.content).toBe('Test');
      expect(result.marks).toEqual({ bold: true });
      expect(result.meta?.added).toBe(true);
    });
  });
});
