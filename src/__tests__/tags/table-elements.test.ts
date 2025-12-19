import { describe, expect, it } from 'vitest';
import { transformHTML } from '../../html-parser';

describe('Table Elements', () => {
  it('should transform simple table structure', () => {
    const html = `
      <table>
        <tr>
          <td>Cell 1</td>
          <td>Cell 2</td>
        </tr>
        <tr>
          <td>Cell 3</td>
          <td>Cell 4</td>
        </tr>
      </table>
    `;
    const result = transformHTML(html);

    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('element');
    expect(result[0].tag).toBe('view');
    expect(result[0].meta?.sourceTag).toBe('table');

    // Check table has two rows
    expect(result[0].children).toHaveLength(2);

    // Check first row has two cells
    expect(result[0].children[0].kind).toBe('element');
    expect(result[0].children[0].tag).toBe('view');
    expect(result[0].children[0].meta?.sourceTag).toBe('tr');
    expect(result[0].children[0].children).toHaveLength(2);

    // Check cell content
    expect(result[0].children[0].children[0].children[0].content).toBe(
      'Cell 1',
    );
    expect(result[0].children[0].children[1].children[0].content).toBe(
      'Cell 2',
    );
  });

  it('should handle table with thead, tbody and tfoot', () => {
    const html = `
      <table>
        <thead>
          <tr><th>Header 1</th><th>Header 2</th></tr>
        </thead>
        <tbody>
          <tr><td>Data 1</td><td>Data 2</td></tr>
        </tbody>
        <tfoot>
          <tr><td>Footer 1</td><td>Footer 2</td></tr>
        </tfoot>
      </table>
    `;
    const result = transformHTML(html);

    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('element');
    expect(result[0].tag).toBe('view');

    // Check table has three rows (thead, tbody, tfoot are flattened)
    expect(result[0].children).toHaveLength(3);
  });
});
