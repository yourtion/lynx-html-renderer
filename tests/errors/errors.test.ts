import { describe, expect, it } from 'vitest';
import {
  createParseError,
  createPluginError,
  createStyleError,
  createUnsupportedTagError,
  getErrorCode,
  HTMLTransformError,
  isPluginError,
  isRenderError,
  isTransformError,
  LynxRenderError,
  PluginError,
} from '../../src/errors';
import type { LynxNode } from '../../src/lynx/types';

describe('Error Classes', () => {
  describe('HTMLTransformError', () => {
    it('should create error with message and phase', () => {
      const error = new HTMLTransformError('Test error', 'parse');

      expect(error.name).toBe('HTMLTransformError');
      expect(error.message).toContain('[parse]');
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
      const error = new HTMLTransformError('Test error', 'parse', cause);

      expect(error.cause).toBe(cause);
    });

    it('should generate detailed error report', () => {
      const html =
        '<div>This is a very long HTML content that should be truncated in the error report</div>';
      const cause = new Error('Cause error');
      const error = new HTMLTransformError(
        'Transformation failed',
        'transform',
        html,
        cause,
      );

      const details = error.getDetails();

      expect(details).toContain('[transform]');
      expect(details).toContain('Transformation failed');
      expect(details).toContain('Phase: transform');
      expect(details).toContain('Code: PARSE_ERROR');
      expect(details).toContain('Caused by: Cause error');
      expect(details).toContain('HTML (first 200 chars):');
      // HTML is not long enough to be truncated
    });

    it('should truncate long HTML in details', () => {
      const longHtml = `<div>${'a'.repeat(300)}</div>`;
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
        content:
          'This is a very long text content that should be truncated in the error details output',
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
      const error = new PluginError('Failed', 'my-plugin', 'normalize', cause);

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
      const renderError = new LynxRenderError('Test', {
        kind: 'text',
        content: 'x',
      });
      const pluginError = new PluginError('Test', 'p', 'phase');

      expect(transformError instanceof Error).toBe(true);
      expect(renderError instanceof Error).toBe(true);
      expect(pluginError instanceof Error).toBe(true);
      expect(transformError instanceof HTMLTransformError).toBe(true);
      expect(renderError instanceof LynxRenderError).toBe(true);
      expect(pluginError instanceof PluginError).toBe(true);
    });
  });

  describe('Error Factory Functions', () => {
    describe('createParseError', () => {
      it('should create PARSE_ERROR type error', () => {
        const error = createParseError('Invalid HTML', '<div><span>');

        expect(error).toBeInstanceOf(HTMLTransformError);
        expect(error.code).toBe('PARSE_ERROR');
        expect(error.phase).toBe('parse');
        expect(error.html).toBe('<div><span>');
        expect(error.message).toContain('Invalid HTML');
      });

      it('should include cause when provided', () => {
        const cause = new Error('Original parsing error');
        const error = createParseError('Parse failed', '<broken>', cause);

        expect(error.cause).toBe(cause);
      });
    });

    describe('createUnsupportedTagError', () => {
      it('should create UNSUPPORTED_TAG type error', () => {
        const error = createUnsupportedTagError(
          'custom-element',
          'transform',
          '<custom-element>test</custom-element>',
        );

        expect(error).toBeInstanceOf(HTMLTransformError);
        expect(error.code).toBe('UNSUPPORTED_TAG');
        expect(error.phase).toBe('transform');
        expect(error.html).toBe('<custom-element>test</custom-element>');
        expect(error.message).toContain('Unsupported HTML tag: custom-element');
      });
    });

    describe('createStyleError', () => {
      it('should create STYLE_ERROR type error', () => {
        const error = createStyleError(
          'Invalid style value',
          'color: invalid;',
          'transform',
        );

        expect(error).toBeInstanceOf(HTMLTransformError);
        expect(error.code).toBe('STYLE_ERROR');
        expect(error.phase).toBe('transform');
        expect(error.message).toContain('Invalid style value');
      });

      it('should include cause when provided', () => {
        const cause = new Error('CSS parse error');
        const error = createStyleError(
          'Style parsing failed',
          'bad-style',
          'parse',
          cause,
        );

        expect(error.cause).toBe(cause);
      });
    });

    describe('createPluginError', () => {
      it('should create PluginError', () => {
        const error = createPluginError(
          'my-plugin',
          'Plugin execution failed',
          'transform',
        );

        expect(error).toBeInstanceOf(PluginError);
        expect(error.pluginName).toBe('my-plugin');
        expect(error.phase).toBe('transform');
        expect(error.message).toContain('my-plugin');
        expect(error.message).toContain('Plugin execution failed');
      });

      it('should include cause when provided', () => {
        const cause = new Error('Internal plugin error');
        const error = createPluginError(
          'css-plugin',
          'Failed to process CSS',
          'normalize',
          cause,
        );

        expect(error.cause).toBe(cause);
      });
    });
  });

  describe('Error Type Guards', () => {
    describe('isTransformError', () => {
      it('should return true for HTMLTransformError', () => {
        const error = new HTMLTransformError('Test', 'parse');
        expect(isTransformError(error)).toBe(true);
      });

      it('should return false for other errors', () => {
        expect(isTransformError(new Error('Test'))).toBe(false);
        expect(
          isTransformError(
            new LynxRenderError('Test', { kind: 'text', content: 'x' }),
          ),
        ).toBe(false);
        expect(isTransformError(new PluginError('Test', 'p', 'phase'))).toBe(
          false,
        );
        expect(isTransformError(null)).toBe(false);
        expect(isTransformError(undefined)).toBe(false);
        expect(isTransformError('string')).toBe(false);
      });
    });

    describe('isRenderError', () => {
      it('should return true for LynxRenderError', () => {
        const error = new LynxRenderError('Test', {
          kind: 'text',
          content: 'x',
        });
        expect(isRenderError(error)).toBe(true);
      });

      it('should return false for other errors', () => {
        expect(isRenderError(new Error('Test'))).toBe(false);
        expect(isRenderError(new HTMLTransformError('Test', 'parse'))).toBe(
          false,
        );
        expect(isRenderError(new PluginError('Test', 'p', 'phase'))).toBe(
          false,
        );
        expect(isRenderError(null)).toBe(false);
        expect(isRenderError(undefined)).toBe(false);
      });
    });

    describe('isPluginError', () => {
      it('should return true for PluginError', () => {
        const error = new PluginError('Test', 'plugin', 'phase');
        expect(isPluginError(error)).toBe(true);
      });

      it('should return false for other errors', () => {
        expect(isPluginError(new Error('Test'))).toBe(false);
        expect(isPluginError(new HTMLTransformError('Test', 'parse'))).toBe(
          false,
        );
        expect(
          isPluginError(
            new LynxRenderError('Test', { kind: 'text', content: 'x' }),
          ),
        ).toBe(false);
        expect(isPluginError(null)).toBe(false);
        expect(isPluginError(undefined)).toBe(false);
      });
    });
  });

  describe('getErrorCode', () => {
    it('should return code for HTMLTransformError', () => {
      const parseError = createParseError('Test', '<div>');
      const unsupportedError = createUnsupportedTagError(
        'custom',
        'transform',
        '<custom>',
      );
      const styleError = createStyleError('Test', 'bad', 'parse');

      expect(getErrorCode(parseError)).toBe('PARSE_ERROR');
      expect(getErrorCode(unsupportedError)).toBe('UNSUPPORTED_TAG');
      expect(getErrorCode(styleError)).toBe('STYLE_ERROR');
    });

    it('should return RENDER_ERROR for LynxRenderError', () => {
      const error = new LynxRenderError('Test', { kind: 'text', content: 'x' });
      expect(getErrorCode(error)).toBe('RENDER_ERROR');
    });

    it('should return PLUGIN_ERROR for PluginError', () => {
      const error = new PluginError('Test', 'plugin', 'phase');
      expect(getErrorCode(error)).toBe('PLUGIN_ERROR');
    });

    it('should return error name for generic Error', () => {
      const error = new Error('Test');
      expect(getErrorCode(error)).toBe('Error');

      const typeError = new TypeError('Test');
      expect(getErrorCode(typeError)).toBe('TypeError');
    });

    it('should return undefined for non-error values', () => {
      expect(getErrorCode(null)).toBeUndefined();
      expect(getErrorCode(undefined)).toBeUndefined();
      expect(getErrorCode('string')).toBeUndefined();
      expect(getErrorCode(123)).toBeUndefined();
      expect(getErrorCode({})).toBeUndefined();
    });
  });
});
