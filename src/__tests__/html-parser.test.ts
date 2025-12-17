import { describe, it, expect } from 'vitest';
import { transformHTML } from '../html-parser.js';
import type { LynxNode } from '../typings.js';

describe('HTML Parser', () => {
  describe('Basic Text Nodes', () => {
    it('should transform simple text correctly', () => {
      const html = 'Hello World';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        {
          kind: 'text',
          content: 'Hello World',
        },
      ]);
    });

    it('should merge adjacent text nodes', () => {
      const html = 'Hello <span> </span> World';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        {
          kind: 'text',
          content: 'Hello ',
        },
        {
          kind: 'element',
          tag: 'text',
          props: {},
          children: [],
          meta: { sourceTag: 'span' },
        },
        {
          kind: 'text',
          content: ' World',
        },
      ]);
    });

    it('should handle multiple text nodes', () => {
      const html = '<div>Text 1</div><div>Text 2</div>';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'view',
          props: { style: { flexDirection: 'column' } },
          children: [
            { kind: 'text', content: 'Text 1' },
          ],
          meta: { sourceTag: 'div' },
        },
        {
          kind: 'element',
          tag: 'view',
          props: { style: { flexDirection: 'column' } },
          children: [
            { kind: 'text', content: 'Text 2' },
          ],
          meta: { sourceTag: 'div' },
        },
      ]);
    });
  });

  describe('HTML Tags Transformation', () => {
    it('should transform div to view with correct style', () => {
      const html = '<div>Content</div>';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'view',
          props: { style: { flexDirection: 'column' } },
          children: [
            { kind: 'text', content: 'Content' },
          ],
          meta: { sourceTag: 'div' },
        },
      ]);
    });

    it('should transform section to view', () => {
      const html = '<section>Section Content</section>';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'view',
          props: { style: { flexDirection: 'column' } },
          children: [
            { kind: 'text', content: 'Section Content' },
          ],
          meta: { sourceTag: 'section' },
        },
      ]);
    });

    it('should transform p to text with marginBottom', () => {
      const html = '<p>Paragraph</p>';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'text',
          props: { style: { marginBottom: '1em' } },
          children: [
            { kind: 'text', content: 'Paragraph' },
          ],
          meta: { sourceTag: 'p' },
        },
      ]);
    });

    it('should transform span to text', () => {
      const html = '<span>Span Text</span>';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'text',
          props: {},
          children: [
            { kind: 'text', content: 'Span Text' },
          ],
          meta: { sourceTag: 'span' },
        },
      ]);
    });

    it('should transform strong to text with fontWeight bold', () => {
      const html = '<strong>Bold Text</strong>';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'text',
          props: { style: { fontWeight: 'bold' } },
          children: [
            { kind: 'text', content: 'Bold Text' },
          ],
          meta: { sourceTag: 'strong' },
        },
      ]);
    });

    it('should transform b to text with fontWeight bold', () => {
      const html = '<b>Bold Text</b>';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'text',
          props: { style: { fontWeight: 'bold' } },
          children: [
            { kind: 'text', content: 'Bold Text' },
          ],
          meta: { sourceTag: 'b' },
        },
      ]);
    });

    it('should transform em to text with fontStyle italic', () => {
      const html = '<em>Italic Text</em>';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'text',
          props: { style: { fontStyle: 'italic' } },
          children: [
            { kind: 'text', content: 'Italic Text' },
          ],
          meta: { sourceTag: 'em' },
        },
      ]);
    });

    it('should transform img to image element', () => {
      const html = '<img src="test.jpg" alt="Test Image" />';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'image',
          props: {
            src: 'test.jpg',
            style: {},
          },
          children: [],
          meta: { sourceTag: 'img' },
        },
      ]);
    });

    it('should transform br to newline text node', () => {
      const html = 'Line 1<br />Line 2';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        {
          kind: 'text',
          content: 'Line 1\nLine 2',
        },
      ]);
    });

    it('should ignore unsupported tags', () => {
      const html = '<script>alert(1)</script><div>Content</div><style>body {}</style>';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'view',
          props: { style: { flexDirection: 'column' } },
          children: [
            { kind: 'text', content: 'Content' },
          ],
          meta: { sourceTag: 'div' },
        },
      ]);
    });
  });

  describe('Style Parsing', () => {
    it('should parse inline styles correctly', () => {
      const html = '<div style="color: red; font-size: 16px;">Styled Text</div>';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'view',
          props: {
            style: {
              flexDirection: 'column',
              color: 'red',
              fontSize: '16px',
            },
          },
          children: [
            { kind: 'text', content: 'Styled Text' },
          ],
          meta: { sourceTag: 'div' },
        },
      ]);
    });

    it('should merge default styles with inline styles', () => {
      const html = '<p style="color: blue;">Styled Paragraph</p>';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'text',
          props: {
            style: {
              marginBottom: '1em',
              color: 'blue',
            },
          },
          children: [
            { kind: 'text', content: 'Styled Paragraph' },
          ],
          meta: { sourceTag: 'p' },
        },
      ]);
    });

    it('should handle kebab-case styles correctly', () => {
      const html = '<div style="background-color: #fff; border-radius: 4px;">Styled Div</div>';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'view',
          props: {
            style: {
              flexDirection: 'column',
              backgroundColor: '#fff',
              borderRadius: '4px',
            },
          },
          children: [
            { kind: 'text', content: 'Styled Div' },
          ],
          meta: { sourceTag: 'div' },
        },
      ]);
    });
  });

  describe('Nested Structures', () => {
    it('should handle nested divs correctly', () => {
      const html = '<div><div>Inner Content</div></div>';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'view',
          props: { style: { flexDirection: 'column' } },
          children: [
            {
              kind: 'element',
              tag: 'view',
              props: { style: { flexDirection: 'column' } },
              children: [
                { kind: 'text', content: 'Inner Content' },
              ],
              meta: { sourceTag: 'div' },
            },
          ],
          meta: { sourceTag: 'div' },
        },
      ]);
    });

    it('should handle complex nested structure', () => {
      const html = '<div><p>Paragraph <strong>with bold</strong> text</p><img src="test.jpg" /></div>';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        {
          kind: 'element',
          tag: 'view',
          props: { style: { flexDirection: 'column' } },
          children: [
            {
              kind: 'element',
              tag: 'text',
              props: { style: { marginBottom: '1em' } },
              children: [
                { kind: 'text', content: 'Paragraph ' },
                {
                  kind: 'element',
                  tag: 'text',
                  props: { style: { fontWeight: 'bold' } },
                  children: [
                    { kind: 'text', content: 'with bold' },
                  ],
                  meta: { sourceTag: 'strong' },
                },
                { kind: 'text', content: ' text' },
              ],
              meta: { sourceTag: 'p' },
            },
            {
              kind: 'element',
              tag: 'image',
              props: {
                src: 'test.jpg',
                style: {},
              },
              children: [],
              meta: { sourceTag: 'img' },
            },
          ],
          meta: { sourceTag: 'div' },
        },
      ]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty HTML', () => {
      const html = '';
      const result = transformHTML(html);
      
      expect(result).toEqual([]);
    });

    it('should handle whitespace-only HTML', () => {
      const html = '   \n   \t   ';
      const result = transformHTML(html);
      
      expect(result).toEqual([]);
    });

    it('should handle HTML with only comments', () => {
      const html = '<!-- This is a comment -->';
      const result = transformHTML(html);
      
      expect(result).toEqual([]);
    });

    it('should handle mixed content with whitespace', () => {
      const html = '  Text 1  <div>  Text 2  </div>  Text 3  ';
      const result = transformHTML(html);
      
      expect(result).toEqual([
        { kind: 'text', content: '  Text 1  ' },
        {
          kind: 'element',
          tag: 'view',
          props: { style: { flexDirection: 'column' } },
          children: [
            { kind: 'text', content: '  Text 2  ' },
          ],
          meta: { sourceTag: 'div' },
        },
        { kind: 'text', content: '  Text 3  ' },
      ]);
    });
  });
});
