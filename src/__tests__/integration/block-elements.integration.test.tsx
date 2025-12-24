/**
 * Block Elements Integration Tests
 *
 * Tests for block-level HTML elements:
 * - Semantic elements: article, section, header, footer, nav, aside
 * - Headings: h1-h6
 * - Lists: ul, ol, li
 * - Other block elements: hr, blockquote, pre
 */

import '@testing-library/jest-dom';
import { render } from '@lynx-js/react/testing-library';
import { describe, expect, it } from 'vitest';
import { HTMLRenderer } from '../../index';

describe('Block Elements Integration Tests', () => {
  describe('Semantic Block Elements', () => {
    it('should render article element', () => {
      const html = '<article>Article content</article>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      expect(view).toBeDefined();
      expect(view?.textContent).toBe('Article content');
    });

    it('should render section element', () => {
      const html = '<section>Section content</section>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      expect(view?.textContent).toBe('Section content');
    });

    it('should render header element', () => {
      const html = '<header>Header content</header>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      expect(view?.textContent).toBe('Header content');
    });

    it('should render footer element', () => {
      const html = '<footer>Footer content</footer>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      expect(view?.textContent).toBe('Footer content');
    });

    it('should render nav element', () => {
      const html = '<nav>Nav content</nav>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      expect(view?.textContent).toBe('Nav content');
    });

    it('should render aside element', () => {
      const html = '<aside>Sidebar content</aside>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      expect(view?.textContent).toBe('Sidebar content');
    });

    it('should render nested semantic elements', () => {
      const html = `
        <article>
          <header>
            <h1>Article Title</h1>
          </header>
          <section>
            <p>Section content</p>
          </section>
          <footer>
            <p>Article footer</p>
          </footer>
        </article>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Article Title');
      expect(container.textContent).toContain('Section content');
      expect(container.textContent).toContain('Article footer');
    });
  });

  describe('Heading Elements (h1-h6)', () => {
    it('should render h1 element with correct style', () => {
      const html = '<h1>Heading 1</h1>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      expect(text).toBeDefined();
      expect(text?.textContent).toBe('Heading 1');
      // h1 should have fontSize: 32px
      const style = text?.getAttribute('style');
      expect(style).toContain('font-size');
      expect(style).toContain('32px');
      expect(style).toContain('font-weight');
    });

    it('should render h2 element', () => {
      const html = '<h2>Heading 2</h2>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      expect(text?.textContent).toBe('Heading 2');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-size');
      expect(style).toContain('24px');
    });

    it('should render h3 element', () => {
      const html = '<h3>Heading 3</h3>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      expect(text?.textContent).toBe('Heading 3');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-size');
      expect(style).toContain('20px');
    });

    it('should render h4 element', () => {
      const html = '<h4>Heading 4</h4>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      expect(text?.textContent).toBe('Heading 4');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-size');
      expect(style).toContain('18px');
    });

    it('should render h5 element', () => {
      const html = '<h5>Heading 5</h5>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      expect(text?.textContent).toBe('Heading 5');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-size');
      expect(style).toContain('16px');
    });

    it('should render h6 element', () => {
      const html = '<h6>Heading 6</h6>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      expect(text?.textContent).toBe('Heading 6');
      const style = text?.getAttribute('style');
      expect(style).toContain('font-size');
      expect(style).toContain('14px');
    });

    it('should render all headings in sequence', () => {
      const html = `
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
        <h4>Heading 4</h4>
        <h5>Heading 5</h5>
        <h6>Heading 6</h6>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      const texts = container.querySelectorAll('text');
      expect(texts.length).toBeGreaterThanOrEqual(6);
      expect(container.textContent).toContain('Heading 1');
      expect(container.textContent).toContain('Heading 2');
      expect(container.textContent).toContain('Heading 3');
      expect(container.textContent).toContain('Heading 4');
      expect(container.textContent).toContain('Heading 5');
      expect(container.textContent).toContain('Heading 6');
    });
  });

  describe('List Elements', () => {
    it('should render ul element', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Item 1');
      expect(container.textContent).toContain('Item 2');
    });

    it('should render ol element', () => {
      const html = '<ol><li>First</li><li>Second</li></ol>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('First');
      expect(container.textContent).toContain('Second');
    });

    it('should render li elements', () => {
      const html = '<ul><li>List item</li></ul>';
      const { container } = render(<HTMLRenderer html={html} />);

      const views = container.querySelectorAll('view');
      expect(views.length).toBeGreaterThan(0);
      expect(container.textContent).toContain('List item');
    });

    it('should render nested lists', () => {
      const html = `
        <ul>
          <li>Item 1</li>
          <li>
            Item 2
            <ul>
              <li>Nested 1</li>
              <li>Nested 2</li>
            </ul>
          </li>
          <li>Item 3</li>
        </ul>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Item 1');
      expect(container.textContent).toContain('Item 2');
      expect(container.textContent).toContain('Nested 1');
      expect(container.textContent).toContain('Nested 2');
      expect(container.textContent).toContain('Item 3');
    });

    it('should render list with mixed content', () => {
      const html = `
        <ul>
          <li>Plain text</li>
          <li>Text with <strong>bold</strong></li>
          <li>Text with <em>italic</em></li>
        </ul>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Plain text');
      expect(container.textContent).toContain('bold');
      expect(container.textContent).toContain('italic');
    });
  });

  describe('Special Block Elements', () => {
    it('should render hr element as horizontal rule', () => {
      const html = '<p>Before</p><hr /><p>After</p>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Before');
      expect(container.textContent).toContain('After');
      // hr should be rendered as a view
      const views = container.querySelectorAll('view');
      expect(views.length).toBeGreaterThan(0);
    });

    it('should render blockquote element', () => {
      const html = '<blockquote>This is a quote</blockquote>';
      const { container } = render(<HTMLRenderer html={html} />);

      const view = container.querySelector('view');
      expect(view).toBeDefined();
      expect(view?.textContent).toContain('This is a quote');
      // blockquote should have default styles
      const style = view?.getAttribute('style');
      expect(style).toBeDefined();
    });

    it('should render pre element', () => {
      const html = '<pre>const x = 1;</pre>';
      const { container } = render(<HTMLRenderer html={html} />);

      const text = container.querySelector('text');
      expect(text).toBeDefined();
      expect(text?.textContent).toContain('const x = 1;');
      // pre should have monospace font family
      const style = text?.getAttribute('style');
      expect(style).toContain('font-family');
    });

    it('should render blockquote with multiple paragraphs', () => {
      const html = `
        <blockquote>
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </blockquote>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('First paragraph');
      expect(container.textContent).toContain('Second paragraph');
    });
  });

  describe('Complex Block Structure Tests', () => {
    it('should render article with nested elements', () => {
      const html = `
        <article>
          <header>
            <h1>Article Title</h1>
            <p>Meta info</p>
          </header>
          <section>
            <h2>Section</h2>
            <p>Content</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </section>
          <footer>
            <p>Footer text</p>
          </footer>
        </article>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Article Title');
      expect(container.textContent).toContain('Meta info');
      expect(container.textContent).toContain('Section');
      expect(container.textContent).toContain('Content');
      expect(container.textContent).toContain('Item 1');
      expect(container.textContent).toContain('Item 2');
      expect(container.textContent).toContain('Footer text');
    });

    it('should render document with all heading levels', () => {
      const html = `
        <article>
          <h1>Main Title</h1>
          <section>
            <h2>Section 1</h2>
            <h3>Subsection 1.1</h3>
          </section>
          <section>
            <h2>Section 2</h2>
            <h3>Subsection 2.1</h3>
            <h4>Sub-subsection 2.1.1</h4>
          </section>
        </article>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      const texts = container.querySelectorAll('text');
      expect(texts.length).toBeGreaterThan(6);
    });
  });
});
