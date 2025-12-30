/**
 * CSS Inheritance Tests
 *
 * Tests for CSS style inheritance from parent elements to text nodes.
 *
 * This feature ensures that font-related styles are properly applied to text nodes
 * even though Lynx does not support CSS inheritance by default.
 *
 * Two modes are supported:
 * - Inline mode: Styles are applied as inline style properties
 * - CSS-Class mode: Styles are applied via CSS classes (e.g., lhr-h1-text)
 */

import '@testing-library/jest-dom';
import { HTMLRenderer } from '@lynx-html-renderer/index';
import { render } from '@lynx-js/react/testing-library';
import { describe, expect, it } from 'vitest';

describe('CSS Inheritance (Inline Mode)', () => {
  describe('Basic Inheritance', () => {
    it('should inherit font styles from h1 to text node', () => {
      const html = '<h1>Title</h1>';
      const { container } = render(<HTMLRenderer html={html} />);

      // 查找最内层的 text 元素（实际文本内容）
      const texts = container.querySelectorAll('text');
      const innerText = texts[texts.length - 1];
      expect(innerText).toBeDefined();

      // 验证继承的样式
      const style = innerText?.getAttribute('style');
      expect(style).toContain('font-size');
      expect(style).toContain('font-weight');
      expect(style).toContain('color');
    });

    it('should inherit font styles from p to text node', () => {
      const html = '<p>Paragraph text</p>';
      const { container } = render(<HTMLRenderer html={html} />);

      const texts = container.querySelectorAll('text');
      const innerText = texts[texts.length - 1];
      expect(innerText).toBeDefined();

      // 验证继承的样式（p标签的defaultStyle有color）
      const style = innerText?.getAttribute('style');
      expect(style).toContain('color');

      // marginBottom 不应该被继承（不是核心字体属性）
      expect(style).not.toContain('margin-bottom');
    });

    it('should not inherit non-text properties like padding', () => {
      const html = '<blockquote>Quote</blockquote>';
      const { container } = render(<HTMLRenderer html={html} />);

      const texts = container.querySelectorAll('text');
      const innerText = texts[texts.length - 1];
      expect(innerText).toBeDefined();

      // blockquote 的 defaultStyle 没有核心字体属性，所以 style 可能为空
      const style = innerText?.getAttribute('style');

      // 如果有 style，验证不应该有 padding, margin, border 等容器属性
      if (style) {
        expect(style).not.toContain('padding');
        expect(style).not.toContain('margin');
        expect(style).not.toContain('border');
      }
    });
  });

  describe('Nested Inheritance', () => {
    it('should accumulate styles from multiple ancestors', () => {
      const html = '<h1 style="color: red;"><p>Text</p></h1>';
      const { container } = render(<HTMLRenderer html={html} />);

      const texts = container.querySelectorAll('text');
      const innerText = texts[texts.length - 1];
      expect(innerText).toBeDefined();

      // 应该有样式（包括h1的color和p的fontSize/lineHeight）
      const style = innerText?.getAttribute('style');
      expect(style).toBeDefined();
      expect(style?.length).toBeGreaterThan(0);
    });
  });

  describe('Style Override', () => {
    it('should let marks override inherited styles', () => {
      const html = '<h1><strong>Bold</strong></h1>';
      const { container } = render(<HTMLRenderer html={html} />);

      const texts = container.querySelectorAll('text');
      const innerText = texts[texts.length - 1];
      expect(innerText).toBeDefined();

      // marks 应该被应用
      const style = innerText?.getAttribute('style');
      expect(style).toContain('font-weight');
      expect(style).toContain('bold');
    });
  });

  describe('No Regression', () => {
    it('should preserve existing marks behavior', () => {
      const html = '<strong>Bold</strong> <em>Italic</em>';
      const { container } = render(<HTMLRenderer html={html} />);

      const texts = container.querySelectorAll('text');
      expect(texts.length).toBe(2);

      // 第一个 text 应该有 bold
      expect(texts[0]?.getAttribute('style')).toContain('font-weight');

      // 第二个 text 应该有 italic
      expect(texts[1]?.getAttribute('style')).toContain('font-style');
    });
  });
});

describe('CSS Inheritance (CSS-Class Mode)', () => {
  describe('Basic Inheritance', () => {
    it('should apply text class to h1 text node', () => {
      const html = '<h1>Title</h1>';
      const { container } = render(
        <HTMLRenderer html={html} styleMode="css-class" />,
      );

      // 查找最内层的 text 元素（实际文本内容）
      const texts = container.querySelectorAll('text');
      const innerText = texts[texts.length - 1];
      expect(innerText).toBeDefined();

      // 验证有 text class
      const className = innerText?.getAttribute('class');
      expect(className).toContain('lhr-h1-text');
    });

    it('should apply text class to p text node', () => {
      const html = '<p>Paragraph text</p>';
      const { container } = render(
        <HTMLRenderer html={html} styleMode="css-class" />,
      );

      const texts = container.querySelectorAll('text');
      const innerText = texts[texts.length - 1];
      expect(innerText).toBeDefined();

      // 验证有 text class
      const className = innerText?.getAttribute('class');
      expect(className).toContain('lhr-p-text');
    });

    it('should not apply text class for div (container-only)', () => {
      const html = '<div>Text</div>';
      const { container } = render(
        <HTMLRenderer html={html} styleMode="css-class" />,
      );

      const texts = container.querySelectorAll('text');
      const innerText = texts[texts.length - 1];
      expect(innerText).toBeDefined();

      // div 只有 flex-direction，不包含字体属性，所以不应该有 text class
      const className = innerText?.getAttribute('class');
      expect(className).toBeNull();
    });
  });

  describe('Nested Inheritance', () => {
    it('should accumulate text classes from multiple ancestors', () => {
      const html = '<h1><p>Text</p></h1>';
      const { container } = render(
        <HTMLRenderer html={html} styleMode="css-class" />,
      );

      const texts = container.querySelectorAll('text');
      const innerText = texts[texts.length - 1];
      expect(innerText).toBeDefined();

      // 应该同时有 h1 和 p 的 text class
      const className = innerText?.getAttribute('class');
      expect(className).toContain('lhr-h1-text');
      expect(className).toContain('lhr-p-text');
    });
  });

  describe('Style Override', () => {
    it('should let marks work with inherited classes', () => {
      const html = '<h1><strong>Bold</strong></h1>';
      const { container } = render(
        <HTMLRenderer html={html} styleMode="css-class" />,
      );

      const texts = container.querySelectorAll('text');
      const innerText = texts[texts.length - 1];
      expect(innerText).toBeDefined();

      // 应该有继承的类
      const className = innerText?.getAttribute('class');
      expect(className).toContain('lhr-h1-text');

      // marks 应该仍然生效（通过 inline style）
      const style = innerText?.getAttribute('style');
      expect(style).toContain('font-weight');
    });
  });

  describe('No Regression', () => {
    it('should preserve existing marks behavior', () => {
      const html = '<strong>Bold</strong> <em>Italic</em>';
      const { container } = render(
        <HTMLRenderer html={html} styleMode="css-class" />,
      );

      const texts = container.querySelectorAll('text');
      expect(texts.length).toBe(2);

      // 第一个 text 应该有 bold（通过 inline style）
      expect(texts[0]?.getAttribute('style')).toContain('font-weight');

      // 第二个 text 应该有 italic（通过 inline style）
      expect(texts[1]?.getAttribute('style')).toContain('font-style');
    });
  });
});
