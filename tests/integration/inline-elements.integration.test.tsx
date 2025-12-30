/**
 * Inline Elements Integration Tests
 *
 * Tests for inline HTML elements:
 * - Text formatting: strong, b, em, i, u, code
 * - Links: a
 * - Inline containers: span
 * - Images: img
 */

import '@testing-library/jest-dom';
import { HTMLRenderer } from '@lynx-html-renderer/index';
import { render } from '@lynx-js/react/testing-library';
import { describe, expect, it } from 'vitest';

describe('Inline Elements Integration Tests', () => {
  describe('Text Formatting - Bold', () => {
    it('should render strong element with bold styling', () => {
      const html = '<strong>Bold text</strong>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      expect(text).toBeDefined();
      expect(text?.textContent).toBe('Bold text');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-weight');
      expect(style).toContain('bold');
    });

    it('should render b element with bold styling', () => {
      const html = '<b>Bold text</b>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      expect(text?.textContent).toBe('Bold text');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-weight');
      expect(style).toContain('bold');
    });

    it('should render nested strong elements', () => {
      const html = '<strong>Outer <strong>inner</strong> bold</strong>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe('Outer inner bold');
    });
  });

  describe('Text Formatting - Italic', () => {
    it('should render em element with italic styling', () => {
      const html = '<em>Italic text</em>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      expect(text?.textContent).toBe('Italic text');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-style');
      expect(style).toContain('italic');
    });

    it('should render i element with italic styling', () => {
      const html = '<i>Italic text</i>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      expect(text?.textContent).toBe('Italic text');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-style');
      expect(style).toContain('italic');
    });

    it('should render nested em elements', () => {
      const html = '<em>Outer <em>inner</em> italic</em>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe('Outer inner italic');
    });
  });

  describe('Text Formatting - Underline', () => {
    it('should render u element with underline styling', () => {
      const html = '<u>Underlined text</u>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      expect(text?.textContent).toBe('Underlined text');
      const style = text?.getAttribute('style');
      expect(style).toContain('text-decoration');
      expect(style).toContain('underline');
    });

    it('should render nested u elements', () => {
      const html = '<u>Outer <u>inner</u> underline</u>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe('Outer inner underline');
    });
  });

  describe('Text Formatting - Code', () => {
    it('should render code element with monospace styling', () => {
      const html = '<code>const x = 1;</code>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      expect(text?.textContent).toBe('const x = 1;');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-family');
      expect(style).toContain('monospace');
    });

    it('should render code with special characters', () => {
      const html = '<code>&lt;div&gt;code&lt;/div&gt;</code>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('<div>code</div>');
    });
  });

  describe('Combined Text Formatting', () => {
    it('should render strong + u combination', () => {
      const html = '<strong><u>Bold and underlined</u></strong>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe('Bold and underlined');
    });

    it('should render em + code combination', () => {
      const html = '<em><code>italic code</code></em>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe('italic code');
    });

    it('should render multiple formatting combinations', () => {
      const html =
        'Text with <strong>bold</strong>, <em>italic</em>, and <u>underline</u>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe(
        'Text with bold, italic, and underline',
      );
    });

    it('should render nested formatting elements', () => {
      const html =
        '<strong>Bold with <em>italic inside</em> and more bold</strong>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe(
        'Bold with italic inside and more bold',
      );
    });

    it('should render complex nested formatting', () => {
      const html =
        '<strong>Bold <u>and underline <em>with italic</em></u></strong>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe('Bold and underline with italic');
    });
  });

  describe('Link Element', () => {
    it('should render a element', () => {
      const html = '<a href="#">Link text</a>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      expect(text).toBeDefined();
      expect(text?.textContent).toContain('Link text');
      const style = text?.getAttribute('style');
      expect(style).toContain('color');
      // text-decoration is not an inheritable property, so it's not passed to text nodes
      expect(style).not.toContain('text-decoration');
    });

    it('should render a with href attribute', () => {
      const html = '<a href="https://example.com">Example Link</a>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Example Link');
    });

    it('should render multiple links', () => {
      const html = '<p><a href="#">Link 1</a> and <a href="#">Link 2</a></p>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Link 1');
      expect(container.textContent).toContain('Link 2');
    });
  });

  describe('Inline Container - Span', () => {
    it('should render span element', () => {
      const html = '<span>Span text</span>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      expect(text).toBeDefined();
      expect(text?.textContent).toBe('Span text');
    });

    it('should render span with inline style', () => {
      const html = '<span style="color: red;">Red text</span>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe('Red text');
    });

    it('should render nested spans', () => {
      const html = '<span>Outer <span>inner</span> span</span>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe('Outer inner span');
    });
  });

  describe('Paragraph with Inline Elements', () => {
    it('should render paragraph with inline elements', () => {
      const html = '<p>Text with <strong>bold</strong> and <em>italic</em></p>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe('Text with bold and italic');
    });

    it('should render paragraph with multiple inline elements', () => {
      const html =
        '<p>Start <strong>bold</strong> middle <em>italic</em> end <u>underline</u></p>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe(
        'Start bold middle italic end underline',
      );
    });

    it('should render paragraph with code element', () => {
      const html = '<p>Inline code: <code>console.log("hello")</code></p>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Inline code:');
      expect(container.textContent).toContain('console.log("hello")');
    });
  });

  describe('Image Elements', () => {
    it('should render img element with src attribute', () => {
      const html = '<img src="https://example.com/image.jpg" />';
      const { container } = render(<HTMLRenderer html={html} />);

      const image = container.querySelector('image');
      expect(image).toBeDefined();
      expect(image?.getAttribute('src')).toBe('https://example.com/image.jpg');
    });

    it('should render img with alt attribute', () => {
      const html = '<img src="test.jpg" alt="Test image" />';
      const { container } = render(<HTMLRenderer html={html} />);

      const image = container.querySelector('image');
      expect(image?.getAttribute('src')).toBe('test.jpg');
    });

    it('should render img with inline style', () => {
      const html = '<img src="test.jpg" style="width: 100px;" />';
      const { container } = render(<HTMLRenderer html={html} />);

      const image = container.querySelector('image');
      expect(image).toBeDefined();
      const style = image?.getAttribute('style');
      expect(style).toContain('width');
    });

    it('should render img with common attributes', () => {
      const html =
        '<img src="photo.jpg" alt="Photo" width="200" height="100" />';
      const { container } = render(<HTMLRenderer html={html} />);

      const image = container.querySelector('image');
      expect(image?.getAttribute('src')).toBe('photo.jpg');
    });

    it('should render multiple images', () => {
      const html = '<div><img src="1.jpg" /><img src="2.jpg" /></div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const images = container.querySelectorAll('image');
      expect(images.length).toBe(2);
    });

    it('should render img with data URL', () => {
      const html = '<img src="data:image/png;base64,abc123" />';
      const { container } = render(<HTMLRenderer html={html} />);

      const image = container.querySelector('image');
      expect(image?.getAttribute('src')).toBe('data:image/png;base64,abc123');
    });
  });

  describe('Complex Inline Scenarios', () => {
    it('should render mixed content with all inline elements', () => {
      const html = `
        <p>
          This is a paragraph with <strong>bold text</strong>,
          <em>italic text</em>, <u>underlined text</u>,
          and <code>inline code</code>.
          It also has a <a href="#">link</a> and a <span>span element</span>.
        </p>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('This is a paragraph');
      expect(container.textContent).toContain('bold text');
      expect(container.textContent).toContain('italic text');
      expect(container.textContent).toContain('underlined text');
      expect(container.textContent).toContain('inline code');
      expect(container.textContent).toContain('link');
      expect(container.textContent).toContain('span element');
    });

    it('should render nested inline combinations', () => {
      const html =
        '<strong>Bold with <em>italic <u>and underline</u> inside</em></strong>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe(
        'Bold with italic and underline inside',
      );
    });

    it('should render content with inline elements and images', () => {
      const html = `
        <div>
          <p>Text before image</p>
          <img src="test.jpg" alt="Test" />
          <p>Text after image with <strong>bold</strong></p>
        </div>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Text before image');
      expect(container.textContent).toContain('Text after image');
      expect(container.textContent).toContain('bold');
    });
  });
});
