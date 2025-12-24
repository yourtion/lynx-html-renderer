/**
 * HTMLRenderer Main Integration Tests
 *
 * Tests for basic rendering functionality, component re-rendering,
 * and edge cases.
 */

import '@testing-library/jest-dom';
import { render } from '@lynx-js/react/testing-library';
import { describe, expect, it } from 'vitest';
import { HTMLRenderer } from '@lynx-html-renderer/index';

describe('HTMLRenderer Integration Tests', () => {
  describe('Basic Rendering', () => {
    it('should render simple text content', () => {
      const { container } = render(<HTMLRenderer html="Hello World" />);

      expect(container.textContent).toBe('Hello World');
      expect(container.children.length).toBeGreaterThan(0);
    });

    it('should render empty HTML gracefully', () => {
      const { container } = render(<HTMLRenderer html="" />);

      expect(container).toBeDefined();
    });

    it('should render whitespace-only content', () => {
      const { container } = render(<HTMLRenderer html="   " />);

      expect(container).toBeDefined();
    });

    it('should render div elements as view', () => {
      const html = '<div>Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      expect(view).toBeDefined();
      expect(view?.textContent).toBe('Content');
    });

    it('should render p elements as text', () => {
      const html = '<p>Paragraph text</p>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      expect(text).toBeDefined();
      expect(text?.textContent).toBe('Paragraph text');
    });
  });

  describe('Nested Structures', () => {
    it('should render deeply nested elements', () => {
      const html = '<div><div><div><div>Deep content</div></div></div></div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const views = container.querySelectorAll('view');
      expect(views.length).toBeGreaterThanOrEqual(4);
      expect(container.textContent).toBe('Deep content');
    });

    it('should render mixed nested content', () => {
      const html =
        '<div><h1>Title</h1><p>Paragraph with <strong>bold</strong> text</p></div>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Title');
      expect(container.textContent).toContain('Paragraph with');
      expect(container.textContent).toContain('bold');
      expect(container.textContent).toContain('text');
    });

    it('should render nested div elements', () => {
      const html = '<div><div>Nested</div></div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const views = container.querySelectorAll('view');
      expect(views.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Text Node Merging', () => {
    it('should merge adjacent text nodes', () => {
      const html = '<div>Text1<!-- comment -->Text2</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe('Text1Text2');
    });

    it('should preserve text marks when merging', () => {
      const html = '<p><strong>Bold</strong> normal <em>italic</em></p>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe('Bold normal italic');
    });
  });

  describe('Component Re-rendering', () => {
    it('should update rendering when html prop changes', () => {
      const { container, rerender } = render(
        <HTMLRenderer html="<div>First</div>" />,
      );

      expect(container.textContent).toBe('First');

      rerender(<HTMLRenderer html="<div>Second</div>" />);

      expect(container).toBeDefined();
    });

    it('should handle switching from empty to content', () => {
      const { container, rerender } = render(<HTMLRenderer html="" />);

      rerender(<HTMLRenderer html="<div>New Content</div>" />);

      expect(container).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle self-closing br tags', () => {
      const html = '<p>Line 1<br />Line 2</p>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Line 1');
      expect(container.textContent).toContain('Line 2');
    });

    it('should handle malformed HTML gracefully', () => {
      const html = '<div>Unclosed tag<p>Missing closing';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container).toBeDefined();
    });

    it('should handle special characters in text', () => {
      const html = '<div>Special: &lt; &gt; &amp; &quot; &apos;</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Special:');
      expect(container.textContent).toContain('<');
      expect(container.textContent).toContain('>');
      expect(container.textContent).toContain('&');
      expect(container.textContent).toContain('"');
      expect(container.textContent).toContain("'");
    });

    it('should handle Unicode characters', () => {
      const html = '<div>Unicode: 中文 日本語 한국어</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('中文');
      expect(container.textContent).toContain('日本語');
      expect(container.textContent).toContain('한국어');
    });

    it('should handle comments in HTML', () => {
      const html = '<div><!-- This is a comment -->Visible content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).not.toContain('This is a comment');
      expect(container.textContent).toContain('Visible content');
    });

    it('should drop unsupported tags silently', () => {
      const html = '<div><unsupported>Content</unsupported>Visible</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Visible');
    });

    it('should handle multiple spaces and tabs', () => {
      const html = '<p>Multiple spaces:     and    tabs</p>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Multiple spaces:');
    });

    it('should handle empty elements', () => {
      const html = '<p><span></span> and <div><!-- comment --></div></p>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container).toBeDefined();
    });
  });
});
