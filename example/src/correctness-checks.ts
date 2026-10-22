import type { LynxNode, TransformOptions } from 'lynx-html-renderer';
import { HTMLTransformError } from 'lynx-html-renderer/errors';
import { transformHTML } from 'lynx-html-renderer/html-parser';

interface ConversionCheck {
  name: string;
  actual: string;
  passed: boolean;
}

function textContent(nodes: LynxNode[]): string {
  return nodes
    .map((node) =>
      node.kind === 'text' ? node.content : textContent(node.children),
    )
    .join('');
}

/** Run in the device JS runtime; this checks conversion, not native CSS support. */
export function runConversionChecks(
  styleMode: 'inline' | 'css-class',
): ConversionCheck[] {
  const checks: ConversionCheck[] = [];
  function check(name: string, read: () => unknown, expected: unknown) {
    try {
      const value = read();
      checks.push({
        name,
        passed: JSON.stringify(value) === JSON.stringify(expected),
        actual: JSON.stringify(value) ?? 'undefined',
      });
    } catch (error) {
      checks.push({
        name,
        passed: false,
        actual: error instanceof Error ? error.message : String(error),
      });
    }
  }
  function styles(html: string, options?: TransformOptions) {
    const [node] = transformHTML(html, { styleMode, ...options });
    if (node?.kind !== 'element') throw new Error('Expected an element');
    return node.props.style ?? {};
  }

  check(
    'CSS 引号内分号',
    () => styles(`<div style='font-family:"A;B";color:red'></div>`).fontFamily,
    '"A;B"',
  );
  check(
    'CSS Data URL 内分号（仅检查声明完整性）',
    () =>
      styles(
        `<div style='background-image:url("data:image/png;base64,AAAA");color:red'></div>`,
      ).backgroundImage,
    'url("data:image/png;base64,AAAA")',
  );
  check(
    'CSS 注释与转义引号',
    () =>
      styles(
        String.raw`<div style='/* x;y */ font-family:"A\";B";color:red'></div>`,
      ).fontFamily,
    String.raw`"A\";B"`,
  );
  check('CSS 变量名称与大小写', () => {
    const value = styles('<div style="--Theme:red;--theme:blue"></div>');
    return [value['--Theme'], value['--theme']];
  }, ['red', 'blue']);
  check(
    'CSS 同名声明 !important 优先级',
    () => styles('<div style="color:red !important;color:blue"></div>').color,
    'red !important',
  );
  check(
    'pre 首尾空白与 code 间换行',
    () =>
      textContent(
        transformHTML(
          '<pre>  <code>one</code>\n\t  <code>two</code>\n </pre>',
          { styleMode },
        ),
      ),
    '  one\n\t  two\n ',
  );
  check('移除样式仍保留图片尺寸', () => {
    const value = styles(
      '<img src="x.png" width="100" height="50" style="width:200px;color:red">',
      { removeAllStyle: true },
    );
    return [value.width, value.height, value.color ?? null];
  }, ['200px', '50px', null]);
  check('图片零尺寸与百分比', () => {
    const value = styles('<img src="x.png" width="0" height="50%">');
    return [value.width, value.height];
  }, ['0px', '50%']);
  check(
    '嵌套倒序列表独立编号',
    () =>
      textContent(
        transformHTML(
          '<ol reversed><li>A<ol start="7"><li>B</li></ol></li><li>C</li></ol>',
          { styleMode },
        ),
      ),
    '2. A7. B1. C',
  );

  const limitInputs: Array<{
    name: string;
    html: string;
    options?: TransformOptions;
  }> = [
    {
      name: '默认深度限制（2,000 层）',
      html: `${'<div>'.repeat(2000)}x${'</div>'.repeat(2000)}`,
    },
    {
      name: '节点数限制',
      html: '<p>x</p>',
      options: { limits: { maxNodes: 1 } },
    },
    {
      name: '输入长度限制',
      html: '<p>x</p>',
      options: { limits: { maxInputLength: 7 } },
    },
  ];
  for (const { name, html, options } of limitInputs) {
    check(
      name,
      () => {
        try {
          transformHTML(html, { styleMode, ...options });
          return '未拒绝超限输入';
        } catch (error) {
          if (error instanceof HTMLTransformError) return error.code;
          throw error;
        }
      },
      'LIMIT_EXCEEDED',
    );
  }
  return checks;
}
