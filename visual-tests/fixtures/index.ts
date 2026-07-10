import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Fixture } from './types.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const r = (name: string) => resolve(__dirname, name);

export const fixtures: Fixture[] = [
  {
    id: 'basic-tags-cleaning',
    source: 'readability',
    file: r('basic-tags-cleaning.html'),
    features: ['heading', 'paragraph', 'nested-structure'],
    description: '基础标签清理测试，h1/h2 + 段落，结构简单',
  },
  {
    id: 'base-url',
    source: 'readability',
    file: r('base-url.html'),
    features: ['heading', 'paragraph', 'image', 'inline-format', 'nested-structure'],
    description: '相对/绝对 URL 处理，含图片与链接',
  },
  {
    id: 'ars-1',
    source: 'readability',
    file: r('ars-1.html'),
    features: ['heading', 'list', 'blockquote', 'figure', 'image', 'inline-format', 'nested-structure'],
    description: 'Ars Technica 文章，覆盖引用、figure、代码、内联格式',
  },
  {
    id: 'bbc-1',
    source: 'readability',
    file: r('bbc-1.html'),
    features: ['heading', 'list', 'image', 'figure', 'inline-format', 'nested-structure'],
    description: 'BBC 新闻，大量 figure/img 与多层嵌套',
  },
  {
    id: 'aclu',
    source: 'readability',
    file: r('aclu.html'),
    features: ['heading', 'list', 'blockquote', 'figure', 'image', 'inline-format', 'nested-structure'],
    description: 'ACLU 文章，含 blockquote、figure、strong/em',
  },
  {
    id: 'keep-tabular-data',
    source: 'readability',
    file: r('keep-tabular-data.html'),
    features: ['table', 'list', 'image', 'inline-format', 'nested-structure'],
    description: 'Factorio 博客，保留表格数据，图片密集',
  },
  {
    id: 'v8-blog',
    source: 'readability',
    file: r('v8-blog.html'),
    features: ['heading', 'list', 'inline-format', 'nested-structure'],
    description: 'V8 引擎博客，大量 code/strong/em 内联代码',
  },
  {
    id: 'medium-1',
    source: 'readability',
    file: r('medium-1.html'),
    features: ['heading', 'list', 'figure', 'image', 'inline-format', 'nested-structure'],
    description: 'Medium 文章，figure + strong/em 内联格式',
  },
  {
    id: 'wikipedia',
    source: 'readability',
    file: r('wikipedia.html'),
    features: ['heading', 'list', 'table', 'blockquote', 'image', 'inline-format', 'nested-structure'],
    description: 'Wikipedia 词条，表格、引用、列表全覆盖',
  },
  {
    id: 'keep-images',
    source: 'readability',
    file: r('keep-images.html'),
    features: ['heading', 'list', 'figure', 'image', 'inline-format', 'nested-structure'],
    description: '保留图片测试，figure 与 em 内联格式',
  },
];
