import '@testing-library/jest-dom';
import {
  createDefaultRegistry,
  HTMLRenderer,
  renderHTMLDirect,
} from '@lynx-html-renderer/index';
import { render } from '@lynx-js/react/testing-library';
import React from 'react';
import { describe, expect, it } from 'vitest';

describe('Adapters and Rendering', () => {
  describe('renderHTMLDirect', () => {
    it('should render in css-class mode with dark mode', () => {
      const result = renderHTMLDirect({
        html: '<p>Hello</p>',
        styleMode: 'css-class',
        darkMode: true,
      });
      expect(result).toBeDefined();
    });

    it('should render in css-class mode without dark mode', () => {
      const result = renderHTMLDirect({
        html: '<p>Hello</p>',
        styleMode: 'css-class',
        darkMode: false,
      });
      expect(result).toBeDefined();
    });

    it('should render in inline mode', () => {
      const result = renderHTMLDirect({
        html: '<p>Hello</p>',
        styleMode: 'inline',
      });
      expect(result).toBeDefined();
    });

    it('should use custom rootClassName in css-class mode', () => {
      const result = renderHTMLDirect({
        html: '<p>Hello</p>',
        styleMode: 'css-class',
        rootClassName: 'custom-root',
      });
      expect(result).toBeDefined();
    });
  });

  describe('text node with marks', () => {
    it('should render text with bold marks', () => {
      const { container } = render(
        <HTMLRenderer html="<strong>Bold text</strong>" />,
      );
      expect(container.textContent).toContain('Bold text');
    });

    it('should render text with italic marks', () => {
      const { container } = render(
        <HTMLRenderer html="<em>Italic text</em>" />,
      );
      expect(container.textContent).toContain('Italic text');
    });

    it('should render text with underline marks', () => {
      const { container } = render(
        <HTMLRenderer html="<u>Underline text</u>" />,
      );
      expect(container.textContent).toContain('Underline text');
    });

    it('should render text with code marks', () => {
      const { container } = render(
        <HTMLRenderer html="<code>Code text</code>" />,
      );
      expect(container.textContent).toContain('Code text');
    });

    it('should render text with inheritableClasses', () => {
      const { container } = render(
        <HTMLRenderer html="<p>Styled</p>" styleMode="css-class" />,
      );
      expect(container.textContent).toContain('Styled');
    });
  });

  describe('HTMLRenderer.render', () => {
    it('should expose render function', () => {
      expect(
        typeof (HTMLRenderer as unknown as { render: unknown }).render,
      ).toBe('function');
    });

    it('should render via render function in inline mode', () => {
      const result = (
        HTMLRenderer as unknown as {
          render: (props: { html: string }) => unknown;
        }
      ).render({ html: '<p>Direct render</p>' });
      expect(result).toBeDefined();
    });

    it('should render via render function in css-class mode', () => {
      const result = (
        HTMLRenderer as unknown as {
          render: (props: {
            html: string;
            styleMode: string;
            darkMode: boolean;
          }) => unknown;
        }
      ).render({
        html: '<p>Direct CSS class</p>',
        styleMode: 'css-class',
        darkMode: true,
      });
      expect(result).toBeDefined();
    });
  });

  describe('ImageAdapter', () => {
    it('should render image element without children', () => {
      const { container } = render(
        <HTMLRenderer html='<img src="test.png" />' />,
      );
      const img = container.querySelector('image');
      expect(img).toBeDefined();
    });
  });

  describe('text-normalizer integration', () => {
    it('should normalize text with inheritable classes in css-class mode', () => {
      const { container } = render(
        <HTMLRenderer
          html="<p><span>styled text</span></p>"
          styleMode="css-class"
        />,
      );
      expect(container.textContent).toContain('styled text');
    });

    it('should normalize text with inheritable styles in inline mode', () => {
      const { container } = render(
        <HTMLRenderer
          html="<p><strong>bold styled</strong></p>"
          styleMode="inline"
        />,
      );
      expect(container.textContent).toContain('bold styled');
    });

    it('should handle nested text elements with className merging', () => {
      const { container } = render(
        <HTMLRenderer
          html='<div class="outer"><p class="inner">content</p></div>'
          styleMode="css-class"
          removeAllClass={false}
        />,
      );
      expect(container.textContent).toContain('content');
    });
  });

  describe('createDefaultRegistry role adapters', () => {
    it('should resolve cell adapter and handle non-text children', () => {
      const registry = createDefaultRegistry();
      const viewElement = React.createElement('view', null, 'content');
      const node = {
        kind: 'element' as const,
        tag: 'cell-tag',
        props: {
          style: { padding: '8px', color: 'red' },
        },
        children: [] as never[],
        role: 'cell' as const,
      };
      const adapter = registry.resolve(node);
      const ctx = {
        renderChildren: () => [viewElement],
      };
      const result = adapter.render(node, ctx as never);
      expect(result).toBeDefined();
    });

    it('should resolve cell adapter without style', () => {
      const registry = createDefaultRegistry();
      const node = {
        kind: 'element' as const,
        tag: 'cell-tag',
        props: {},
        children: [] as never[],
        role: 'cell' as const,
      };
      const adapter = registry.resolve(node);
      const ctx = { renderChildren: () => [] };
      const result = adapter.render(node, ctx as never);
      expect(result).toBeDefined();
    });

    it('should resolve table adapter via role', () => {
      const registry = createDefaultRegistry();
      const node = {
        kind: 'element' as const,
        tag: 'custom-table',
        props: { style: { borderWidth: '1px' } },
        children: [] as never[],
        role: 'table' as const,
      };
      const adapter = registry.resolve(node);
      const ctx = { renderChildren: () => [] };
      const result = adapter.render(node, ctx as never);
      expect(result).toBeDefined();
    });

    it('should resolve row adapter via role', () => {
      const registry = createDefaultRegistry();
      const node = {
        kind: 'element' as const,
        tag: 'custom-row',
        props: { style: { flexDirection: 'row' } },
        children: [] as never[],
        role: 'row' as const,
      };
      const adapter = registry.resolve(node);
      const ctx = { renderChildren: () => [] };
      const result = adapter.render(node, ctx as never);
      expect(result).toBeDefined();
    });
  });
});
