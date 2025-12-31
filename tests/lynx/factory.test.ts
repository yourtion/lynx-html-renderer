import { describe, it, expect } from 'vitest';
import {
  createRootNode,
  createLynxNode,
  replaceLynxNode,
  createElementNode,
  createTextNode,
} from '../../src/lynx/factory';
import type { LynxElementNode, LynxTextNode } from '../../src/lynx/types';

describe('Lynx Factory', () => {
  describe('createRootNode', () => {
    it('should create a root element node', () => {
      const root = createRootNode();

      expect(root.kind).toBe('element');
      expect(root.tag).toBe('root');
      expect(root.props).toEqual({});
      expect(root.children).toEqual([]);
      expect(root.meta).toEqual({});
    });

    it('should create independent root nodes', () => {
      const root1 = createRootNode();
      const root2 = createRootNode();

      expect(root1).not.toBe(root2);
      root1.tag = 'modified';
      expect(root2.tag).toBe('root');
    });
  });

  describe('createLynxNode', () => {
    describe('text nodes', () => {
      it('should create text node from partial with content', () => {
        const node = createLynxNode({ content: 'Hello' }) as LynxTextNode;

        expect(node.kind).toBe('text');
        expect(node.content).toBe('Hello');
      });

      it('should create element node by default', () => {
        const node = createLynxNode({}) as LynxElementNode;

        expect(node.kind).toBe('element');
        expect(node.tag).toBe('view');
      });

      it('should include marks when provided', () => {
        const node = createLynxNode({
          content: 'Bold text',
          marks: { bold: true },
        }) as LynxTextNode;

        expect(node.marks).toEqual({ bold: true });
      });

      it('should not include marks when not provided', () => {
        const node = createLynxNode({ content: 'Text' }) as LynxTextNode;

        expect(node.marks).toBeUndefined();
      });

      it('should include inheritableStyles when non-empty', () => {
        const node = createLynxNode({
          content: 'Styled text',
          inheritableStyles: { color: 'red' },
        }) as LynxTextNode;

        expect(node.inheritableStyles).toEqual({ color: 'red' });
      });

      it('should not include inheritableStyles when empty', () => {
        const node = createLynxNode({
          content: 'Text',
          inheritableStyles: {},
        }) as LynxTextNode;

        expect(node.inheritableStyles).toBeUndefined();
      });

      it('should include inheritableClasses when provided', () => {
        const node = createLynxNode({
          content: 'Text',
          inheritableClasses: ['class1', 'class2'],
        }) as LynxTextNode;

        expect(node.inheritableClasses).toEqual(['class1', 'class2']);
      });

      it('should include meta when provided', () => {
        const node = createLynxNode({
          content: 'Text',
          meta: { source: 'br' },
        }) as LynxTextNode;

        expect(node.meta).toEqual({ source: 'br' });
      });

      it('should create text node when kind is explicitly text', () => {
        const node = createLynxNode({
          kind: 'text',
          content: 'Test',
        }) as LynxTextNode;

        expect(node.kind).toBe('text');
        expect(node.content).toBe('Test');
      });

      it('should include all optional fields for text node', () => {
        const node = createLynxNode({
          content: 'Complete',
          marks: { bold: true, italic: true },
          inheritableStyles: { color: 'blue', fontSize: '14px' },
          inheritableClasses: ['styled'],
          meta: { source: 'span' },
        }) as LynxTextNode;

        expect(node.marks).toEqual({ bold: true, italic: true });
        expect(node.inheritableStyles).toEqual({ color: 'blue', fontSize: '14px' });
        expect(node.inheritableClasses).toEqual(['styled']);
        expect(node.meta).toEqual({ source: 'span' });
      });
    });

    describe('element nodes', () => {
      it('should create element node with tag', () => {
        const node = createLynxNode({ tag: 'view' }) as LynxElementNode;

        expect(node.kind).toBe('element');
        expect(node.tag).toBe('view');
      });

      it('should use "view" as default tag', () => {
        const node = createLynxNode({}) as LynxElementNode;

        expect(node.tag).toBe('view');
      });

      it('should include props when provided', () => {
        const node = createLynxNode({
          tag: 'text',
          props: { value: 'Hello' },
        }) as LynxElementNode;

        expect(node.props).toEqual({ value: 'Hello' });
      });

      it('should use empty object as default props', () => {
        const node = createLynxNode({ tag: 'view' }) as LynxElementNode;

        expect(node.props).toEqual({});
      });

      it('should include children when provided', () => {
        const child: LynxTextNode = { kind: 'text', content: 'Child' };
        const node = createLynxNode({
          tag: 'view',
          children: [child],
        }) as LynxElementNode;

        expect(node.children).toHaveLength(1);
        expect(node.children[0]).toBe(child);
      });

      it('should use empty array as default children', () => {
        const node = createLynxNode({ tag: 'view' }) as LynxElementNode;

        expect(node.children).toEqual([]);
      });

      it('should include role when provided', () => {
        const node = createLynxNode({
          tag: 'view',
          role: 'paragraph',
        }) as LynxElementNode;

        expect(node.role).toBe('paragraph');
      });

      it('should not include role when not provided', () => {
        const node = createLynxNode({ tag: 'view' }) as LynxElementNode;

        expect(node.role).toBeUndefined();
      });

      it('should include capabilities when provided', () => {
        const node = createLynxNode({
          tag: 'view',
          capabilities: ['layout', 'style'],
        }) as LynxElementNode;

        expect(node.capabilities).toEqual(['layout', 'style']);
      });

      it('should not include capabilities when not provided', () => {
        const node = createLynxNode({ tag: 'view' }) as LynxElementNode;

        expect(node.capabilities).toBeUndefined();
      });

      it('should include meta when provided', () => {
        const node = createLynxNode({
          tag: 'view',
          meta: { sourceTag: 'div' },
        }) as LynxElementNode;

        expect(node.meta).toEqual({ sourceTag: 'div' });
      });

      it('should not include meta when not provided', () => {
        const node = createLynxNode({ tag: 'view' }) as LynxElementNode;

        expect(node.meta).toBeUndefined();
      });

      it('should create complete element node', () => {
        const child: LynxTextNode = { kind: 'text', content: 'Text' };
        const node = createLynxNode({
          tag: 'text',
          props: { value: 'Hello' },
          children: [child],
          role: 'heading',
          capabilities: ['text'],
          meta: { sourceTag: 'h1' },
        }) as LynxElementNode;

        expect(node.tag).toBe('text');
        expect(node.props).toEqual({ value: 'Hello' });
        expect(node.children).toHaveLength(1);
        expect(node.role).toBe('heading');
        expect(node.capabilities).toEqual(['text']);
        expect(node.meta).toEqual({ sourceTag: 'h1' });
      });
    });
  });

  describe('replaceLynxNode', () => {
    it('should replace root node when target is root', () => {
      const root: LynxElementNode = {
        kind: 'element',
        tag: 'root',
        props: {},
        children: [],
      };
      const replacement: LynxTextNode = { kind: 'text', content: 'New' };

      replaceLynxNode(root, root, replacement);

      expect(root.kind).toBe('text');
      expect(root.content).toBe('New');
    });

    it('should replace direct child', () => {
      const child: LynxTextNode = { kind: 'text', content: 'Old' };
      const root: LynxElementNode = {
        kind: 'element',
        tag: 'root',
        props: {},
        children: [child],
      };
      const replacement: LynxTextNode = { kind: 'text', content: 'New' };

      replaceLynxNode(root, child, replacement);

      expect(root.children[0]).toBe(replacement);
      expect(root.children[0].content).toBe('New');
    });

    it('should replace nested child', () => {
      const leaf: LynxTextNode = { kind: 'text', content: 'Leaf' };
      const middle: LynxElementNode = {
        kind: 'element',
        tag: 'middle',
        props: {},
        children: [leaf],
      };
      const root: LynxElementNode = {
        kind: 'element',
        tag: 'root',
        props: {},
        children: [middle],
      };
      const replacement: LynxTextNode = { kind: 'text', content: 'Replaced' };

      replaceLynxNode(root, leaf, replacement);

      expect(root.children[0].children[0]).toBe(replacement);
      expect(root.children[0].children[0].content).toBe('Replaced');
    });

    it('should not affect other children', () => {
      const target: LynxTextNode = { kind: 'text', content: 'Target' };
      const sibling: LynxTextNode = { kind: 'text', content: 'Sibling' };
      const root: LynxElementNode = {
        kind: 'element',
        tag: 'root',
        props: {},
        children: [target, sibling],
      };
      const replacement: LynxTextNode = { kind: 'text', content: 'New' };

      replaceLynxNode(root, target, replacement);

      expect(root.children[0]).toBe(replacement);
      expect(root.children[1]).toBe(sibling);
      expect(root.children[1].content).toBe('Sibling');
    });

    it('should handle replacement with element node', () => {
      const oldNode: LynxTextNode = { kind: 'text', content: 'Old' };
      const root: LynxElementNode = {
        kind: 'element',
        tag: 'root',
        props: {},
        children: [oldNode],
      };
      const newNode: LynxElementNode = {
        kind: 'element',
        tag: 'view',
        props: {},
        children: [],
      };

      replaceLynxNode(root, oldNode, newNode);

      expect(root.children[0]).toBe(newNode);
      expect(root.children[0].tag).toBe('view');
    });

    it('should do nothing when target not found', () => {
      const target: LynxTextNode = { kind: 'text', content: 'Target' };
      const root: LynxElementNode = {
        kind: 'element',
        tag: 'root',
        props: {},
        children: [],
      };
      const replacement: LynxTextNode = { kind: 'text', content: 'New' };

      replaceLynxNode(root, target, replacement);

      expect(root.children).toEqual([]);
    });

    it('should handle complex nested structure', () => {
      const target: LynxTextNode = { kind: 'text', content: 'Target' };
      const branch1: LynxElementNode = {
        kind: 'element',
        tag: 'branch1',
        props: {},
        children: [target],
      };
      const branch2: LynxElementNode = {
        kind: 'element',
        tag: 'branch2',
        props: {},
        children: [],
      };
      const root: LynxElementNode = {
        kind: 'element',
        tag: 'root',
        props: {},
        children: [branch1, branch2],
      };
      const replacement: LynxTextNode = { kind: 'text', content: 'Replaced' };

      replaceLynxNode(root, target, replacement);

      expect(branch1.children[0]).toBe(replacement);
      expect(branch1.children[0].content).toBe('Replaced');
    });
  });

  describe('createElementNode', () => {
    it('should create element with tag', () => {
      const node = createElementNode('view');

      expect(node.kind).toBe('element');
      expect(node.tag).toBe('view');
    });

    it('should include props when provided', () => {
      const node = createElementNode('text', { value: 'Hello' });

      expect(node.props).toEqual({ value: 'Hello' });
    });

    it('should use empty object as default props', () => {
      const node = createElementNode('view');

      expect(node.props).toEqual({});
    });

    it('should include children when provided', () => {
      const child: LynxTextNode = { kind: 'text', content: 'Child' };
      const node = createElementNode('view', {}, [child]);

      expect(node.children).toEqual([child]);
    });

    it('should use empty array as default children', () => {
      const node = createElementNode('view');

      expect(node.children).toEqual([]);
    });

    it('should create complete element node', () => {
      const child1: LynxTextNode = { kind: 'text', content: 'Child 1' };
      const child2: LynxTextNode = { kind: 'text', content: 'Child 2' };
      const node = createElementNode('view', { id: 'test' }, [child1, child2]);

      expect(node.tag).toBe('view');
      expect(node.props).toEqual({ id: 'test' });
      expect(node.children).toHaveLength(2);
    });
  });

  describe('createTextNode', () => {
    it('should create text node with content', () => {
      const node = createTextNode('Hello World');

      expect(node.kind).toBe('text');
      expect(node.content).toBe('Hello World');
    });

    it('should create independent text nodes', () => {
      const node1 = createTextNode('First');
      const node2 = createTextNode('Second');

      expect(node1).not.toBe(node2);
      expect(node1.content).toBe('First');
      expect(node2.content).toBe('Second');
    });

    it('should handle empty string', () => {
      const node = createTextNode('');

      expect(node.content).toBe('');
    });

    it('should handle special characters', () => {
      const node = createTextNode('Hello\nWorld\t!');

      expect(node.content).toBe('Hello\nWorld\t!');
    });
  });
});
