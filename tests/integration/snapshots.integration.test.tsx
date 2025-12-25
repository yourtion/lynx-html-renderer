/**
 * Snapshot Integration Tests
 *
 * Comprehensive snapshot tests with tag and attribute verification.
 * Each snapshot test also validates specific elements and properties.
 */

import '@testing-library/jest-dom';
import { HTMLRenderer } from '@lynx-html-renderer/index';
import { render } from '@lynx-js/react/testing-library';
import { describe, expect, it } from 'vitest';

describe('Snapshot Tests with Verification', () => {
  describe('All Heading Elements (h1-h6)', () => {
    it('should match snapshot for all heading elements', () => {
      const html = `
        <div>
          <h1>Heading 1</h1>
          <h2>Heading 2</h2>
          <h3>Heading 3</h3>
          <h4>Heading 4</h4>
          <h5>Heading 5</h5>
          <h6>Heading 6</h6>
        </div>
      `;

      const { container } = render(<HTMLRenderer html={html} />);

      // Verify all headings are present
      expect(container.textContent).toContain('Heading 1');
      expect(container.textContent).toContain('Heading 2');
      expect(container.textContent).toContain('Heading 3');
      expect(container.textContent).toContain('Heading 4');
      expect(container.textContent).toContain('Heading 5');
      expect(container.textContent).toContain('Heading 6');

      // Verify h1 has correct font size style
      const texts = container.querySelectorAll('text');
      const h1Style = texts[0]?.getAttribute('style');
      expect(h1Style).toContain('font-size');
      expect(h1Style).toContain('32px');

      expect(container).toMatchSnapshot();
    });
  });

  describe('All Text Formatting Elements', () => {
    it('should match snapshot for all text formatting elements', () => {
      const html = `
        <p>
          Text with <strong>bold</strong>, <b>also bold</b>,
          <em>italic</em>, <i>also italic</i>,
          <u>underlined</u>, and <code>inline code</code>.
          Combined: <strong><u>bold + underline</u></strong>
        </p>
      `;

      const { container } = render(<HTMLRenderer html={html} />);

      // Verify all formatted text is present
      expect(container.textContent).toContain('bold');
      expect(container.textContent).toContain('also bold');
      expect(container.textContent).toContain('italic');
      expect(container.textContent).toContain('also italic');
      expect(container.textContent).toContain('underlined');
      expect(container.textContent).toContain('inline code');
      expect(container.textContent).toContain('bold + underline');

      // Verify text formatting styles are applied
      const texts = container.querySelectorAll('text');
      const hasBoldStyle = Array.from(texts).some((t) =>
        t.getAttribute('style')?.includes('font-weight'),
      );
      expect(hasBoldStyle).toBe(true);

      const hasItalicStyle = Array.from(texts).some((t) =>
        t.getAttribute('style')?.includes('font-style'),
      );
      expect(hasItalicStyle).toBe(true);

      expect(container).toMatchSnapshot();
    });
  });

  describe('List Elements (ul, ol, li)', () => {
    it('should match snapshot for list elements with nesting', () => {
      const html = `
        <div>
          <ul>
            <li>Unordered item 1</li>
            <li>Unordered item 2</li>
            <li>Nested:
              <ul>
                <li>Nested item 1</li>
                <li>Nested item 2</li>
              </ul>
            </li>
          </ul>
          <ol>
            <li>Ordered item 1</li>
            <li>Ordered item 2</li>
          </ol>
        </div>
      `;

      const { container } = render(<HTMLRenderer html={html} />);

      // Verify all list items are present
      expect(container.textContent).toContain('Unordered item 1');
      expect(container.textContent).toContain('Unordered item 2');
      expect(container.textContent).toContain('Nested item 1');
      expect(container.textContent).toContain('Nested item 2');
      expect(container.textContent).toContain('Ordered item 1');
      expect(container.textContent).toContain('Ordered item 2');

      // Verify list elements are rendered as view
      const views = container.querySelectorAll('view');
      expect(views.length).toBeGreaterThan(0);

      expect(container).toMatchSnapshot();
    });
  });

  describe('All Table Elements', () => {
    it('should match snapshot for complete table structure', () => {
      const html = `
        <table>
          <thead>
            <tr>
              <th>Header 1</th>
              <th>Header 2</th>
              <th>Header 3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Body 1-1</td>
              <td>Body 1-2</td>
              <td>Body 1-3</td>
            </tr>
            <tr>
              <td>Body 2-1</td>
              <td>Body 2-2</td>
              <td>Body 2-3</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>Footer 1</td>
              <td>Footer 2</td>
              <td>Footer 3</td>
            </tr>
          </tfoot>
        </table>
      `;

      const { container } = render(<HTMLRenderer html={html} />);

      // Verify all table content is present
      expect(container.textContent).toContain('Header 1');
      expect(container.textContent).toContain('Header 2');
      expect(container.textContent).toContain('Header 3');
      expect(container.textContent).toContain('Body 1-1');
      expect(container.textContent).toContain('Body 1-2');
      expect(container.textContent).toContain('Body 1-3');
      expect(container.textContent).toContain('Body 2-1');
      expect(container.textContent).toContain('Body 2-2');
      expect(container.textContent).toContain('Body 2-3');
      expect(container.textContent).toContain('Footer 1');
      expect(container.textContent).toContain('Footer 2');
      expect(container.textContent).toContain('Footer 3');

      // Verify table cells are rendered as view elements
      const views = container.querySelectorAll('view');
      expect(views.length).toBeGreaterThan(0);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Semantic Block Elements', () => {
    it('should match snapshot for semantic HTML5 elements', () => {
      const html = `
        <article>
          <header>
            <h1>Article Header</h1>
          </header>
          <section>
            <h2>Section Title</h2>
            <p>Section content.</p>
          </section>
          <nav>
            <ul>
              <li><a href="#">Link 1</a></li>
              <li><a href="#">Link 2</a></li>
            </ul>
          </nav>
          <aside>
            <p>Sidebar content.</p>
          </aside>
          <footer>
            <p>Article footer.</p>
          </footer>
        </article>
      `;

      const { container } = render(<HTMLRenderer html={html} />);

      // Verify all semantic content is present
      expect(container.textContent).toContain('Article Header');
      expect(container.textContent).toContain('Section Title');
      expect(container.textContent).toContain('Section content');
      expect(container.textContent).toContain('Link 1');
      expect(container.textContent).toContain('Link 2');
      expect(container.textContent).toContain('Sidebar content');
      expect(container.textContent).toContain('Article footer');

      // Verify semantic elements are rendered as view
      const views = container.querySelectorAll('view');
      expect(views.length).toBeGreaterThan(0);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Inline Elements', () => {
    it('should match snapshot for various inline elements', () => {
      const html = `
        <div>
          <p>Link example: <a href="https://example.com">Example Link</a></p>
          <p>Code block: <code>console.log("hello")</code></p>
          <p>Span element: <span>Inline span</span></p>
        </div>
      `;

      const { container } = render(<HTMLRenderer html={html} />);

      // Verify inline content
      expect(container.textContent).toContain('Link example:');
      expect(container.textContent).toContain('Example Link');
      expect(container.textContent).toContain('Code block:');
      expect(container.textContent).toContain('console.log("hello")');
      expect(container.textContent).toContain('Span element:');
      expect(container.textContent).toContain('Inline span');

      expect(container).toMatchSnapshot();
    });
  });

  describe('Special Elements (hr, br, blockquote, pre)', () => {
    it('should match snapshot for special elements', () => {
      const html = `
        <div>
          <p>Text before horizontal rule</p>
          <hr />
          <p>Text after horizontal rule</p>
          <p>Line 1<br />Line 2<br />Line 3</p>
          <blockquote>
            <p>This is a blockquote with multiple lines.</p>
            <p>It can contain paragraphs.</p>
          </blockquote>
          <pre>const x = 1;
const y = 2;
console.log(x + y);</pre>
        </div>
      `;

      const { container } = render(<HTMLRenderer html={html} />);

      // Verify content
      expect(container.textContent).toContain('Text before horizontal rule');
      expect(container.textContent).toContain('Text after horizontal rule');
      expect(container.textContent).toContain('Line 1');
      expect(container.textContent).toContain('Line 2');
      expect(container.textContent).toContain('Line 3');
      expect(container.textContent).toContain('This is a blockquote');
      expect(container.textContent).toContain('It can contain paragraphs');
      expect(container.textContent).toContain('const x = 1');

      // Verify blockquote has border style
      const views = container.querySelectorAll('view');
      const blockquote = Array.from(views).find((v) =>
        v.getAttribute('style')?.includes('border-left'),
      );
      expect(blockquote).toBeDefined();

      // Verify pre has monospace font
      const texts = container.querySelectorAll('text');
      const pre = Array.from(texts).find((t) =>
        t.getAttribute('style')?.includes('monospace'),
      );
      expect(pre).toBeDefined();

      expect(container).toMatchSnapshot();
    });
  });

  describe('Image Element', () => {
    it('should match snapshot for image with attributes', () => {
      const html = `
        <div>
          <img src="https://example.com/image.jpg" alt="Example Image" />
          <p>Text below image</p>
        </div>
      `;

      const { container } = render(<HTMLRenderer html={html} />);

      // Verify image element
      const image = container.querySelector('image');
      expect(image).toBeDefined();
      expect(image?.getAttribute('src')).toBe('https://example.com/image.jpg');

      // Verify text content
      expect(container.textContent).toContain('Text below image');

      expect(container).toMatchSnapshot();
    });
  });

  describe('Inline Styles', () => {
    it('should match snapshot for elements with various inline styles', () => {
      const html = `
        <div style="padding: 20px; background-color: #f5f5f5;">
          <h2 style="color: #333; margin-bottom: 10px;">Styled Heading</h2>
          <p style="line-height: 1.6; color: #666;">
            Paragraph with <span style="color: red; font-weight: bold;">styled span</span>
          </p>
          <div style="border: 1px solid #ccc; padding: 10px; border-radius: 5px;">
            Nested styled div
          </div>
        </div>
      `;

      const { container } = render(<HTMLRenderer html={html} />);

      // Verify content
      expect(container.textContent).toContain('Styled Heading');
      expect(container.textContent).toContain('Paragraph with');
      expect(container.textContent).toContain('styled span');
      expect(container.textContent).toContain('Nested styled div');

      // Verify styles are applied
      const views = container.querySelectorAll('view');
      const hasBorderStyle = Array.from(views).some((v) =>
        v.getAttribute('style')?.includes('border'),
      );
      expect(hasBorderStyle).toBe(true);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Element Attributes', () => {
    it('should match snapshot for elements with common attributes', () => {
      const html = `
        <div id="main-container" class="container wrapper" data-testid="main">
          <p id="para-1" class="text-content">Paragraph with id and class</p>
          <div class="box" data-index="0">Div with data attribute</div>
        </div>
      `;

      const { container } = render(<HTMLRenderer html={html} />);

      // Verify content
      expect(container.textContent).toContain('Paragraph with id and class');
      expect(container.textContent).toContain('Div with data attribute');

      expect(container).toMatchSnapshot();
    });
  });

  describe('Deeply Nested Structure', () => {
    it('should match snapshot for deeply nested elements', () => {
      const html = `
        <div>
          <div>
            <div>
              <section>
                <article>
                  <div>
                    <p>
                      <span>
                        <strong>Deep nested text</strong>
                      </span>
                    </p>
                  </div>
                </article>
              </section>
            </div>
          </div>
        </div>
      `;

      const { container } = render(<HTMLRenderer html={html} />);

      // Verify deep content is present
      expect(container.textContent).toContain('Deep nested text');

      // Verify multiple nested views
      const views = container.querySelectorAll('view');
      expect(views.length).toBeGreaterThanOrEqual(6);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Complex Real-World Document', () => {
    it('should match snapshot for complete HTML document', () => {
      const html = `
        <article>
          <header>
            <h1>Article Title</h1>
            <p>Published on <span>2024-01-01</span></p>
          </header>

          <section>
            <h2>Introduction</h2>
            <p>This is an introduction paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>
            <p>It also contains a <a href="#">link</a> and some <code>inline code</code>.</p>
          </section>

          <section>
            <h2>Features</h2>
            <ul>
              <li>Feature 1 with <strong>emphasis</strong></li>
              <li>Feature 2</li>
              <li>
                Feature 3 with nested list:
                <ul>
                  <li>Sub-feature 3.1</li>
                  <li>Sub-feature 3.2</li>
                </ul>
              </li>
            </ul>
          </section>

          <section>
            <h2>Data Table</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Item 1</td>
                  <td>Type A</td>
                  <td>Description 1</td>
                </tr>
                <tr>
                  <td>Item 2</td>
                  <td>Type B</td>
                  <td>Description 2</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2>Code Example</h2>
            <pre>function hello() {
  console.log("Hello, World!");
}</pre>
            <p>Line break example:<br />First line<br />Second line</p>
          </section>

          <section>
            <h2>Quote</h2>
            <blockquote>
              <p>This is a blockquote containing important information.</p>
            </blockquote>
          </section>

          <footer>
            <hr />
            <p>&copy; 2024 Example. All rights reserved.</p>
          </footer>
        </article>
      `;

      const { container } = render(<HTMLRenderer html={html} />);

      // Verify all major content sections
      expect(container.textContent).toContain('Article Title');
      expect(container.textContent).toContain('Introduction');
      expect(container.textContent).toContain('bold text');
      expect(container.textContent).toContain('italic text');
      expect(container.textContent).toContain('link');
      expect(container.textContent).toContain('inline code');
      expect(container.textContent).toContain('Features');
      expect(container.textContent).toContain('Feature 1');
      expect(container.textContent).toContain('Feature 2');
      expect(container.textContent).toContain('Feature 3');
      expect(container.textContent).toContain('Sub-feature 3.1');
      expect(container.textContent).toContain('Sub-feature 3.2');
      expect(container.textContent).toContain('Data Table');
      expect(container.textContent).toContain('Name');
      expect(container.textContent).toContain('Type');
      expect(container.textContent).toContain('Description');
      expect(container.textContent).toContain('Item 1');
      expect(container.textContent).toContain('Item 2');
      expect(container.textContent).toContain('Type A');
      expect(container.textContent).toContain('Type B');
      expect(container.textContent).toContain('Description 1');
      expect(container.textContent).toContain('Description 2');
      expect(container.textContent).toContain('Code Example');
      expect(container.textContent).toContain('function hello');
      expect(container.textContent).toContain('Hello, World!');
      expect(container.textContent).toContain('First line');
      expect(container.textContent).toContain('Second line');
      expect(container.textContent).toContain('Quote');
      expect(container.textContent).toContain('This is a blockquote');
      expect(container.textContent).toContain('2024 Example');
      expect(container.textContent).toContain('All rights reserved');

      // Verify various element types are rendered
      const views = container.querySelectorAll('view');
      expect(views.length).toBeGreaterThan(0);

      const texts = container.querySelectorAll('text');
      expect(texts.length).toBeGreaterThan(0);

      const images = container.querySelectorAll('image');
      expect(images.length).toBe(0); // No images in this document

      expect(container).toMatchSnapshot();
    });
  });

  describe('Edge Cases and Special Characters', () => {
    it('should match snapshot for edge cases', () => {
      const html = `
        <div>
          <p>Special characters: &lt; &gt; &amp; &quot; &apos;</p>
          <p>Unicode: 中文 日本語 한국어 🎉</p>
          <p>Multiple spaces:     and    tabs</p>
          <p>Empty elements: <span></span> and <div><!-- comment --></div></p>
        </div>
      `;

      const { container } = render(<HTMLRenderer html={html} />);

      // Verify special characters are properly decoded
      expect(container.textContent).toContain('Special characters:');
      expect(container.textContent).toContain('<');
      expect(container.textContent).toContain('>');
      expect(container.textContent).toContain('&');
      expect(container.textContent).toContain('"');
      expect(container.textContent).toContain("'");

      // Verify Unicode characters
      expect(container.textContent).toContain('中文');
      expect(container.textContent).toContain('日本語');
      expect(container.textContent).toContain('한국어');
      expect(container.textContent).toContain('🎉');

      // Verify comment is not rendered
      expect(container.textContent).not.toContain('comment');

      expect(container).toMatchSnapshot();
    });
  });
});
