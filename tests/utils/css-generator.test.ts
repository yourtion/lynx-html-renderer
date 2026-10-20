import { describe, expect, it } from 'vitest';
import {
  generateCSS,
  getClassNameForTag,
  getTextClassNameForTag,
} from '../../src/utils/css-generator';

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

    it('should not add px to unitless properties like flex-grow', () => {
      const css = generateCSS();
      // flex-grow is unitless (number value without px)
      expect(css).toMatch(/flex-grow:\s*1/);
      expect(css).not.toMatch(/flex-grow:\s*1px/);
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

describe('Mutation hardening: exact rule output', () => {
  it('renders the div rule exactly (single property)', () => {
    const css = generateCSS();

    expect(css).toContain(
      '.lynx-html-renderer .lhr-div {\n  flex-direction: column;\n}',
    );
  });

  it('renders the p rules exactly with a text-only companion rule', () => {
    const css = generateCSS();

    // container rule carries the full style
    expect(css).toContain(
      '.lynx-html-renderer .lhr-p {\n  color: var(--lhr-text-color);\n  margin-bottom: 1em;\n}',
    );
    // text companion rule carries only text-only properties
    expect(css).toContain(
      '.lynx-html-renderer .lhr-p-text {\n  color: var(--lhr-text-color);\n}',
    );
  });

  it('renders the blockquote rule exactly (multi-property join)', () => {
    const css = generateCSS();

    expect(css).toContain(
      '.lynx-html-renderer .lhr-blockquote {\n  flex-direction: column;\n  margin-left: 40px;\n  margin-right: 40px;\n  padding-left: 16px;\n  border-left: 4px solid var(--lhr-blockquote-border);\n}',
    );
    // blockquote has no text-only properties, so no companion text rule
    expect(css).not.toContain('.lhr-blockquote-text');
  });

  it('renders dark-mode rules only for tags using CSS variables', () => {
    const css = generateCSS();

    expect(css).toContain('.lynx-html-renderer.lhr-dark .lhr-p {');
    expect(css).toContain('.lynx-html-renderer.lhr-dark .lhr-p-text {');
    expect(css).toContain('.lynx-html-renderer.lhr-dark .lhr-blockquote {');
    // div has no CSS variable in its defaultStyle, so no dark rule
    expect(css).not.toContain('lhr-dark .lhr-div {');
  });

  it('renders the dark-mode text rule with text-only properties only', () => {
    const css = generateCSS();

    expect(css).toContain(
      '.lynx-html-renderer.lhr-dark .lhr-h1-text {\n  color: var(--lhr-text-color);\n  font-size: 32px;\n  font-weight: bold;\n}',
    );
  });

  it('assembles the header and rule blocks with exact separation', () => {
    const css = generateCSS();

    expect(css.startsWith('/*\n * Lynx HTML Renderer - Default Styles')).toBe(
      true,
    );
    expect(css.endsWith('\n')).toBe(true);
    expect(css).not.toContain('\n\n\n');
  });

  it('separates rule blocks with exactly one blank line and no stray content', () => {
    const css = generateCSS();

    // a closing brace is followed by exactly one blank line before the next rule
    expect(css).toContain('}\n\n.');
    // every top-level block is either the header comment or a selector rule
    for (const block of css.split('\n\n')) {
      const isHeader = block.startsWith('/*');
      const isRule = block.startsWith('.');
      expect(isHeader || isRule).toBe(true);
    }
  });

  it('never leaks camelCase property names', () => {
    const css = generateCSS();

    expect(css).not.toContain('marginBottom');
    expect(css).not.toContain('flexDirection');
    expect(css).not.toContain('borderLeft');
  });
});

describe('Mutation hardening: text class name helper', () => {
  it('returns the text class for tags with text-only styles', () => {
    expect(getTextClassNameForTag('p')).toBe('lhr-p-text');
    expect(getTextClassNameForTag('h1')).toBe('lhr-h1-text');
  });

  it('returns null when defaultStyle has no text-only properties', () => {
    expect(getTextClassNameForTag('div')).toBeNull();
    expect(getTextClassNameForTag('blockquote')).toBeNull();
  });

  it('returns null for tags without defaultStyle or unknown tags', () => {
    expect(getTextClassNameForTag('img')).toBeNull();
    expect(getTextClassNameForTag('br')).toBeNull();
    expect(getTextClassNameForTag('nope')).toBeNull();
  });
});
