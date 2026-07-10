import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Fixture } from './types.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export const fixtures: Fixture[] = [
  {
    id: 'showcase',
    source: 'custom',
    file: resolve(__dirname, '../../example/html/showcase.html'),
    features: ['heading', 'paragraph', 'list', 'table', 'image', 'inline-format'],
    description: '项目自带的 showcase HTML，用于初始跑通流程',
  },
];
