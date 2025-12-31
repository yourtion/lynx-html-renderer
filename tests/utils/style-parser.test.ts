import { describe, it, expect } from 'vitest';
import { parseStyleString, isInheritableProperty } from '../../src/utils/style-parser';

describe('Style Parser', () => {
  describe('parseStyleString', () => {
    it('should parse simple style declarations', () => {
      const result = parseStyleString('color: red;');

      expect(result).toEqual({ color: 'red' });
    });

    it('should parse multiple style declarations', () => {
      const result = parseStyleString('color: red; font-size: 14px;');

      expect(result).toEqual({
        color: 'red',
        fontSize: '14px',
      });
    });

    it('should convert kebab-case to camelCase', () => {
      const result = parseStyleString(
        'font-size: 14px; background-color: blue; margin-top: 10px;',
      );

      expect(result).toEqual({
        fontSize: '14px',
        backgroundColor: 'blue',
        marginTop: '10px',
      });
    });

    it('should handle whitespace around declarations', () => {
      const result = parseStyleString('  color  :  red  ;  font-size  :  14px  ;  ');

      expect(result).toEqual({
        color: 'red',
        fontSize: '14px',
      });
    });

    it('should handle trailing semicolon', () => {
      const result = parseStyleString('color: red;');

      expect(result).toEqual({ color: 'red' });
    });

    it('should handle declarations without trailing semicolon', () => {
      const result = parseStyleString('color: red');

      expect(result).toEqual({ color: 'red' });
    });

    it('should handle mixed semicolons', () => {
      const result = parseStyleString('color: red; font-size: 14px; background: blue');

      expect(result).toEqual({
        color: 'red',
        fontSize: '14px',
        background: 'blue',
      });
    });

    it('should skip invalid declarations', () => {
      const result = parseStyleString('color: red; invalid-declaration; font-size: 14px');

      expect(result).toEqual({
        color: 'red',
        fontSize: '14px',
      });
    });

    it('should handle empty string', () => {
      const result = parseStyleString('');

      expect(result).toEqual({});
    });

    it('should handle string with only whitespace', () => {
      const result = parseStyleString('   ;   ;   ');

      expect(result).toEqual({});
    });

    it('should handle complex CSS values', () => {
      const result = parseStyleString(
        'border: 1px solid #ccc; box-shadow: 0 2px 4px rgba(0,0,0,0.1);',
      );

      expect(result).toEqual({
        border: '1px solid #ccc',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      });
    });

    it('should handle CSS values with colons', () => {
      const result = parseStyleString(
        'background-image: url(http://example.com/image.png);',
      );

      expect(result).toEqual({
        backgroundImage: 'url(http://example.com/image.png)',
      });
    });

    it('should handle multiple consecutive hyphens', () => {
      const result = parseStyleString('border-top-left-radius: 5px;');

      expect(result).toEqual({
        borderTopLeftRadius: '5px',
      });
    });

    it('should handle vendor prefixes', () => {
      const result = parseStyleString(
        '-webkit-transform: rotate(45deg); -moz-border-radius: 5px;',
      );

      expect(result).toEqual({
        WebkitTransform: 'rotate(45deg)',
        MozBorderRadius: '5px',
      });
    });

    it('should handle important flag', () => {
      const result = parseStyleString('color: red !important;');

      expect(result).toEqual({
        color: 'red !important',
      });
    });

    it('should handle shorthand properties', () => {
      const result = parseStyleString('margin: 10px 20px; padding: 5px 10px 15px 20px;');

      expect(result).toEqual({
        margin: '10px 20px',
        padding: '5px 10px 15px 20px',
      });
    });

    it('should handle properties with numbers', () => {
      const result = parseStyleString('flex: 1; z-index: 100; opacity: 0.5;');

      expect(result).toEqual({
        flex: '1',
        zIndex: '100',
        opacity: '0.5',
      });
    });

    it('should handle quotes in values', () => {
      const result = parseStyleString('font-family: "Arial", sans-serif; content: "hello";');

      expect(result).toEqual({
        fontFamily: '"Arial", sans-serif',
        content: '"hello"',
      });
    });

    it('should handle multiple hyphens in property name', () => {
      const result = parseStyleString(
        'border-top-left-radius: 10px; border-bottom-right-radius: 15px;',
      );

      expect(result).toEqual({
        borderTopLeftRadius: '10px',
        borderBottomRightRadius: '15px',
      });
    });

    it('should handle CSS custom properties', () => {
      const result = parseStyleString('--custom-color: #fff; --another-var: value;');

      // The regex converts -X to X, so --custom-color becomes -CustomColor
      expect(result).toEqual({
        '-CustomColor': '#fff',
        '-AnotherVar': 'value',
      });
    });

    it('should skip malformed declarations gracefully', () => {
      const result = parseStyleString('color: red; : bad; font-size:; font-weight: bold;');

      expect(result).toEqual({
        color: 'red',
        fontWeight: 'bold',
      });
    });

    it('should handle unicode characters', () => {
      const result = parseStyleString('content: "\\201C";');

      expect(result).toEqual({
        content: '"\\201C"',
      });
    });

    it('should handle very long style strings efficiently', () => {
      const styles = Array.from({ length: 100 }, (_, i) =>
        `prop${i}: value${i};`,
      ).join(' ');

      const result = parseStyleString(styles);

      expect(Object.keys(result).length).toBe(100);
      expect(result.prop0).toBe('value0');
      expect(result.prop99).toBe('value99');
    });
  });

  describe('isInheritableProperty', () => {
    it('should return true for color property', () => {
      expect(isInheritableProperty('color')).toBe(true);
    });

    it('should return true for font properties', () => {
      expect(isInheritableProperty('fontFamily')).toBe(true);
      expect(isInheritableProperty('fontSize')).toBe(true);
      expect(isInheritableProperty('fontStyle')).toBe(true);
      expect(isInheritableProperty('fontWeight')).toBe(true);
    });

    it('should return true for line-height', () => {
      expect(isInheritableProperty('lineHeight')).toBe(true);
    });

    it('should return true for text-align', () => {
      expect(isInheritableProperty('textAlign')).toBe(true);
    });

    it('should return true for text-decoration', () => {
      expect(isInheritableProperty('textDecoration')).toBe(true);
    });

    it('should return true for letter-spacing and word-spacing', () => {
      expect(isInheritableProperty('letterSpacing')).toBe(true);
      expect(isInheritableProperty('wordSpacing')).toBe(true);
    });

    it('should return false for non-inheritable properties', () => {
      expect(isInheritableProperty('border')).toBe(false);
      expect(isInheritableProperty('margin')).toBe(false);
      expect(isInheritableProperty('padding')).toBe(false);
      expect(isInheritableProperty('width')).toBe(false);
      expect(isInheritableProperty('height')).toBe(false);
      expect(isInheritableProperty('background')).toBe(false);
    });

    it('should handle case-sensitive matching', () => {
      expect(isInheritableProperty('color')).toBe(true);
      expect(isInheritableProperty('Color')).toBe(false);
      expect(isInheritableProperty('COLOR')).toBe(false);
    });

    it('should handle all inheritable properties', () => {
      const inheritableProps = [
        'color',
        'fontFamily',
        'fontSize',
        'fontStyle',
        'fontWeight',
        'lineHeight',
        'textAlign',
        'textDecoration',
        'letterSpacing',
        'wordSpacing',
      ];

      inheritableProps.forEach((prop) => {
        expect(isInheritableProperty(prop)).toBe(true);
      });
    });
  });

  describe('edge cases and integration', () => {
    it('should handle real-world style strings', () => {
      const style = `
        color: #333;
        font-size: 16px;
        font-weight: bold;
        line-height: 1.5;
        text-align: center;
        margin: 10px 20px;
        padding: 15px;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
      `;

      const result = parseStyleString(style);

      expect(result).toEqual({
        color: '#333',
        fontSize: '16px',
        fontWeight: 'bold',
        lineHeight: '1.5',
        textAlign: 'center',
        margin: '10px 20px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
      });
    });

    it('should handle inline styles from HTML attributes', () => {
      const style = 'font-family: Arial, sans-serif; font-size: 14px; color: rgb(255, 0, 0);';

      const result = parseStyleString(style);

      expect(result).toEqual({
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: 'rgb(255, 0, 0)',
      });
    });

    it('should identify inheritable properties from parsed styles', () => {
      const style = 'color: red; font-size: 14px; border: 1px; margin: 10px;';
      const result = parseStyleString(style);

      const inheritableKeys = Object.keys(result).filter(isInheritableProperty);

      expect(inheritableKeys).toEqual(['color', 'fontSize']);
      expect(inheritableKeys).not.toContain('border');
      expect(inheritableKeys).not.toContain('margin');
    });
  });
});
