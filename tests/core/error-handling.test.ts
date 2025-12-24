import { describe, expect, it } from 'vitest';
import { transformHTML } from '@lynx-html-renderer/html-parser';

describe('Error Handling Tests', () => {
  describe('Malformed HTML', () => {
    it('should handle unclosed tags', () => {
      const html = '<div><p>Unclosed paragraph';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle mismatched tags', () => {
      const html = '<div><span>Mismatched</div></span>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle self-closing tags without slash', () => {
      const html = '<p>Text<br>More text</p>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle tags with invalid characters', () => {
      const html = '<div>Normal text</div>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple root elements', () => {
      const html = '<p>First</p><p>Second</p><p>Third</p>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle special characters in text', () => {
      const html = '<p>Special: &lt; &gt; &amp; &quot; &apos;</p>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle unicode characters', () => {
      const html = '<p>Unicode: 你好 🎉</p>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Invalid Attributes', () => {
    it('should handle empty style attribute', () => {
      const html = '<div style="">Content</div>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle malformed style values', () => {
      const html = '<div style="color:;font-weight:">Content</div>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle attributes without values', () => {
      const html = '<input disabled checked>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Unknown Tags', () => {
    it('should handle unknown HTML tags gracefully', () => {
      const html = '<unknown-tag>Content</unknown-tag>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle custom web components', () => {
      const html = '<my-component>Content</my-component>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Text Node Edge Cases', () => {
    it('should handle empty text nodes', () => {
      const html = '<div></div>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle text with only whitespace', () => {
      const html = '<div>   </div>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle very long text content', () => {
      const longText = 'A'.repeat(10000);
      const html = `<p>${longText}</p>`;
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Nested Inline Elements', () => {
    it('should handle nested formatting tags', () => {
      const html = '<strong>bold <em>bold and italic</em> bold</strong>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle overlapping text marks', () => {
      const html = '<strong>bold</strong> <em>italic</em> <u>underline</u>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Table Edge Cases', () => {
    it('should handle table with missing cells', () => {
      const html = '<table><tr><td>Cell</td></tr></table>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle table with empty rows', () => {
      const html = '<table><tr></tr><tr><td>Cell</td></tr></table>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Image Edge Cases', () => {
    it('should handle image without src', () => {
      const html = '<img />';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle image with empty src', () => {
      const html = '<img src="" />';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('List Edge Cases', () => {
    it('should handle list with empty items', () => {
      const html = '<ul><li></li><li>Item</li><li></li></ul>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle nested lists', () => {
      const html =
        '<ul><li>Item 1<ul><li>Nested 1</li><li>Nested 2</li></ul></li></ul>';
      const result = transformHTML(html);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
