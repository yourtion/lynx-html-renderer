import { describe, it, expect } from 'vitest';
import {
  HTMLTransformError,
  LynxRenderError,
  PluginError,
} from '../../src/errors';
import type { LynxNode } from '../../src/lynx/types';

describe('Error Classes', () => {
  describe('HTMLTransformError', () => {
    it('should create error with message and phase', () => {
      const error = new HTMLTransformError('Test error', 'parse');

      expect(error.name).toBe('HTMLTransformError');
      expect(error.message).toContain('[HTML Transform Error in parse]');
      expect(error.message).toContain('Test error');
      expect(error.phase).toBe('parse');
    });

    it('should include HTML snippet', () => {
      const html = '<div>Test content</div>';
      const error = new HTMLTransformError('Test error', 'parse', html);

      expect(error.html).toBe(html);
    });

    it('should include cause error', () => {
      const cause = new Error('Original error');
      const error = new HTMLTransformError('Test error', 'parse', undefined, cause);

      expect(error.cause).toBe(cause);
    });

    it('should generate detailed error report', () => {
      const html = '<div>This is a very long HTML content that should be truncated in the error report</div>';
      const cause = new Error('Cause error');
      const error = new HTMLTransformError('Transformation failed', 'transform', html, cause);

      const details = error.getDetails();

      expect(details).toContain('[HTML Transform Error in transform]');
      expect(details).toContain('Transformation failed');
      expect(details).toContain('Phase: transform');
      expect(details).toContain('Caused by: Cause error');
      expect(details).toContain('HTML (first 200 chars):');
      // HTML is not long enough to be truncated
    });

    it('should truncate long HTML in details', () => {
      const longHtml = '<div>' + 'a'.repeat(300) + '</div>';
      const error = new HTMLTransformError('Test', 'parse', longHtml);

      const details = error.getDetails();

      // Should truncate and add ellipsis
      expect(details).toContain('...');
    });

    it('should handle missing optional fields', () => {
      const error = new HTMLTransformError('Test', 'parse');

      const details = error.getDetails();

      expect(details).toContain('Phase: parse');
      expect(details).not.toContain('Caused by:');
      expect(details).not.toContain('HTML (first 200 chars):');
    });

    it('should maintain proper stack trace', () => {
      const error = new HTMLTransformError('Test', 'parse');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('HTMLTransformError');
    });
  });

  describe('LynxRenderError', () => {
    const createMockNode = (type: 'element' | 'text'): LynxNode => {
      if (type === 'element') {
        return {
          kind: 'element',
          tag: 'view',
          props: {},
          children: [],
          meta: { sourceTag: 'div' },
        };
      }
      return {
        kind: 'text',
        content: 'Sample text content',
      };
    };

    it('should create error with message and node', () => {
      const node = createMockNode('element');
      const error = new LynxRenderError('Render failed', node);

      expect(error.name).toBe('LynxRenderError');
      expect(error.message).toContain('[Lynx Render Error]');
      expect(error.message).toContain('Render failed');
      expect(error.node).toBe(node);
    });

    it('should include cause error', () => {
      const node = createMockNode('text');
      const cause = new Error('Underlying error');
      const error = new LynxRenderError('Failed', node, cause);

      expect(error.cause).toBe(cause);
    });

    it('should generate details for element node', () => {
      const node: LynxNode = {
        kind: 'element',
        tag: 'text',
        props: {},
        children: [
          { kind: 'text', content: 'Child 1' },
          { kind: 'text', content: 'Child 2' },
        ],
        meta: { sourceTag: 'p' },
      };
      const error = new LynxRenderError('Render failed', node);

      const details = error.getDetails();

      expect(details).toContain('[Lynx Render Error]');
      expect(details).toContain('Render failed');
      expect(details).toContain('Node kind: element');
      expect(details).toContain('Node tag: text');
      expect(details).toContain('Children count: 2');
      expect(details).toContain('Source tag: p');
    });

    it('should generate details for text node', () => {
      const node: LynxNode = {
        kind: 'text',
        content: 'This is a very long text content that should be truncated in the error details output',
      };
      const error = new LynxRenderError('Failed', node);

      const details = error.getDetails();

      expect(details).toContain('Node kind: text');
      expect(details).toContain('Text content (first 50 chars):');
      expect(details).toContain('...');
    });

    it('should handle element node without meta', () => {
      const node: LynxNode = {
        kind: 'element',
        tag: 'view',
        props: {},
        children: [],
      };
      const error = new LynxRenderError('Failed', node);

      const details = error.getDetails();

      expect(details).toContain('Node kind: element');
      expect(details).toContain('Node tag: view');
      expect(details).not.toContain('Source tag:');
    });

    it('should include cause in details when present', () => {
      const node = createMockNode('element');
      const cause = new Error('Root cause');
      const error = new LynxRenderError('Failed', node, cause);

      const details = error.getDetails();

      expect(details).toContain('Caused by: Root cause');
    });

    it('should truncate long text content', () => {
      const node: LynxNode = {
        kind: 'text',
        content: 'a'.repeat(100),
      };
      const error = new LynxRenderError('Failed', node);

      const details = error.getDetails();

      expect(details).toContain('...');
    });

    it('should maintain proper stack trace', () => {
      const node = createMockNode('text');
      const error = new LynxRenderError('Test', node);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('LynxRenderError');
    });
  });

  describe('PluginError', () => {
    it('should create error with plugin name and phase', () => {
      const error = new PluginError(
        'Processing failed',
        'test-plugin',
        'transform',
      );

      expect(error.name).toBe('PluginError');
      expect(error.message).toContain('[Plugin Error]');
      expect(error.message).toContain('test-plugin');
      expect(error.message).toContain('transform');
      expect(error.message).toContain('Processing failed');
      expect(error.pluginName).toBe('test-plugin');
      expect(error.phase).toBe('transform');
    });

    it('should include cause error', () => {
      const cause = new Error('Underlying issue');
      const error = new PluginError(
        'Failed',
        'my-plugin',
        'normalize',
        cause,
      );

      expect(error.cause).toBe(cause);
    });

    it('should format message correctly with all components', () => {
      const error = new PluginError(
        'Something went wrong',
        'css-parser',
        'parse',
      );

      expect(error.message).toBe(
        '[Plugin Error] css-parser failed in phase parse: Something went wrong',
      );
    });

    it('should maintain proper stack trace', () => {
      const error = new PluginError('Test', 'plugin', 'phase');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('PluginError');
    });
  });

  describe('Error usage patterns', () => {
    it('should allow throwing and catching HTMLTransformError', () => {
      expect(() => {
        throw new HTMLTransformError('Parse error', 'parse', '<div>');
      }).toThrow(HTMLTransformError);
    });

    it('should allow throwing and catching LynxRenderError', () => {
      const node: LynxNode = { kind: 'text', content: 'test' };

      expect(() => {
        throw new LynxRenderError('Render error', node);
      }).toThrow(LynxRenderError);
    });

    it('should allow throwing and catching PluginError', () => {
      expect(() => {
        throw new PluginError('Plugin failed', 'test', 'transform');
      }).toThrow(PluginError);
    });

    it('should allow error instanceof checks', () => {
      const transformError = new HTMLTransformError('Test', 'parse');
      const renderError = new LynxRenderError(
        'Test',
        { kind: 'text', content: 'x' },
      );
      const pluginError = new PluginError('Test', 'p', 'phase');

      expect(transformError instanceof Error).toBe(true);
      expect(renderError instanceof Error).toBe(true);
      expect(pluginError instanceof Error).toBe(true);
      expect(transformError instanceof HTMLTransformError).toBe(true);
      expect(renderError instanceof LynxRenderError).toBe(true);
      expect(pluginError instanceof PluginError).toBe(true);
    });
  });
});
