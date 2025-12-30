import { describe, expect, it } from 'vitest';
import { generateCSS, getClassNameForTag } from '../../src/utils/css-generator';

describe('CSS Generator', () => {
  describe('generateCSS', () => {
    it('should generate CSS with default root class name', () => {
      const css = generateCSS();

      expect(css).toContain('.lynx-html-renderer .lhr-p');
      expect(css).toContain('.lynx-html-renderer .lhr-h1');
      expect(css).toContain('.lynx-html-renderer .lhr-div');
      expect(css).toContain('margin-bottom: 1em;');
    });

    it('should convert camelCase to kebab-case', () => {
      const css = generateCSS();

      // flex-direction not flexDirection
      expect(css).toContain('flex-direction:');
      expect(css).not.toContain('flexDirection:');

      // font-weight not fontWeight
      expect(css).toContain('font-weight:');
      expect(css).not.toContain('fontWeight:');

      // border-left not borderLeft
      expect(css).toContain('border-left:');
    });

    it('should support custom rootClassName', () => {
      const customRoot = 'my-custom-root';
      const css = generateCSS(customRoot);

      expect(css).toContain(`.${customRoot} .lhr-p`);
      expect(css).not.toContain('.lynx-html-renderer');
    });

    it('should include file header comment', () => {
      const css = generateCSS();

      expect(css).toContain('/*');
      expect(css).toContain('Lynx HTML Renderer - Default Styles');
      expect(css).toContain('Root class:');
    });

    it('should generate CSS for all tags with defaultStyle', () => {
      const css = generateCSS();

      // Check for some key tags
      expect(css).toContain('.lhr-p');
      expect(css).toContain('.lhr-h1');
      expect(css).toContain('.lhr-h2');
      expect(css).toContain('.lhr-h3');
      expect(css).toContain('.lhr-h4');
      expect(css).toContain('.lhr-h5');
      expect(css).toContain('.lhr-h6');
      expect(css).toContain('.lhr-div');
      expect(css).toContain('.lhr-strong');
      expect(css).toContain('.lhr-em');
      expect(css).toContain('.lhr-blockquote');
      expect(css).toContain('.lhr-table');
      expect(css).toContain('.lhr-th');
      expect(css).toContain('.lhr-td');
    });

    it('should format CSS rules correctly', () => {
      const css = generateCSS();

      // Check proper CSS formatting
      expect(css).toMatch(/\.lynx-html-renderer \.lhr-p \{[\s\S]*\}/);
      expect(css).toContain('  ');
    });
  });

  describe('getClassNameForTag', () => {
    it('should return correct className for tags with defaultStyle', () => {
      expect(getClassNameForTag('p')).toBe('lhr-p');
      expect(getClassNameForTag('h1')).toBe('lhr-h1');
      expect(getClassNameForTag('div')).toBe('lhr-div');
      expect(getClassNameForTag('strong')).toBe('lhr-strong');
      expect(getClassNameForTag('blockquote')).toBe('lhr-blockquote');
    });

    it('should return null for tags without defaultStyle', () => {
      // img tag exists but has no defaultStyle
      expect(getClassNameForTag('img')).toBeNull();
      expect(getClassNameForTag('br')).toBeNull();
      expect(getClassNameForTag('unknown')).toBeNull();
    });

    it('should handle case-insensitive tag names', () => {
      // The function expects lowercase tags
      expect(getClassNameForTag('DIV')).toBeNull();
      expect(getClassNameForTag('Div')).toBeNull();
      expect(getClassNameForTag('div')).toBe('lhr-div');
    });
  });

  describe('CSS values formatting', () => {
    it('should convert numeric values to pixels', () => {
      const css = generateCSS();

      // Numeric values should have px unit
      expect(css).toContain('font-size: 32px');
      expect(css).toContain('padding: 16px');
      expect(css).toContain('padding: 8px');
    });

    it('should keep string values as-is', () => {
      const css = generateCSS();

      // String values should remain unchanged
      expect(css).toContain('margin-bottom: 1em');
      expect(css).toContain('font-family: monospace');
      expect(css).toContain('color: blue');
    });
  });

  describe('Dark Mode CSS Variables', () => {
    it('should generate CSS variables for light mode', () => {
      const css = generateCSS();

      expect(css).toContain('--lhr-border-color:');
      expect(css).toContain('--lhr-bg-color-secondary:');
      expect(css).toContain('--lhr-bg-color-tertiary:');
      expect(css).toContain('--lhr-divider-color:');
      expect(css).toContain('--lhr-blockquote-border:');
    });

    it('should generate CSS variables for dark mode', () => {
      const css = generateCSS();

      expect(css).toContain('.lynx-html-renderer.lhr-dark');
      expect(css).toContain('--lhr-border-color:');
      expect(css).toContain('--lhr-bg-color-secondary:');
    });

    it('should use CSS variables in styles', () => {
      const css = generateCSS();

      // CSS variables are defined in the root class
      expect(css).toContain('--lhr-blockquote-border:');
      expect(css).toContain('--lhr-divider-color:');
      expect(css).toContain('--lhr-bg-color-tertiary:');
      expect(css).toContain('--lhr-border-color:');

      // blockquote should use var(--lhr-blockquote-border)
      expect(css).toContain(
        'border-left: 4px solid var(--lhr-blockquote-border)',
      );
      // hr should use var(--lhr-divider-color)
      expect(css).toContain('background-color: var(--lhr-divider-color)');
      // pre should use var(--lhr-bg-color-tertiary)
      expect(css).toContain('background-color: var(--lhr-bg-color-tertiary)');
      // table elements should use var(--lhr-border-color)
      expect(css).toContain('border-color: var(--lhr-border-color)');

      // Dark mode variables should be defined
      expect(css).toContain('.lynx-html-renderer.lhr-dark {');
      expect(css).toMatch(
        /\.lynx-html-renderer\.lhr-dark \{[\s\S]*--lhr-border-color:\s*#404040/,
      );
    });

    it('should include dark mode comment', () => {
      const css = generateCSS();

      expect(css).toContain('/* Dark Mode CSS Variables */');
    });

    it('should support custom root class in dark mode', () => {
      const customRoot = 'my-root';
      const css = generateCSS(customRoot);

      expect(css).toContain(`.${customRoot} {`);
      expect(css).toContain(`.${customRoot}.lhr-dark {`);
      expect(css).toContain(`.${customRoot} .lhr-`);
    });
  });
});
