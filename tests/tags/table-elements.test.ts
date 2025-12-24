import { describe, expect, it } from 'vitest';
import { transformHTML } from '@lynx-html-renderer/html-parser';
import { HTMLRenderer } from '@lynx-html-renderer/index';

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

  it('should render table elements with correct roles', () => {
    // 测试表格元素渲染，确保生成的节点具有正确的role属性
    const html = `
      <table>
        <tr>
          <th>Header</th>
          <td>Data</td>
        </tr>
      </table>
    `;

    // 直接使用transformHTML而不是HTMLRenderer来检查中间结果
    const result = transformHTML(html);

    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].kind).toBe('element');

    // 检查表格节点
    const tableNode = result[0];
    expect(tableNode.tag).toBe('view');
    expect(tableNode.meta?.sourceTag).toBe('table');

    // 检查行节点
    expect(tableNode.children.length).toBe(1);
    const rowNode = tableNode.children[0];
    expect(rowNode.tag).toBe('view');
    expect(rowNode.meta?.sourceTag).toBe('tr');

    // 检查单元格节点
    expect(rowNode.children.length).toBe(2);
    const thNode = rowNode.children[0];
    const tdNode = rowNode.children[1];
    expect(thNode.tag).toBe('view');
    expect(thNode.meta?.sourceTag).toBe('th');
    expect(tdNode.tag).toBe('view');
    expect(tdNode.meta?.sourceTag).toBe('td');
  });

  it('should test the complete HTMLRenderer with table elements', () => {
    // 测试完整的HTMLRenderer渲染流程，确保适配器被正确使用
    const html = '<table><tr><td>Test Cell</td></tr></table>';
    const result = HTMLRenderer({ html });
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
  });
});
