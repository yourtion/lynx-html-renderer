/**
 * Table Elements Integration Tests
 *
 * Tests for table-related HTML elements:
 * - table
 * - thead, tbody, tfoot
 * - tr
 * - th, td
 */

import '@testing-library/jest-dom';
import { render } from '@lynx-js/react/testing-library';
import { describe, expect, it } from 'vitest';
import { HTMLRenderer } from '@lynx-html-renderer/index';

describe('Table Elements Integration Tests', () => {
  describe('Basic Table Structure', () => {
    it('should render simple table with rows and cells', () => {
      const html = `
        <table>
          <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
          </tr>
        </table>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Cell 1');
      expect(container.textContent).toContain('Cell 2');
    });

    it('should render table element', () => {
      const html = '<table><tr><td>Content</td></tr></table>';
      const { container } = render(<HTMLRenderer html={html} />);

      const views = container.querySelectorAll('view');
      expect(views.length).toBeGreaterThan(0);
    });

    it('should render tr elements', () => {
      const html = `
        <table>
          <tr><td>Row 1</td></tr>
          <tr><td>Row 2</td></tr>
        </table>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Row 1');
      expect(container.textContent).toContain('Row 2');
    });

    it('should render td elements', () => {
      const html = '<tr><td>Cell 1</td><td>Cell 2</td><td>Cell 3</td></tr>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Cell 1');
      expect(container.textContent).toContain('Cell 2');
      expect(container.textContent).toContain('Cell 3');
    });
  });

  describe('Table Header Elements', () => {
    it('should render thead element', () => {
      const html = `
        <table>
          <thead>
            <tr>
              <th>Header 1</th>
              <th>Header 2</th>
            </tr>
          </thead>
        </table>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Header 1');
      expect(container.textContent).toContain('Header 2');
    });

    it('should render th elements', () => {
      const html = '<tr><th>Column 1</th><th>Column 2</th></tr>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Column 1');
      expect(container.textContent).toContain('Column 2');
    });

    it('should render tbody element', () => {
      const html = `
        <table>
          <tbody>
            <tr>
              <td>Data 1</td>
              <td>Data 2</td>
            </tr>
          </tbody>
        </table>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Data 1');
      expect(container.textContent).toContain('Data 2');
    });

    it('should render tfoot element', () => {
      const html = `
        <table>
          <tfoot>
            <tr>
              <td>Footer 1</td>
              <td>Footer 2</td>
            </tr>
          </tfoot>
        </table>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Footer 1');
      expect(container.textContent).toContain('Footer 2');
    });
  });

  describe('Complete Table Structure', () => {
    it('should render table with thead, tbody, and tfoot', () => {
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
    });

    it('should render table without thead/tbody/tfoot', () => {
      const html = `
        <table>
          <tr>
            <td>Direct row 1</td>
          </tr>
          <tr>
            <td>Direct row 2</td>
          </tr>
        </table>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Direct row 1');
      expect(container.textContent).toContain('Direct row 2');
    });
  });

  describe('Table Cell Content', () => {
    it('should render cells with plain text', () => {
      const html = '<tr><td>Plain text</td></tr>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe('Plain text');
    });

    it('should render cells with inline formatting', () => {
      const html = `
        <tr>
          <td><strong>Bold</strong> text</td>
          <td><em>Italic</em> text</td>
        </tr>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Bold text');
      expect(container.textContent).toContain('Italic text');
    });

    it('should render cells with mixed content', () => {
      const html = `
        <tr>
          <td>
            Text with <strong>bold</strong>, <em>italic</em>, and <u>underline</u>
          </td>
        </tr>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Text with');
      expect(container.textContent).toContain('bold');
      expect(container.textContent).toContain('italic');
      expect(container.textContent).toContain('underline');
    });

    it('should render cells with links', () => {
      const html = '<tr><td><a href="#">Link</a></td></tr>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Link');
    });

    it('should render cells with code', () => {
      const html = '<tr><td><code>const x = 1;</code></td></tr>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('const x = 1;');
    });
  });

  describe('Complex Table Scenarios', () => {
    it('should render table with multiple rows and columns', () => {
      const html = `
        <table>
          <tr>
            <td>1-1</td>
            <td>1-2</td>
            <td>1-3</td>
            <td>1-4</td>
          </tr>
          <tr>
            <td>2-1</td>
            <td>2-2</td>
            <td>2-3</td>
            <td>2-4</td>
          </tr>
          <tr>
            <td>3-1</td>
            <td>3-2</td>
            <td>3-3</td>
            <td>3-4</td>
          </tr>
        </table>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      for (let row = 1; row <= 3; row++) {
        for (let col = 1; col <= 4; col++) {
          expect(container.textContent).toContain(`${row}-${col}`);
        }
      }
    });

    it('should render table with styled cells', () => {
      const html = `
        <table>
          <tr>
            <td style="color: red;">Red text</td>
            <td style="font-weight: bold;">Bold text</td>
          </tr>
        </table>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Red text');
      expect(container.textContent).toContain('Bold text');
    });

    it('should render table with header and data cells', () => {
      const html = `
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>City</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>John</td>
              <td>25</td>
              <td>New York</td>
            </tr>
            <tr>
              <td>Jane</td>
              <td>30</td>
              <td>London</td>
            </tr>
          </tbody>
        </table>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Name');
      expect(container.textContent).toContain('Age');
      expect(container.textContent).toContain('City');
      expect(container.textContent).toContain('John');
      expect(container.textContent).toContain('25');
      expect(container.textContent).toContain('New York');
      expect(container.textContent).toContain('Jane');
      expect(container.textContent).toContain('30');
      expect(container.textContent).toContain('London');
    });

    it('should render table with formatted content in cells', () => {
      const html = `
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Bold Text</strong></td>
              <td>Description with <em>emphasis</em></td>
            </tr>
            <tr>
              <td><code>inline code</code></td>
              <td>Link to <a href="#">example</a></td>
            </tr>
          </tbody>
        </table>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Feature');
      expect(container.textContent).toContain('Description');
      expect(container.textContent).toContain('Bold Text');
      expect(container.textContent).toContain('emphasis');
      expect(container.textContent).toContain('inline code');
      expect(container.textContent).toContain('example');
    });
  });

  describe('Table Flex Layout', () => {
    it('should render table with flex layout properties', () => {
      const html = '<table><tr><td>Cell</td></tr></table>';
      const { container } = render(<HTMLRenderer html={html} />);

      const views = container.querySelectorAll('view');
      expect(views.length).toBeGreaterThan(0);
    });

    it('should render row with flex row layout', () => {
      const html = '<tr><td>Cell 1</td><td>Cell 2</td></tr>';
      const { container } = render(<HTMLRenderer html={html} />);

      const views = container.querySelectorAll('view');
      expect(views.length).toBeGreaterThan(0);
    });

    it('should render cell with flex and padding styles', () => {
      const html = '<td>Cell content</td>';
      const { container } = render(<HTMLRenderer html={html} />);

      const views = container.querySelectorAll('view');
      expect(views.length).toBeGreaterThan(0);
      expect(container.textContent).toBe('Cell content');
    });
  });

  describe('Table Edge Cases', () => {
    it('should render table with single cell', () => {
      const html = '<table><tr><td>Only cell</td></tr></table>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toBe('Only cell');
    });

    it('should render table with empty cells', () => {
      const html = '<tr><td></td><td>Content</td><td></td></tr>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Content');
    });

    it('should render table with cells containing special characters', () => {
      const html = '<tr><td>&lt;tag&gt; &amp; &quot;text&quot;</td></tr>';
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('<tag>');
      expect(container.textContent).toContain('&');
      expect(container.textContent).toContain('"text"');
    });

    it('should render table with nested structure in cells', () => {
      const html = `
        <tr>
          <td>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </td>
        </tr>
      `;
      const { container } = render(<HTMLRenderer html={html} />);

      expect(container.textContent).toContain('Item 1');
      expect(container.textContent).toContain('Item 2');
    });
  });
});
