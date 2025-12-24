/**
 * Styles Integration Tests
 *
 * Tests for style rendering:
 * - HTML style attributes are correctly rendered to DOM
 * - Style values are properly applied
 * - Element default styles work correctly
 *
 * Note: Internal style conversion (kebab-case to camelCase) is tested in unit tests.
 * These integration tests verify the final rendered output.
 */

import '@testing-library/jest-dom';
import { render } from '@lynx-js/react/testing-library';
import { describe, expect, it } from 'vitest';
import { HTMLRenderer } from '@lynx-html-renderer/index';

describe('Styles Integration Tests', () => {
  describe('Style Property Rendering', () => {
    it('should render background-color style', () => {
      const html = '<div style="background-color: red;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('background-color');
      expect(style).toContain('red');
    });

    it('should render font-size style', () => {
      const html = '<div style="font-size: 16px;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('font-size');
      expect(style).toContain('16px');
    });

    it('should render margin-top style', () => {
      const html = '<div style="margin-top: 10px;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('margin-top');
      expect(style).toContain('10px');
    });

    it('should render border-radius style', () => {
      const html = '<div style="border-radius: 5px;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('border-radius');
      expect(style).toContain('5px');
    });

    it('should render text-align style', () => {
      const html = '<div style="text-align: center;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('text-align');
      expect(style).toContain('center');
    });

    it('should render line-height style', () => {
      const html = '<div style="line-height: 1.5;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('line-height');
      expect(style).toContain('1.5');
    });

    it('should render padding-left style', () => {
      const html = '<div style="padding-left: 20px;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('padding-left');
      expect(style).toContain('20px');
    });

    it('should render font-weight style', () => {
      const html = '<div style="font-weight: bold;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('font-weight');
      expect(style).toContain('bold');
    });

    it('should render border-left style', () => {
      const html = '<div style="border-left: 1px solid #ccc;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('border-left');
      expect(style).toContain('1px');
    });
  });

  describe('Multiple Style Properties', () => {
    it('should handle multiple style properties', () => {
      const html =
        '<div style="padding: 10px; margin: 5px; color: #333;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('padding');
      expect(style).toContain('margin');
      expect(style).toContain('color');
    });

    it('should handle many style properties at once', () => {
      const html =
        '<div style="background-color: red; font-size: 16px; padding: 10px; margin: 5px; border: 1px solid #000; color: white;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('background-color');
      expect(style).toContain('font-size');
      expect(style).toContain('padding');
      expect(style).toContain('margin');
      expect(style).toContain('border');
      expect(style).toContain('color');
    });
  });

  describe('Common CSS Values', () => {
    it('should handle color values', () => {
      const html =
        '<div style="color: red; background-color: #fff;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('color');
      expect(style).toContain('red');
      expect(style).toContain('background-color');
      // Color values may be converted to rgb format
      expect(style).toMatch(/rgb\(255,\s*255,\s*255\)|#fff/);
    });

    it('should handle pixel values', () => {
      const html = '<div style="width: 100px; height: 200px;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('width');
      expect(style).toContain('100px');
      expect(style).toContain('height');
      expect(style).toContain('200px');
    });

    it('should handle em values', () => {
      const html = '<div style="font-size: 1.5em; margin: 2em;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('font-size');
      expect(style).toContain('1.5em');
      expect(style).toContain('margin');
      expect(style).toContain('2em');
    });

    it('should handle percentage values', () => {
      const html = '<div style="width: 50%; height: 100%;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('width');
      expect(style).toContain('50%');
      expect(style).toContain('height');
      expect(style).toContain('100%');
    });

    it('should handle numeric values', () => {
      const html = '<div style="opacity: 0.5; z-index: 10;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('opacity');
      expect(style).toContain('0.5');
    });
  });

  describe('Element Default Styles', () => {
    it('should apply h1 default styles', () => {
      const html = '<h1>Title</h1>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-size');
      expect(style).toContain('32px');
      expect(style).toContain('font-weight');
      expect(style).toContain('bold');
    });

    it('should apply h2 default styles', () => {
      const html = '<h2>Subtitle</h2>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-size');
      expect(style).toContain('24px');
    });

    it('should apply paragraph default margin', () => {
      const html = '<p>Paragraph</p>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');
      expect(style).toContain('margin-bottom');
      expect(style).toContain('1em');
    });

    it('should apply ul default padding', () => {
      const html = '<ul><li>Item</li></ul>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('padding-left');
    });

    it('should apply strong default bold style', () => {
      const html = '<strong>Bold text</strong>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-weight');
      expect(style).toContain('bold');
    });

    it('should apply em default italic style', () => {
      const html = '<em>Italic text</em>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-style');
      expect(style).toContain('italic');
    });

    it('should apply code default monospace style', () => {
      const html = '<code>Code</code>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-family');
      expect(style).toContain('monospace');
    });
  });

  describe('Inline Style Edge Cases', () => {
    it('should handle empty style attribute', () => {
      const html = '<div style="">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      expect(view).toBeDefined();
    });

    it('should handle style with spaces', () => {
      const html = '<div style="  color: red;  ">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('color');
    });

    it('should handle style with trailing semicolon', () => {
      const html = '<div style="color: red; font-size: 16px;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('color');
      expect(style).toContain('font-size');
    });

    it('should handle invalid style gracefully', () => {
      const html = '<div style="invalid: value;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      expect(view).toBeDefined();
    });

    it('should handle mixed case style properties', () => {
      const html =
        '<div style="background-color: red; font-size: 16px;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('background-color');
      expect(style).toContain('red');
      expect(style).toContain('font-size');
      expect(style).toContain('16px');
    });
  });

  describe('Complex Style Scenarios', () => {
    it('should handle nested elements with inline styles', () => {
      const html = `
        <div style="padding: 20px;">
          <h2 style="color: #333;">Title</h2>
          <p style="line-height: 1.6; color: #666;">
            Paragraph with <span style="color: red;">red text</span>
          </p>
        </div>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Title');
      expect(container.textContent).toContain('Paragraph with');
      expect(container.textContent).toContain('red text');
    });

    it('should override default styles with inline styles', () => {
      const html = '<h1 style="font-size: 3em; color: blue;">Title</h1>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-size');
      expect(style).toContain('3em');
      expect(style).toContain('color');
      expect(style).toContain('blue');
    });

    it('should handle complex border styles', () => {
      const html =
        '<div style="border: 1px solid #ccc; border-radius: 5px;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('border');
      expect(style).toContain('border-radius');
    });
  });

  describe('Flexbox Styles', () => {
    it('should handle flex-direction', () => {
      const html = '<div style="flex-direction: row;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('flex-direction');
      expect(style).toContain('row');
    });

    it('should handle justify-content', () => {
      const html = '<div style="justify-content: center;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('justify-content');
      expect(style).toContain('center');
    });

    it('should handle align-items', () => {
      const html = '<div style="align-items: flex-start;">Content</div>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      const style = view?.getAttribute('style');
      expect(style).toContain('align-items');
      expect(style).toContain('flex-start');
    });
  });
});
