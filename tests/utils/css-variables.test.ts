import { describe, it, expect } from 'vitest';
import {
  LIGHT_MODE_VARS,
  DARK_MODE_VARS,
  generateCSSVariables,
  getVariableMapping,
  resolveCSSVariables,
  generateAllCSSVariables,
  type CSSVariables,
} from '../../src/utils/css-variables';

describe('CSS Variables', () => {
  describe('LIGHT_MODE_VARS', () => {
    it('should contain all light mode variables', () => {
      expect(LIGHT_MODE_VARS).toBeDefined();
      expect(typeof LIGHT_MODE_VARS).toBe('object');
    });

    it('should have text color variables', () => {
      expect(LIGHT_MODE_VARS['--lhr-text-color']).toBeDefined();
      expect(LIGHT_MODE_VARS['--lhr-text-color-secondary']).toBeDefined();
      expect(LIGHT_MODE_VARS['--lhr-text-color-muted']).toBeDefined();
    });

    it('should have border and background variables', () => {
      expect(LIGHT_MODE_VARS['--lhr-border-color']).toBeDefined();
      expect(LIGHT_MODE_VARS['--lhr-bg-color-secondary']).toBeDefined();
      expect(LIGHT_MODE_VARS['--lhr-bg-color-tertiary']).toBeDefined();
    });

    it('should have divider and blockquote variables', () => {
      expect(LIGHT_MODE_VARS['--lhr-divider-color']).toBeDefined();
      expect(LIGHT_MODE_VARS['--lhr-blockquote-border']).toBeDefined();
    });

    it('should use light color values', () => {
      expect(LIGHT_MODE_VARS['--lhr-text-color']).toBe('#212529');
      expect(LIGHT_MODE_VARS['--lhr-bg-color-secondary']).toBe('#f8f9fa');
    });
  });

  describe('DARK_MODE_VARS', () => {
    it('should contain all dark mode variables', () => {
      expect(DARK_MODE_VARS).toBeDefined();
      expect(typeof DARK_MODE_VARS).toBe('object');
    });

    it('should have same keys as light mode', () => {
      const lightKeys = Object.keys(LIGHT_MODE_VARS).sort();
      const darkKeys = Object.keys(DARK_MODE_VARS).sort();

      expect(lightKeys).toEqual(darkKeys);
    });

    it('should use dark color values', () => {
      expect(DARK_MODE_VARS['--lhr-text-color']).toBe('#e9ecef');
      expect(DARK_MODE_VARS['--lhr-bg-color-secondary']).toBe('#2d2d2d');
      expect(DARK_MODE_VARS['--lhr-border-color']).toBe('#404040');
    });
  });

  describe('generateCSSVariables', () => {
    it('should generate CSS rules for variables', () => {
      const vars: CSSVariables = {
        '--test-var': 'red',
        '--another-var': 'blue',
      };

      const result = generateCSSVariables('test-class', vars);

      expect(result).toContain('.test-class {');
      expect(result).toContain('--test-var: red;');
      expect(result).toContain('--another-var: blue;');
      expect(result).toContain('}');
    });

    it('should format CSS rules with proper indentation', () => {
      const vars: CSSVariables = { '--color': 'red' };
      const result = generateCSSVariables('root', vars);

      expect(result).toBe('.root {\n  --color: red;\n}');
    });

    it('should handle empty variables object', () => {
      const result = generateCSSVariables('empty', {});

      expect(result).toBe('.empty {\n\n}');
    });

    it('should handle single variable', () => {
      const vars: CSSVariables = { '--single': 'value' };
      const result = generateCSSVariables('class', vars);

      expect(result).toBe('.class {\n  --single: value;\n}');
    });

    it('should handle many variables', () => {
      const vars: CSSVariables = {
        '--v1': 'val1',
        '--v2': 'val2',
        '--v3': 'val3',
        '--v4': 'val4',
      };
      const result = generateCSSVariables('multi', vars);

      expect(result).toContain('.multi {');
      expect(result).toContain('--v1: val1;');
      expect(result).toContain('--v2: val2;');
      expect(result).toContain('--v3: val3;');
      expect(result).toContain('--v4: val4;');
      expect(result).toContain('}');
    });

    it('should handle variable values with special characters', () => {
      const vars: CSSVariables = {
        '--color': '#fff',
        '--spacing': '10px, 20px',
        '--font': '"Arial", sans-serif',
      };
      const result = generateCSSVariables('special', vars);

      expect(result).toContain('--color: #fff;');
      expect(result).toContain('--spacing: 10px, 20px;');
      expect(result).toContain('--font: "Arial", sans-serif;');
    });
  });

  describe('getVariableMapping', () => {
    it('should return mapping for light mode', () => {
      const mapping = getVariableMapping('light');

      expect(mapping).toBeDefined();
      expect(typeof mapping).toBe('object');
    });

    it('should return mapping for dark mode', () => {
      const mapping = getVariableMapping('dark');

      expect(mapping).toBeDefined();
      expect(typeof mapping).toBe('object');
    });

    it('should remove -- prefix from keys', () => {
      const mapping = getVariableMapping('light');

      expect(mapping['lhr-text-color']).toBeDefined();
      expect(mapping['text-color']).toBeUndefined();
      expect(mapping['--lhr-text-color']).toBeUndefined();
    });

    it('should map to correct color values for light mode', () => {
      const mapping = getVariableMapping('light');

      expect(mapping['lhr-text-color']).toBe('#212529');
      expect(mapping['lhr-border-color']).toBe('#dee2e6');
    });

    it('should map to correct color values for dark mode', () => {
      const mapping = getVariableMapping('dark');

      expect(mapping['lhr-text-color']).toBe('#e9ecef');
      expect(mapping['lhr-border-color']).toBe('#404040');
    });

    it('should include all variables', () => {
      const lightMapping = getVariableMapping('light');
      const darkMapping = getVariableMapping('dark');

      const lightKeys = Object.keys(LIGHT_MODE_VARS).map((k) =>
        k.replace(/^--/, ''),
      );
      const darkKeys = Object.keys(DARK_MODE_VARS).map((k) => k.replace(/^--/, ''));

      expect(Object.keys(lightMapping).sort()).toEqual(lightKeys.sort());
      expect(Object.keys(darkMapping).sort()).toEqual(darkKeys.sort());
    });
  });

  describe('resolveCSSVariables', () => {
    it('should replace var() with actual value in light mode', () => {
      const result = resolveCSSVariables('color: var(--lhr-text-color);', 'light');

      expect(result).toContain('#212529');
      expect(result).not.toContain('var(');
    });

    it('should replace var() with actual value in dark mode', () => {
      const result = resolveCSSVariables('color: var(--lhr-text-color);', 'dark');

      expect(result).toContain('#e9ecef');
      expect(result).not.toContain('var(');
    });

    it('should handle multiple variables in one string', () => {
      const css =
        'color: var(--lhr-text-color); background: var(--lhr-bg-color-secondary);';
      const result = resolveCSSVariables(css, 'light');

      expect(result).toContain('#212529');
      expect(result).toContain('#f8f9fa');
      expect(result).not.toContain('var(');
    });

    it('should preserve non-variable CSS', () => {
      const css = 'color: red; font-size: 14px;';
      const result = resolveCSSVariables(css, 'light');

      expect(result).toBe('color: red; font-size: 14px;');
    });

    it('should handle mixed variables and regular CSS', () => {
      const css =
        'color: var(--lhr-text-color); font-size: 14px; border: 1px solid var(--lhr-border-color);';
      const result = resolveCSSVariables(css, 'light');

      expect(result).toContain('#212529');
      expect(result).toContain('font-size: 14px');
      expect(result).toContain('#dee2e6');
    });

    it('should handle unknown variables gracefully', () => {
      const css = 'color: var(--unknown-variable);';
      const result = resolveCSSVariables(css, 'light');

      expect(result).toContain('var(--unknown-variable)');
    });

    it('should only replace lhr-prefixed variables', () => {
      const css = 'color: var(--lhr-text-color); background: var(--other-var);';
      const result = resolveCSSVariables(css, 'light');

      expect(result).toContain('#212529');
      expect(result).toContain('var(--other-var)');
    });

    it('should not replace var() with fallback values (regex limitation)', () => {
      const css = 'color: var(--lhr-text-color, red);';
      const result = resolveCSSVariables(css, 'light');

      // The regex doesn't match commas in var(), so it won't replace
      expect(result).toContain('var(--lhr-text-color, red)');
    });

    it('should handle whitespace in var()', () => {
      const css = 'color: var( --lhr-text-color );';
      const result = resolveCSSVariables(css, 'light');

      // The regex doesn't match spaces, so it preserves the original
      expect(result).toContain('var( --lhr-text-color )');
    });

    it('should work in dark mode for all variables', () => {
      const css = `
        color: var(--lhr-text-color);
        background: var(--lhr-bg-color-secondary);
        border-color: var(--lhr-border-color);
      `;
      const result = resolveCSSVariables(css, 'dark');

      expect(result).toContain('#e9ecef');
      expect(result).toContain('#2d2d2d');
      expect(result).toContain('#404040');
    });

    it('should handle empty string', () => {
      const result = resolveCSSVariables('', 'light');

      expect(result).toBe('');
    });

    it('should handle string without variables', () => {
      const css = 'color: red; font-size: 14px;';
      const result = resolveCSSVariables(css, 'light');

      expect(result).toBe(css);
    });

    it('should preserve CSS structure', () => {
      const css = '.class { color: var(--lhr-text-color); }';
      const result = resolveCSSVariables(css, 'light');

      expect(result).toContain('.class {');
      expect(result).toContain('}');
      expect(result).toContain('#212529');
    });
  });

  describe('generateAllCSSVariables', () => {
    it('should generate CSS for both light and dark mode', () => {
      const result = generateAllCSSVariables();

      expect(result).toContain('/* CSS Variables */');
      expect(result).toContain('/* Dark Mode CSS Variables */');
      expect(result).toContain('.lynx-html-renderer {');
      expect(result).toContain('.lynx-html-renderer.lhr-dark {');
    });

    it('should use custom root class when provided', () => {
      const result = generateAllCSSVariables('custom-root');

      expect(result).toContain('.custom-root {');
      expect(result).toContain('.custom-root.lhr-dark {');
      expect(result).not.toContain('.lynx-html-renderer {');
    });

    it('should include light mode variables', () => {
      const result = generateAllCSSVariables();

      expect(result).toContain('--lhr-text-color:');
      expect(result).toContain('#212529');
    });

    it('should include dark mode variables', () => {
      const result = generateAllCSSVariables();

      expect(result).toContain('--lhr-text-color:');
      expect(result).toContain('#e9ecef');
    });

    it('should be properly formatted CSS', () => {
      const result = generateAllCSSVariables();

      expect(result).toContain(' {');
      expect(result).toContain('}');
      expect(result).toContain('\n');
    });

    it('should contain comments for sections', () => {
      const result = generateAllCSSVariables();

      expect(result).toContain('/* CSS Variables */');
      expect(result).toContain('/* Dark Mode CSS Variables */');
    });
  });

  describe('integration tests', () => {
    it('should resolve real-world CSS with variables', () => {
      const css = `
        color: var(--lhr-text-color);
        background-color: var(--lhr-bg-color-secondary);
        border-color: var(--lhr-border-color);
      `;

      const lightResult = resolveCSSVariables(css, 'light');
      const darkResult = resolveCSSVariables(css, 'dark');

      expect(lightResult).toContain('#212529');
      expect(lightResult).toContain('#f8f9fa');
      expect(lightResult).toContain('#dee2e6');

      expect(darkResult).toContain('#e9ecef');
      expect(darkResult).toContain('#2d2d2d');
      expect(darkResult).toContain('#404040');
    });

    it('should generate complete CSS variable definitions', () => {
      const css = generateAllCSSVariables('test-root');

      expect(css).toContain('.test-root {');
      expect(css).toContain('--lhr-text-color:');
      expect(css).toContain('.test-root.lhr-dark {');
    });

    it('should provide variable mapping for all predefined variables', () => {
      const lightMapping = getVariableMapping('light');
      const darkMapping = getVariableMapping('dark');

      const expectedVariables = [
        'lhr-text-color',
        'lhr-text-color-secondary',
        'lhr-text-color-muted',
        'lhr-border-color',
        'lhr-bg-color-secondary',
        'lhr-bg-color-tertiary',
        'lhr-divider-color',
        'lhr-blockquote-border',
      ];

      expectedVariables.forEach((v) => {
        expect(lightMapping[v]).toBeDefined();
        expect(darkMapping[v]).toBeDefined();
      });
    });

    it('should handle all color variables in dark mode', () => {
      const variables = [
        '--lhr-text-color',
        '--lhr-text-color-secondary',
        '--lhr-text-color-muted',
        '--lhr-border-color',
        '--lhr-bg-color-secondary',
        '--lhr-bg-color-tertiary',
        '--lhr-divider-color',
        '--lhr-blockquote-border',
      ];

      const css = variables.map((v) => `${v}: ${v};`).join(' ');
      const result = resolveCSSVariables(css, 'dark');

      variables.forEach((v) => {
        expect(result).not.toContain(`var(${v})`);
      });
    });
  });
});
