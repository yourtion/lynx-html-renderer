import { describe, expect, it } from 'vitest';
import { transformHTML } from '../../src/html-parser';

describe('CSS Class Mode Integration', () => {
  describe('transformHTML with styleMode option', () => {
    it('should add className instead of inline style in CSS class mode', () => {
      const html = '<p>Hello World</p>';
      const result = transformHTML(html, { styleMode: 'css-class' });

      expect(result).toHaveLength(1);
      expect(result[0].kind).toBe('element');
      expect(result[0].props.className).toBe('lhr-p');
      expect(result[0].props.style).toBeUndefined();
    });

    it('should add inline style in inline mode (backward compatibility)', () => {
      const html = '<p>Hello World</p>';
      const result = transformHTML(html, { styleMode: 'inline' });

      expect(result).toHaveLength(1);
      expect(result[0].kind).toBe('element');
      expect(result[0].props.style).toEqual({ marginBottom: '1em' });
      expect(result[0].props.className).toBeUndefined();
    });

    it('should default to inline mode when styleMode is not specified', () => {
      const html = '<p>Hello World</p>';
      const result = transformHTML(html);

      expect(result).toHaveLength(1);
      expect(result[0].props.style).toEqual({ marginBottom: '1em' });
      expect(result[0].props.className).toBeUndefined();
    });

    it('should preserve inline style from HTML attributes in CSS class mode', () => {
      const html = '<p style="color: red;">Hello</p>';
      const result = transformHTML(html, { styleMode: 'css-class' });

      expect(result).toHaveLength(1);
      expect(result[0].props.className).toBe('lhr-p');
      expect(result[0].props.style).toEqual({ color: 'red' });
    });

    it('should merge defaultStyle className with HTML class attribute', () => {
      const html = '<p class="custom-class">Hello World</p>';
      const result = transformHTML(html, {
        styleMode: 'css-class',
        removeAllClass: false,
      });

      expect(result).toHaveLength(1);
      expect(result[0].props.className).toContain('lhr-p');
      expect(result[0].props.className).toContain('custom-class');
    });

    it('should handle both HTML class and style attributes together', () => {
      const html = '<p class="my-class" style="color: blue;">Text</p>';
      const result = transformHTML(html, {
        styleMode: 'css-class',
        removeAllClass: false,
      });

      expect(result).toHaveLength(1);
      expect(result[0].props.className).toContain('lhr-p');
      expect(result[0].props.className).toContain('my-class');
      expect(result[0].props.style).toEqual({ color: 'blue' });
    });

    it('should handle multiple elements with different tags', () => {
      const html = '<h1>Title</h1><p>Paragraph</p><div>Container</div>';
      const result = transformHTML(html, { styleMode: 'css-class' });

      expect(result).toHaveLength(3);

      expect(result[0].props.className).toBe('lhr-h1');
      expect(result[0].props.style).toBeUndefined();

      expect(result[1].props.className).toBe('lhr-p');
      expect(result[1].props.style).toBeUndefined();

      expect(result[2].props.className).toBe('lhr-div');
      expect(result[2].props.style).toBeUndefined();
    });

    it('should handle nested elements correctly', () => {
      const html = '<div><p>Nested paragraph</p></div>';
      const result = transformHTML(html, { styleMode: 'css-class' });

      expect(result).toHaveLength(1);
      expect(result[0].kind).toBe('element');
      expect(result[0].props.className).toBe('lhr-div');
      expect(result[0].children).toHaveLength(1);

      const child = result[0].children[0];
      expect(child.kind).toBe('element');
      expect(child.props.className).toBe('lhr-p');
    });

    it('should handle elements without defaultStyle', () => {
      const html = '<span>Inline text</span>';
      const result = transformHTML(html, { styleMode: 'css-class' });

      expect(result).toHaveLength(1);
      // span has no defaultStyle in TAG_MAP
      expect(result[0].props.className).toBeUndefined();
      expect(result[0].props.style).toBeUndefined();
    });

    it('should handle inline formatting tags (strong, em, etc.)', () => {
      const html = '<p>Text with <strong>bold</strong> and <em>italic</em></p>';
      const result = transformHTML(html, { styleMode: 'css-class' });

      expect(result).toHaveLength(1);
      expect(result[0].props.className).toBe('lhr-p');

      // Inline formatting tags use marks, not className
      const textNode = result[0].children[1];
      expect(textNode.kind).toBe('text');
      expect(textNode.marks?.bold).toBe(true);
    });

    it('should handle blockquote with complex defaultStyle', () => {
      const html = '<blockquote>A quote</blockquote>';
      const result = transformHTML(html, { styleMode: 'css-class' });

      expect(result).toHaveLength(1);
      expect(result[0].props.className).toBe('lhr-blockquote');
      expect(result[0].props.style).toBeUndefined();
    });

    it('should handle table elements correctly', () => {
      const html = '<table><tr><th>Header</th><td>Cell</td></tr></table>';
      const result = transformHTML(html, { styleMode: 'css-class' });

      expect(result).toHaveLength(1);
      const table = result[0];
      expect(table.props.className).toBe('lhr-table');

      const row = table.children[0];
      expect(row.kind).toBe('element');
      expect(row.props.className).toBe('lhr-tr');

      expect(row.children[0].props.className).toBe('lhr-th');
      expect(row.children[1].props.className).toBe('lhr-td');
    });

    it('should removeAllStyle option work with CSS class mode', () => {
      const html = '<p class="my-class" style="color: red;">Text</p>';
      const result = transformHTML(html, {
        styleMode: 'css-class',
        removeAllStyle: true,
        removeAllClass: false,
      });

      expect(result[0].props.className).toContain('lhr-p');
      expect(result[0].props.className).toContain('my-class');
      // HTML style attribute should be removed
      expect(result[0].props.style).toBeUndefined();
    });
  });

  describe('Style priority', () => {
    it('should preserve HTML inline style when defaultStyle exists', () => {
      const html = '<p style="margin-bottom: 2em; color: blue;">Text</p>';
      const result = transformHTML(html, { styleMode: 'css-class' });

      // In CSS class mode, only HTML inline styles are in props.style
      expect(result[0].props.style).toEqual({
        marginBottom: '2em',
        color: 'blue',
      });
      // defaultStyle is applied via className
      expect(result[0].props.className).toBe('lhr-p');
    });
  });

  describe('Backward compatibility', () => {
    it('should not break existing code that does not specify styleMode', () => {
      const html = '<p>Test</p>';
      const result1 = transformHTML(html);
      const result2 = transformHTML(html, { styleMode: 'inline' });

      expect(result1).toEqual(result2);
      expect(result1[0].props.style).toBeDefined();
      expect(result1[0].props.className).toBeUndefined();
    });

    it('should handle removeAllStyle option correctly in both modes', () => {
      const html = '<p style="color: red;">Text</p>';

      // CSS class mode
      const result1 = transformHTML(html, {
        styleMode: 'css-class',
        removeAllStyle: true,
      });
      // removeAllStyle只移除HTML的style属性，defaultStyle通过className应用
      expect(result1[0].props.style).toBeUndefined();
      expect(result1[0].props.className).toBe('lhr-p');

      // Inline mode
      const result2 = transformHTML(html, {
        styleMode: 'inline',
        removeAllStyle: true,
      });
      // removeAllStyle只移除HTML的style属性，defaultStyle仍然作为inline style存在
      expect(result2[0].props.style).toEqual({ marginBottom: '1em' });
      expect(result2[0].props.className).toBeUndefined();
    });
  });
});
