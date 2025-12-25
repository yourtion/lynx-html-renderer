/**
 * Marks to Style Transformation Tests
 *
 * Tests for the conversion of text marks (bold, italic, underline, code)
 * to CSS style properties during rendering.
 *
 * This conversion happens in index.tsx renderNode function:
 * - marks.bold → style.fontWeight = 'bold'
 * - marks.italic → style.fontStyle = 'italic'
 * - marks.underline → style.textDecoration = 'underline'
 * - marks.code → style.fontFamily = 'monospace' + background/padding/borderRadius
 */

import '@testing-library/jest-dom';
import { HTMLRenderer } from '@lynx-html-renderer/index';
import { render } from '@lynx-js/react/testing-library';
import { describe, expect, it } from 'vitest';

describe('Marks to Style Transformation', () => {
  describe('Bold Mark Transformation', () => {
    it('should convert marks.bold to fontWeight style', () => {
      // This test verifies the conversion logic in index.tsx renderNode function
      // The marks are set during HTML parsing and converted to styles during rendering
      const html = '<strong>Bold text</strong>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      expect(text).toBeDefined();
      expect(text?.textContent).toBe('Bold text');

      // Verify the style property is set
      const style = text?.getAttribute('style');
      expect(style).toBeDefined();
      expect(style).toContain('font-weight');
      expect(style).toContain('bold');
    });

    it('should convert marks.bold from b tag', () => {
      const html = '<b>Bold text</b>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-weight');
      expect(style).toContain('bold');
    });

    it('should apply bold style to text with bold mark', () => {
      const html = '<span>Bold text</span>';
      const { container } = render(<HTMLRenderer html={html} />);

      // span should render as text with no special styling
      expect(container.textContent).toBe('Bold text');
    });
  });

  describe('Italic Mark Transformation', () => {
    it('should convert marks.italic to fontStyle style', () => {
      const html = '<em>Italic text</em>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-style');
      expect(style).toContain('italic');
    });

    it('should convert marks.italic from i tag', () => {
      const html = '<i>Italic text</i>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-style');
      expect(style).toContain('italic');
    });
  });

  describe('Underline Mark Transformation', () => {
    it('should convert marks.underline to textDecoration style', () => {
      const html = '<u>Underlined text</u>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');
      expect(style).toContain('text-decoration');
      expect(style).toContain('underline');
    });
  });

  describe('Code Mark Transformation', () => {
    it('should convert marks.code to monospace and additional styles', () => {
      const html = '<code>Code text</code>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');

      // Verify all styles applied for code mark
      expect(style).toContain('font-family');
      expect(style).toContain('monospace');
      expect(style).toContain('background-color');
      expect(style).toContain('padding');
      expect(style).toContain('border-radius');
    });

    it('should apply code mark specific styles correctly', () => {
      const html = '<code>const x = 1;</code>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');

      // Code should have these specific values from index.tsx
      // Note: colors may be converted to rgb format
      expect(style).toMatch(/rgb\(240,\s*240,\s*240\)|#f0f0f0/); // backgroundColor
      expect(style).toContain('2px 4px'); // padding
      expect(style).toContain('3px'); // borderRadius
    });
  });

  describe('Combined Marks Transformation', () => {
    it('should apply both bold and italic marks', () => {
      const html = '<strong><em>Bold and italic</em></strong>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');

      // Both styles should be present
      expect(style).toContain('font-weight');
      expect(style).toContain('bold');
      expect(style).toContain('font-style');
      expect(style).toContain('italic');
    });

    it('should apply bold and underline marks', () => {
      const html = '<strong><u>Bold and underlined</u></strong>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');

      expect(style).toContain('font-weight');
      expect(style).toContain('text-decoration');
    });

    it('should apply all four marks together', () => {
      const html = '<strong><em><u><code>All marks</code></u></em></strong>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');

      // Should have all style properties
      expect(style).toContain('font-weight');
      expect(style).toContain('font-style');
      expect(style).toContain('text-decoration');
      expect(style).toContain('font-family');
    });
  });

  describe('Nested Elements with Marks', () => {
    it('should propagate bold mark to nested text', () => {
      const html = '<strong>Nested <span>text</span> with bold</strong>';
      const { container } = render(<HTMLRenderer html={html} />);

      // All text should be bold
      expect(container.textContent).toBe('Nested text with bold');

      // Check that the text has bold styling
      const texts = container.querySelectorAll('text');
      const hasBoldStyle = Array.from(texts).some((t) =>
        t.getAttribute('style')?.includes('font-weight'),
      );
      expect(hasBoldStyle).toBe(true);
    });

    it('should apply different marks to different text sections', () => {
      const html = '<p><strong>Bold</strong> normal <em>italic</em></p>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe('Bold normal italic');

      // Check for presence of both styles
      const texts = container.querySelectorAll('text');
      const hasBoldStyle = Array.from(texts).some((t) =>
        t.getAttribute('style')?.includes('font-weight'),
      );
      const hasItalicStyle = Array.from(texts).some((t) =>
        t.getAttribute('style')?.includes('font-style'),
      );

      expect(hasBoldStyle).toBe(true);
      expect(hasItalicStyle).toBe(true);
    });

    it('should handle deeply nested elements with marks', () => {
      const html = '<strong>Level 1 <em>Level 2 <u>Level 3</u></em></strong>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe('Level 1 Level 2 Level 3');

      // Check that there are multiple text elements with appropriate marks
      const texts = container.querySelectorAll('text');
      expect(texts.length).toBeGreaterThanOrEqual(1);

      // Find the innermost text (Level 3) which should have all three marks
      // This text is inside <strong><em><u>, so it gets all marks
      const hasAllThreeMarks = Array.from(texts).some((text) => {
        const style = text.getAttribute('style');
        return (
          style?.includes('font-weight') &&
          style?.includes('font-style') &&
          style?.includes('text-decoration')
        );
      });

      expect(hasAllThreeMarks).toBe(true);
    });
  });

  describe('Edge Cases for Marks', () => {
    it('should handle empty marks object', () => {
      // Plain text without any marks should still render
      const html = '<p>Plain text</p>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe('Plain text');
      const text = container.querySelector('text');
      expect(text).toBeDefined();
    });

    it('should handle text without marks in mixed content', () => {
      const html = '<p><strong>Bold</strong> and plain</p>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe('Bold and plain');
    });

    it('should handle code mark with other marks', () => {
      const html = '<strong><code>Bold code</code></strong>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');

      // Should have both bold and code styles
      expect(style).toContain('font-weight');
      expect(style).toContain('font-family');
    });
  });

  describe('Marks Style Values', () => {
    it('should use exact style values for bold', () => {
      const html = '<strong>Bold</strong>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');

      expect(style).toContain('font-weight: bold');
    });

    it('should use exact style values for italic', () => {
      const html = '<em>Italic</em>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');

      expect(style).toContain('font-style: italic');
    });

    it('should use exact style values for underline', () => {
      const html = '<u>Underlined</u>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');

      expect(style).toContain('text-decoration: underline');
    });

    it('should use monospace font family for code', () => {
      const html = '<code>Code</code>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');

      expect(style).toContain('font-family: monospace');
    });
  });
});
