// fixture-registry.ts
// 编译时注册所有视觉测试 fixture HTML。
// rspeedy 的 asset/source loader 将每个 .html import 内联为字符串。
// readability fixture 是完整 HTML 文档（含 <html><head><body>），
// HTMLRenderer 只处理 body 内容，因此提取 body 的 innerHTML。
// App 通过 lynx.__globalProps.fixture 查找注册表。

import aclu from '../../visual-tests/fixtures/aclu.html';
import ars1 from '../../visual-tests/fixtures/ars-1.html';
import baseUrl from '../../visual-tests/fixtures/base-url.html';
import basicTags from '../../visual-tests/fixtures/basic-tags-cleaning.html';
import bbc1 from '../../visual-tests/fixtures/bbc-1.html';
import keepImages from '../../visual-tests/fixtures/keep-images.html';
import keepTabular from '../../visual-tests/fixtures/keep-tabular-data.html';
import medium1 from '../../visual-tests/fixtures/medium-1.html';
import v8Blog from '../../visual-tests/fixtures/v8-blog.html';
import wikipedia from '../../visual-tests/fixtures/wikipedia.html';

/** 从完整 HTML 文档中提取 body 内容 */
function extractBody(html: string): string {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1].trim() : html;
}

export const fixtureRegistry: Record<string, string> = {
  aclu: extractBody(aclu),
  'ars-1': extractBody(ars1),
  'base-url': extractBody(baseUrl),
  'basic-tags-cleaning': extractBody(basicTags),
  'bbc-1': extractBody(bbc1),
  'keep-images': extractBody(keepImages),
  'keep-tabular-data': extractBody(keepTabular),
  'medium-1': extractBody(medium1),
  'v8-blog': extractBody(v8Blog),
  wikipedia: extractBody(wikipedia),
};
