# 视觉对齐验证套件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一套独立的视觉对齐验证工具，能够截取 Chromium 原始 HTML 渲染和 Lynx Web Preview 渲染的截图，用 pixelmatch + looks-same 对比，生成对齐评估 HTML 报告，同时支持基于 baseline 的回归测试。

**Architecture:** 独立 `visual-tests/` 目录，三层解耦（采集层 providers / 对比层 compare / 报告层 reports）。采集层用可插拔 provider 接口，当前实现 chromium 和 lynx-web 两个 provider，iOS/Android 预留接口。回归模式走 Playwright `toHaveScreenshot()`，对齐评估模式走自定义 Node 脚本流水线。复用 example 的 rspeedy 应用，通过 query param 注入 fixture HTML。

**Tech Stack:** Playwright（截图 + 回归 test runner）、pixelmatch（主对比）、looks-same（AA 复核）、sharp（图像处理）、tsx（运行 TS 脚本）、Vitest（现有，不动）

---

## 文件结构总览

### 新建文件

```
visual-tests/
├── fixtures/
│   ├── types.ts                    # Fixture 类型定义
│   ├── index.ts                    # fixture 注册表
│   ├── README.md                   # 来源 + 许可证标注
│   └── *.html                      # readability 精选 HTML（10-15 个）
├── providers/
│   ├── types.ts                    # ScreenshotProvider 接口 + 公共类型
│   ├── chromium-provider.ts        # Chromium 原始 HTML 截图
│   ├── lynx-web-provider.ts        # Lynx Web Preview 截图
│   ├── lynx-ios-provider.ts        # 预留（available: false）
│   ├── lynx-android-provider.ts    # 预留（available: false）
│   └── index.ts                    # provider 注册表
├── compare/
│   ├── types.ts                    # ComparisonResult 类型
│   ├── config.ts                   # 对比阈值配置
│   └── compare-images.ts           # pixelmatch + looks-same 两段式对比
├── reports/
│   └── generate-report.ts          # HTML 对齐报告生成
├── playwright.config.ts            # 回归模式配置
├── regression.spec.ts              # 回归测试用例
├── run-align.ts                    # 对齐评估模式入口脚本
└── README.md                       # 使用说明
```

### 修改文件

```
example/src/App.tsx                 # 加 query param 分支支持 fixture 注入
package.json                        # 新增 devDependencies + scripts
.gitignore                          # 忽略 reports/ 和 node_modules
```

---

## Task 1: 安装依赖 + 配置 npm scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 devDependencies**

Run:
```bash
pnpm add -D @playwright/test pixelmatch looks-same sharp @types/pixelmatch
```

- [ ] **Step 2: 安装 Playwright 浏览器二进制**

Run:
```bash
pnpm exec playwright install chromium
```

- [ ] **Step 3: 在 `package.json` 的 `scripts` 里添加视觉测试命令**

在 `"generate:css"` 行之后添加以下 4 行（注意前一行末尾加逗号）：

```json
    "generate:css": "node scripts/generate-css.mjs",
    "test:visual": "playwright test --config visual-tests/playwright.config.ts",
    "test:visual:update": "playwright test --config visual-tests/playwright.config.ts --update-snapshots",
    "test:visual:align": "tsx visual-tests/run-align.ts",
    "test:visual:report": "open visual-tests/reports/align-report.html"
```

- [ ] **Step 4: 验证依赖安装成功**

Run:
```bash
node -e "require('pixelmatch'); require('looks-same'); require('sharp'); console.log('deps OK')"
```
Expected: 输出 `deps OK`

- [ ] **Step 5: 验证 Playwright 可用**

Run:
```bash
pnpm exec playwright --version
```
Expected: 输出版本号（如 `Version 1.x.x`）

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: 添加视觉测试依赖 (playwright/pixelmatch/looks-same/sharp)"
```

---

## Task 2: 创建 visual-tests 目录骨架 + .gitignore

**Files:**
- Create: `visual-tests/README.md`
- Create: `visual-tests/.gitignore`
- Modify: `.gitignore`

- [ ] **Step 1: 创建 visual-tests 目录结构**

Run:
```bash
mkdir -p visual-tests/{fixtures,providers,compare,reports}
```

- [ ] **Step 2: 创建 `visual-tests/.gitignore`**

文件内容：
```
reports/*
!reports/.gitkeep
__screenshots__/
```

- [ ] **Step 3: 在根目录 `.gitignore` 中确保 `node_modules` 已被忽略（检查即可，通常已存在）**

Run:
```bash
grep -q 'node_modules' .gitignore && echo "OK: node_modules already ignored" || echo 'node_modules' >> .gitignore
```

- [ ] **Step 4: 创建 `visual-tests/README.md`**

文件内容：
```markdown
# Visual Alignment Tests

视觉对齐验证套件，用于评估 lynx-html-renderer 的渲染效果与浏览器渲染的对齐程度。

## 用法

```bash
# 回归测试（CI 友好）— 对比 Lynx Web Preview 与已提交的 baseline
pnpm test:visual

# 更新 baseline（手动确认渲染无误后）
pnpm test:visual:update

# 对齐评估 — 截取 Chromium + Lynx Web Preview，生成对比报告
pnpm test:visual:align

# 打开对齐报告
pnpm test:visual:report
```

## 架构

详见 `docs/superpowers/specs/2026-07-10-visual-alignment-testing-design.md`
```

- [ ] **Step 5: Commit**

```bash
git add visual-tests/
git commit -m "chore: 创建 visual-tests 目录骨架"
```

---

## Task 3: Fixture 类型定义与注册表

**Files:**
- Create: `visual-tests/fixtures/types.ts`
- Create: `visual-tests/fixtures/index.ts`

- [ ] **Step 1: 创建 Fixture 类型定义 `visual-tests/fixtures/types.ts`**

```typescript
/** 单个测试样本的元信息 */
export interface Fixture {
  /** 唯一 id，用于文件命名和报告引用 */
  readonly id: string;
  /** 来源标记（可追溯） */
  readonly source: 'readability' | 'custom';
  /** fixture 文件绝对路径 */
  readonly file: string;
  /** 该 fixture 覆盖的特性标签，用于报告分组 */
  readonly features: string[];
  /** 简短描述 */
  readonly description: string;
}
```

- [ ] **Step 2: 创建 fixture 注册表 `visual-tests/fixtures/index.ts`**

先用一个占位 fixture（showcase.html）跑通流程，后续 Task 4 替换为 readability 样本。

```typescript
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
```

- [ ] **Step 3: 验证类型检查通过**

Run:
```bash
pnpm typecheck
```
Expected: 无错误（因为 `visual-tests/` 还没被 tsconfig 包含，下一步处理）

- [ ] **Step 4: Commit**

```bash
git add visual-tests/fixtures/
git commit -m "feat(visual-tests): fixture 类型定义与注册表"
```

---

## Task 4: 准备 readability 精选样本

**Files:**
- Create: `visual-tests/fixtures/*.html`（10-15 个文件）
- Create: `visual-tests/fixtures/README.md`
- Modify: `visual-tests/fixtures/index.ts`

- [ ] **Step 1: 克隆 readability 仓库到临时位置**

Run:
```bash
cd /tmp && git clone --depth 1 https://github.com/mozilla/readability.git readability-samples
ls readability-samples/test/test-pages/ | head -30
```

- [ ] **Step 2: 逐个检查候选 case 的 HTML 特性，选出 10-15 个**

检查以下候选 case 的 `source.html`，确认覆盖目标特性：

Run:
```bash
for case in basic-tags-cleaning keep-tabular-data meta-fragment image-interpretation base-url ars-1 bbc-1 aclu wiki-1 nyt-1; do
  echo "=== $case ==="
  if [ -f "/tmp/readability-samples/test/test-pages/$case/source.html" ]; then
    # 提取关键标签统计
    grep -oiE '<(h[1-6]|ul|ol|table|blockquote|img|figure|strong|em|code|a)[^>]*>' "/tmp/readability-samples/test/test-pages/$case/source.html" | sed 's/<//;s/[^a-z0-9].*//' | sort | uniq -c | sort -rn
  else
    echo "NOT FOUND"
  fi
done
```

根据实际输出，选出覆盖以下特性的 10-15 个 case：
- 标题 + 段落（heading, paragraph）
- 列表（list: ul/ol）
- 引用（blockquote）
- 图片（image: img/figure）
- 嵌套 div（nested-structure）
- 表格（table）
- 内联格式（inline-format: strong/em/code/a）

**如果某个 case 不存在或特性不匹配，用 `ls /tmp/readability-samples/test/test-pages/` 找替代。**

- [ ] **Step 3: 拷贝选中的 source.html 到 fixtures/**

对每个选中的 case，拷贝并重命名。示例（实际 case 名按 Step 2 结果调整）：

```bash
cd /Users/yourtionguo/codes/open/lynx-html-renderer

# 示例：按 Step 2 选出的 case 列表逐个拷贝
for case in basic-tags-cleaning keep-tabular-data meta-fragment image-interpretation base-url ars-1 bbc-1 aclu; do
  cp "/tmp/readability-samples/test/test-pages/$case/source.html" "visual-tests/fixtures/$case.html"
done
```

- [ ] **Step 4: 创建 `visual-tests/fixtures/README.md`，标注每个 fixture 的来源和许可证**

```markdown
# Test Fixtures

来源：[mozilla/readability](https://github.com/mozilla/readability) `test/test-pages/<case>/source.html`

许可证：Apache-2.0（readability 项目）。部分 case 的原始内容来自 CC BY-SA 3.0 授权的文章。

## Fixture 清单

| 文件 | readability case | 来源 URL |
|------|-----------------|----------|
| basic-tags-cleaning.html | basic-tags-cleaning | https://github.com/mozilla/readability/tree/main/test/test-pages/basic-tags-cleaning |
| keep-tabular-data.html | keep-tabular-data | https://github.com/mozilla/readability/tree/main/test/test-pages/keep-tabular-data |
| ... | ... | ... |

（按实际选中的 case 逐行填写）

这些 fixture 仅作为测试输入数据，不重新分发为产品内容。
```

- [ ] **Step 5: 更新 `visual-tests/fixtures/index.ts`，注册所有 fixture**

```typescript
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
    features: ['heading', 'paragraph'],
    description: '基本标题和段落标签',
  },
  {
    id: 'keep-tabular-data',
    source: 'readability',
    file: r('keep-tabular-data.html'),
    features: ['table', 'list'],
    description: '表格和列表数据',
  },
  {
    id: 'meta-fragment',
    source: 'readability',
    file: r('meta-fragment.html'),
    features: ['blockquote', 'inline-format'],
    description: '引用和内联格式',
  },
  {
    id: 'image-interpretation',
    source: 'readability',
    file: r('image-interpretation.html'),
    features: ['image', 'figure'],
    description: '图片和 figure 元素',
  },
  {
    id: 'base-url',
    source: 'readability',
    file: r('base-url.html'),
    features: ['nested-structure', 'inline-format'],
    description: '嵌套 div 和链接',
  },
  {
    id: 'ars-1',
    source: 'readability',
    file: r('ars-1.html'),
    features: ['heading', 'paragraph', 'inline-format'],
    description: '真实文章：标题、段落、内联格式混合',
  },
  {
    id: 'bbc-1',
    source: 'readability',
    file: r('bbc-1.html'),
    features: ['heading', 'paragraph', 'image'],
    description: '真实文章：BBC 新闻',
  },
  {
    id: 'aclu',
    source: 'readability',
    file: r('aclu.html'),
    features: ['heading', 'paragraph', 'nested-structure'],
    description: '真实文章：深层标题层级',
  },
];
```

**注意：** 以上列表是示例，实际的 fixture id、features、description 必须按 Step 2 检查到的实际内容填写。

- [ ] **Step 6: 验证所有 fixture 文件存在且可读**

Run:
```bash
node -e "
import('./visual-tests/fixtures/index.ts').then(m => {
  const fs = require('fs');
  for (const f of m.fixtures) {
    const exists = fs.existsSync(f.file);
    const size = exists ? fs.statSync(f.file).size : 0;
    console.log(exists ? '✅' : '❌', f.id, f.file, size + ' bytes');
  }
}).catch(e => console.error(e));
"
```
Expected: 所有 fixture 显示 ✅ 且 size > 0

- [ ] **Step 7: 清理临时仓库**

Run:
```bash
rm -rf /tmp/readability-samples
```

- [ ] **Step 8: Commit**

```bash
git add visual-tests/fixtures/
git commit -m "feat(visual-tests): 添加 readability 精选样本 (10-15 个真实文章 HTML)"
```

---

## Task 5: Provider 类型定义

**Files:**
- Create: `visual-tests/providers/types.ts`

- [ ] **Step 1: 创建 `visual-tests/providers/types.ts`**

```typescript
import type { Fixture } from '../fixtures/types.js';

/** 视口尺寸 */
export interface Viewport {
  width: number;
  height: number;
}

/** 截图结果 */
export interface Screenshot {
  /** 图片 PNG Buffer */
  buffer: Buffer;
  /** 实际宽度 */
  width: number;
  /** 实际高度 */
  height: number;
  /** 产生此截图的 provider 名 */
  provider: string;
}

/** 截图采集器接口 — 每个平台一个实现 */
export interface ScreenshotProvider {
  /** 平台标识 */
  readonly name: ProviderName;

  /** 此 provider 当前是否可用（iOS/Android 未实现时为 false） */
  readonly available: boolean;

  /** 初始化资源，全局调一次 */
  setup(): Promise<void>;

  /** 释放资源，全局调一次 */
  teardown(): Promise<void>;

  /** 给定 fixture 和视口，返回截图 */
  capture(fixture: Fixture, viewport: Viewport): Promise<Screenshot>;
}

/** 所有支持的 provider 名称 */
export type ProviderName = 'chromium' | 'lynx-web' | 'lynx-ios' | 'lynx-android';

/** Provider 未实现错误 */
export class ProviderNotImplementedError extends Error {
  constructor(providerName: string) {
    super(`Provider "${providerName}" is not implemented yet`);
    this.name = 'ProviderNotImplementedError';
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add visual-tests/providers/types.ts
git commit -m "feat(visual-tests): ScreenshotProvider 接口定义"
```

---

## Task 6: Chromium Provider

**Files:**
- Create: `visual-tests/providers/chromium-provider.ts`

- [ ] **Step 1: 创建 `visual-tests/providers/chromium-provider.ts`**

```typescript
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import type { ScreenshotProvider, Screenshot, Viewport } from './types.js';
import type { Fixture } from '../fixtures/types.js';

/**
 * Chromium 原始 HTML 渲染 provider。
 * 将 fixture HTML 直接在浏览器中渲染并截图，作为「用户眼中的正确渲染」基准。
 */
export class ChromiumProvider implements ScreenshotProvider {
  readonly name = 'chromium' as const;
  readonly available = true;

  private browser: import('@playwright/test').Browser | null = null;

  async setup(): Promise<void> {
    this.browser = await chromium.launch();
  }

  async teardown(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
  }

  async capture(fixture: Fixture, viewport: Viewport): Promise<Screenshot> {
    if (!this.browser) {
      throw new Error('ChromiumProvider not initialized — call setup() first');
    }

    const html = await readFile(fixture.file, 'utf-8');
    const page = await this.browser.newPage({ viewport });

    try {
      await page.setContent(html, { waitUntil: 'load' });
      // 等待字体和图片渲染稳定
      await page.waitForTimeout(500);
      await page.evaluate(() => document.fonts?.ready);

      const buf = await page.screenshot({ fullPage: true, type: 'png' });

      return {
        buffer: buf,
        width: viewport.width,
        height: viewport.height,
        provider: this.name,
      };
    } finally {
      await page.close();
    }
  }
}
```

- [ ] **Step 2: 验证文件语法正确**

Run:
```bash
pnpm exec tsc --noEmit --moduleResolution bundler --target ES2022 --module ES2022 \
  --skipLibCheck visual-tests/providers/chromium-provider.ts 2>&1 | head -5
```
Expected: 无错误或仅有无关的类型解析提示（因为 visual-tests 还没加 tsconfig include）

- [ ] **Step 3: Commit**

```bash
git add visual-tests/providers/chromium-provider.ts
git commit -m "feat(visual-tests): ChromiumProvider 实现"
```

---

## Task 7: 改造 example App 支持 fixture 注入

**Files:**
- Modify: `example/src/App.tsx`

- [ ] **Step 1: 读取当前 `example/src/App.tsx`**

Run:
```bash
cat example/src/App.tsx
```
确认当前内容（渲染写死的 `showcase.html`）。

- [ ] **Step 2: 修改 App.tsx，支持通过 query param `?fixture=xxx` 注入 fixture HTML**

将 App.tsx 改为以下内容（保留原有 showcase 行为为默认，新增 fixture 分支）：

```tsx
import { useEffect, useMemo, useState } from '@lynx-js/react';
import './App.css';
import { HTMLRenderer } from 'lynx-html-renderer';
import htmlContent from '../html/showcase.html';

// 视觉测试 fixture 映射（按需扩展）
// Playwright 通过 query param ?fixture=<id> 指定渲染哪个 fixture
const FIXTURE_MAP: Record<string, () => Promise<string>> = {
  // 示例：fixture HTML 以 raw string import
  // 实际 fixture 文件在 visual-tests/fixtures/ 下，由构建时 copy 到 example
};

export function App(props: { onRender?: () => void }) {
  const [removeAllStyle, setRemoveAllStyle] = useState(false);
  const [fixtureHtml, setFixtureHtml] = useState<string | null>(null);

  // 从 globalProps 获取主题状态
  const darkMode = useMemo(
    () => lynx.__globalProps.theme === 'Dark',
    [lynx.__globalProps.theme],
  );

  // 视觉测试模式：从 query param 读取 fixture id
  useEffect(() => {
    const fixtureId = lynx.__globalProps.fixture as string | undefined;
    if (fixtureId && FIXTURE_MAP[fixtureId]) {
      FIXTURE_MAP[fixtureId]().then(setFixtureHtml);
    }
  }, []);

  useEffect(() => {
    console.info(`Hello, ReactLynx ${JSON.stringify(lynx.__globalProps)}`);
    console.info(`Dark mode: ${darkMode}, theme: ${lynx.__globalProps.theme}`);
  }, [darkMode]);
  props.onRender?.();

  const toggleStyle = () => {
    setRemoveAllStyle(!removeAllStyle);
  };

  const useDarkMode = darkMode && removeAllStyle;

  return (
    <scroll-view
      scroll-orientation="vertical"
      class="container"
      style={{
        backgroundColor: useDarkMode ? '#121212' : '#fff',
      }}
    >
      <HTMLRenderer
        html={fixtureHtml ?? htmlContent}
        styleMode="css-class"
        removeAllStyle={removeAllStyle}
        darkMode={useDarkMode}
      />

      {/* 控制面板（仅非 fixture 模式显示） */}
      {!fixtureHtml && (
        <view
          style={{
            position: 'fixed',
            bottom: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <view
            style={{
              backgroundColor: removeAllStyle
                ? '#28a745'
                : darkMode
                  ? '#333'
                  : '#007bff',
              padding: '12px 24px',
              borderRadius: '8px',
              shadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
            bindtap={toggleStyle}
          >
            <text
              style={{
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              {removeAllStyle ? '✓ 已移除样式' : '切换纯文本模式'}
            </text>
          </view>
        </view>
      )}
    </scroll-view>
  );
}
```

- [ ] **Step 3: 在 `example/src/global.d.ts` 中扩展 GlobalProps，添加 `fixture` 字段**

在现有的 `theme` 字段后添加：

```typescript
/**
 * GlobalProps 类型扩展
 * 定义应用的全局属性
 */
declare module '@lynx-js/types' {
  interface GlobalProps {
    /**
     * 应用主题模式
     * 'light' - 明亮模式
     * 'dark' - 暗黑模式
     */
    theme: 'Light' | 'Dark';
    /**
     * 视觉测试模式：指定要渲染的 fixture id
     * 不设置时渲染默认的 showcase.html
     */
    fixture?: string;
  }
}
```

- [ ] **Step 4: 配置 rspeedy 将 fixture HTML 文件 copy 到构建产物**

在 `example/lynx.config.ts` 的 `output.copy` 数组中追加 fixture 目录。将：

```typescript
  output: {
    copy: [
      {
        from: 'html',
        to: 'html',
      },
    ],
  },
```

改为：

```typescript
  output: {
    copy: [
      {
        from: 'html',
        to: 'html',
      },
      {
        from: '../visual-tests/fixtures',
        to: 'fixtures',
      },
    ],
  },
```

- [ ] **Step 5: 更新 `FIXTURE_MAP`，通过 fetch 加载 fixture HTML**

由于 fixture HTML 被复制到了构建产物的 `fixtures/` 目录，Web Preview 模式下可以用 fetch 加载。更新 `FIXTURE_MAP` 逻辑——将 App.tsx 顶部的 `FIXTURE_MAP` 定义替换为：

```tsx
// 视觉测试 fixture 列表（与 visual-tests/fixtures/index.ts 保持一致）
const VISUAL_FIXTURES = [
  'basic-tags-cleaning',
  'keep-tabular-data',
  'meta-fragment',
  'image-interpretation',
  'base-url',
  'ars-1',
  'bbc-1',
  'aclu',
] as const;
```

并将 `useEffect` 中的 fixture 加载逻辑改为：

```tsx
  // 视觉测试模式：从 query param 读取 fixture id，fetch 加载 HTML
  useEffect(() => {
    const fixtureId = lynx.__globalProps.fixture as string | undefined;
    if (fixtureId && (VISUAL_FIXTURES as readonly string[]).includes(fixtureId)) {
      fetch(`/fixtures/${fixtureId}.html`)
        .then((res) => res.text())
        .then(setFixtureHtml)
        .catch((err) => console.error(`Failed to load fixture: ${fixtureId}`, err));
    }
  }, []);
```

**注意：** `VISUAL_FIXTURES` 列表必须与 `visual-tests/fixtures/index.ts` 中的 fixture id 列表完全一致。

- [ ] **Step 6: 验证 example 应用类型检查通过**

Run:
```bash
cd example && pnpm exec tsc --noEmit 2>&1 | head -20
```
Expected: 无错误

- [ ] **Step 7: 手动验证——启动 dev server，访问 Web Preview 确认 showcase 正常**

Run:
```bash
pnpm dev &
sleep 10
# 找到 Web Preview URL 并 curl 测试（URL 形如 http://localhost:<port>/__web_preview）
```

确认 showcase 模式（不带 fixture 参数）仍正常。然后 kill dev server。

- [ ] **Step 8: Commit**

```bash
git add example/src/App.tsx example/src/global.d.ts example/lynx.config.ts
git commit -m "feat(example): 支持 query param 注入视觉测试 fixture HTML"
```

---

## Task 8: Lynx Web Provider

**Files:**
- Create: `visual-tests/providers/lynx-web-provider.ts`

- [ ] **Step 1: 创建 `visual-tests/providers/lynx-web-provider.ts`**

```typescript
import { chromium } from '@playwright/test';
import type { ScreenshotProvider, Screenshot, Viewport } from './types.js';
import type { Fixture } from '../fixtures/types.js';

/**
 * Lynx Web Preview provider。
 * 通过 rspeedy dev server 的 /__web_preview 路径渲染 Lynx 组件。
 * App.tsx 根据 ?fixture=<id> query param 加载对应 HTML。
 */
export class LynxWebProvider implements ScreenshotProvider {
  readonly name = 'lynx-web' as const;
  readonly available = true;

  private browser: import('@playwright/test').Browser | null = null;
  private baseUrl: string;

  /**
   * @param baseUrl rspeedy dev server 的 Web Preview 基础 URL
   *   形如 http://localhost:3000/__web_preview
   */
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async setup(): Promise<void> {
    this.browser = await chromium.launch({
      args: ['--cross-origin-isolate'],
    });
  }

  async teardown(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
  }

  async capture(fixture: Fixture, viewport: Viewport): Promise<Screenshot> {
    if (!this.browser) {
      throw new Error('LynxWebProvider not initialized — call setup() first');
    }

    const page = await this.browser.newPage({ viewport });

    try {
      // 通过 query param 指定 fixture，App.tsx 会 fetch 并渲染
      const url = `${this.baseUrl}?fixture=${fixture.id}`;
      await page.goto(url, { waitUntil: 'networkidle' });

      // 等待 web-core (wasm) 加载并渲染出元素
      await page.waitForFunction(
        () => {
          const root = document.getElementById('root');
          return root && root.children.length > 0;
        },
        { timeout: 30_000 },
      );

      // 等待渲染稳定（web-core 异步渲染）
      await page.waitForTimeout(1000);

      const buf = await page.screenshot({ fullPage: true, type: 'png' });

      return {
        buffer: buf,
        width: viewport.width,
        height: viewport.height,
        provider: this.name,
      };
    } finally {
      await page.close();
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add visual-tests/providers/lynx-web-provider.ts
git commit -m "feat(visual-tests): LynxWebProvider 实现（通过 rspeedy Web Preview 截图）"
```

---

## Task 9: iOS / Android 占位 Provider

**Files:**
- Create: `visual-tests/providers/lynx-ios-provider.ts`
- Create: `visual-tests/providers/lynx-android-provider.ts`
- Create: `visual-tests/providers/index.ts`

- [ ] **Step 1: 创建 `visual-tests/providers/lynx-ios-provider.ts`**

```typescript
import type { ScreenshotProvider, Screenshot, Viewport } from './types.js';
import { ProviderNotImplementedError } from './types.js';
import type { Fixture } from '../fixtures/types.js';

/**
 * Lynx iOS 原生渲染 provider（预留）。
 *
 * 未来接入路径：
 * 1. Xcode 模拟器 + xcrun simctl io booted screenshot（macOS only）
 * 2. 云真机服务（AWS Device Farm / BrowserStack）
 * 3. LynxExplorer + WebDriverAgent
 */
export class LynxIOSProvider implements ScreenshotProvider {
  readonly name = 'lynx-ios' as const;
  readonly available = false;

  async setup(): Promise<void> {
    throw new ProviderNotImplementedError(this.name);
  }

  async teardown(): Promise<void> {
    // no-op
  }

  async capture(_fixture: Fixture, _viewport: Viewport): Promise<Screenshot> {
    throw new ProviderNotImplementedError(this.name);
  }
}
```

- [ ] **Step 2: 创建 `visual-tests/providers/lynx-android-provider.ts`**

```typescript
import type { ScreenshotProvider, Screenshot, Viewport } from './types.js';
import { ProviderNotImplementedError } from './types.js';
import type { Fixture } from '../fixtures/types.js';

/**
 * Lynx Android 原生渲染 provider（预留）。
 *
 * 未来接入路径：
 * 1. Android 模拟器 + adb exec-out screencap -p
 * 2. 云真机服务
 * 3. LynxExplorer + UIAutomator
 */
export class LynxAndroidProvider implements ScreenshotProvider {
  readonly name = 'lynx-android' as const;
  readonly available = false;

  async setup(): Promise<void> {
    throw new ProviderNotImplementedError(this.name);
  }

  async teardown(): Promise<void> {
    // no-op
  }

  async capture(_fixture: Fixture, _viewport: Viewport): Promise<Screenshot> {
    throw new ProviderNotImplementedError(this.name);
  }
}
```

- [ ] **Step 3: 创建 `visual-tests/providers/index.ts`（provider 注册表）**

```typescript
import type { ScreenshotProvider } from './types.js';
import { ChromiumProvider } from './chromium-provider.js';
import { LynxWebProvider } from './lynx-web-provider.js';
import { LynxIOSProvider } from './lynx-ios-provider.js';
import { LynxAndroidProvider } from './lynx-android-provider.js';

/**
 * 创建所有 provider 实例。
 *
 * @param lynxWebBaseUrl rspeedy dev server 的 Web Preview URL，
 *   仅 LynxWebProvider 需要。形如 http://localhost:3000/__web_preview
 */
export function createProviders(lynxWebBaseUrl: string): ScreenshotProvider[] {
  return [
    new ChromiumProvider(),
    new LynxWebProvider(lynxWebBaseUrl),
    new LynxIOSProvider(),
    new LynxAndroidProvider(),
  ];
}
```

- [ ] **Step 4: Commit**

```bash
git add visual-tests/providers/lynx-ios-provider.ts visual-tests/providers/lynx-android-provider.ts visual-tests/providers/index.ts
git commit -m "feat(visual-tests): iOS/Android 占位 provider + provider 注册表"
```

---

## Task 10: 对比层 — 类型与配置

**Files:**
- Create: `visual-tests/compare/types.ts`
- Create: `visual-tests/compare/config.ts`

- [ ] **Step 1: 创建 `visual-tests/compare/types.ts`**

```typescript
/** 单次对比的结果 */
export interface ComparisonResult {
  /** fixture id */
  fixtureId: string;
  /** 基准 provider 名 */
  baseline: string;
  /** 候选 provider 名 */
  candidate: string;
  /** 相似度分数 0–1（1 = 完全相同） */
  similarity: number;
  /** 差异像素数 */
  diffPixels: number;
  /** 总像素数 */
  totalPixels: number;
  /** diff 图 PNG Buffer（差异标红叠加） */
  diffImage: Buffer;
  /** looks-same 复核结论（仅分数落在灰色区间时存在） */
  perceivedEqual?: boolean;
  /** 截图尺寸是否经过缩放对齐 */
  resized: boolean;
}
```

- [ ] **Step 2: 创建 `visual-tests/compare/config.ts`**

```typescript
/** 对比层配置（初始值，后续按实际数据调整） */
export const compareConfig = {
  pixelmatch: {
    /** 单像素 YIQ 色差容忍（0–1） */
    threshold: 0.1,
    /** 排除抗锯齿像素 */
    includeAA: false,
  },
  /** 触发 looks-same AA 复核的相似度区间 */
  aaReviewRange: {
    min: 0.80,
    max: 0.95,
  },
} as const;

/**
 * 判断一个相似度分数是否应触发 looks-same AA 复核。
 */
export function shouldReviewAA(similarity: number): boolean {
  return (
    similarity >= compareConfig.aaReviewRange.min &&
    similarity <= compareConfig.aaReviewRange.max
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add visual-tests/compare/
git commit -m "feat(visual-tests): 对比层类型定义与阈值配置"
```

---

## Task 11: 对比层 — 图像对比引擎

**Files:**
- Create: `visual-tests/compare/compare-images.ts`

- [ ] **Step 1: 创建 `visual-tests/compare/compare-images.ts`**

```typescript
import pixelmatch from 'pixelmatch';
import looksSame from 'looks-same';
import sharp from 'sharp';
import type { ComparisonResult } from './types.js';
import { compareConfig, shouldReviewAA } from './config.js';

/**
 * 对比两张截图，返回相似度分数 + diff 图。
 *
 * 两段式策略：
 * 1. pixelmatch 主对比（每次都跑）— 算差异像素 + 生成 diff 图
 * 2. looks-same AA 复核（仅分数落在灰色区间时）— 判断是否为亚像素噪声
 *
 * @param baselineImg  基准图 PNG Buffer
 * @param candidateImg 候选图 PNG Buffer
 * @param fixtureId    fixture id（用于结果标识）
 * @param baselineName  基准 provider 名
 * @param candidateName 候选 provider 名
 */
export async function compareImages(
  baselineImg: Buffer,
  candidateImg: Buffer,
  fixtureId: string,
  baselineName: string,
  candidateName: string,
): Promise<ComparisonResult> {
  // 1. 解码 + 尺寸对齐
  const baselineMeta = await sharp(baselineImg).metadata();
  const candidateMeta = await sharp(candidateImg).metadata();

  const baselineW = baselineMeta.width!;
  const baselineH = baselineMeta.height!;
  const candidateW = candidateMeta.width!;
  const candidateH = candidateMeta.height!;

  // 以 baseline 尺寸为基准，candidate 缩放对齐
  let resizedCandidate = candidateImg;
  const resized = baselineW !== candidateW || baselineH !== candidateH;
  if (resized) {
    resizedCandidate = await sharp(candidateImg)
      .resize(baselineW, baselineH)
      .png()
      .toBuffer();
  }

  // 2. 转为 RGBA raw buffer
  const raw1 = await sharp(baselineImg)
    .ensureAlpha()
    .raw()
    .toBuffer();
  const raw2 = await sharp(resizedCandidate)
    .ensureAlpha()
    .raw()
    .toBuffer();

  const totalPixels = baselineW * baselineH;
  const diffRaw = Buffer.alloc(totalPixels * 4);

  // 3. pixelmatch 主对比
  const diffPixels = pixelmatch(raw1, raw2, diffRaw, baselineW, baselineH, {
    threshold: compareConfig.pixelmatch.threshold,
    includeAA: compareConfig.pixelmatch.includeAA,
  });

  const similarity = 1 - diffPixels / totalPixels;

  // 4. 生成 diff PNG（差异标红）
  const diffImage = await sharp(diffRaw, {
    raw: { width: baselineW, height: baselineH, channels: 4 },
  })
    .png()
    .toBuffer();

  // 5. looks-same AA 复核（条件触发）
  let perceivedEqual: boolean | undefined;
  if (shouldReviewAA(similarity)) {
    const result = await looksSame(baselineImg, resizedCandidate, {
      ignoreAntialiasing: true,
      antialiasingTolerance: 3,
      tolerance: 2.5,
    });
    perceivedEqual = result.equal;
  }

  return {
    fixtureId,
    baseline: baselineName,
    candidate: candidateName,
    similarity,
    diffPixels,
    totalPixels,
    diffImage,
    perceivedEqual,
    resized,
  };
}
```

- [ ] **Step 2: 验证语法**

Run:
```bash
pnpm exec tsc --noEmit --moduleResolution bundler --target ES2022 --module ES2022 \
  --skipLibCheck visual-tests/compare/compare-images.ts 2>&1 | head -10
```
Expected: 无严重错误

- [ ] **Step 3: Commit**

```bash
git add visual-tests/compare/compare-images.ts
git commit -m "feat(visual-tests): pixelmatch + looks-same 两段式图像对比引擎"
```

---

## Task 12: 报告层 — HTML 对齐报告生成

**Files:**
- Create: `visual-tests/reports/generate-report.ts`

- [ ] **Step 1: 创建 `visual-tests/reports/generate-report.ts`**

```typescript
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ComparisonResult } from '../compare/types.js';
import type { Fixture } from '../fixtures/types.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPORTS_DIR = resolve(__dirname, '..');

interface ScreenshotPaths {
  baseline?: string;
  candidate?: string;
}

/**
 * 生成 HTML 对齐报告 + 结构化 JSON。
 *
 * @param results  所有对比结果
 * @param fixtures fixture 列表（用于特性分组）
 * @param screenshots 原始截图文件路径（fixtureId → { baseline, candidate }）
 */
export async function generateReport(
  results: ComparisonResult[],
  fixtures: Fixture[],
  screenshots: Map<string, ScreenshotPaths>,
): Promise<void> {
  const screenshotsDir = resolve(REPORTS_DIR, 'screenshots');
  await mkdir(screenshotsDir, { recursive: true });

  // 复制原始截图到报告目录
  for (const [fixtureId, paths] of screenshots) {
    const fixtureDir = resolve(screenshotsDir, fixtureId);
    await mkdir(fixtureDir, { recursive: true });

    if (paths.baseline) {
      await copyFile(paths.baseline, resolve(fixtureDir, 'baseline.png'));
    }
    if (paths.candidate) {
      await copyFile(paths.candidate, resolve(fixtureDir, 'candidate.png'));
    }

    // 复制 diff 图
    const result = results.find(
      (r) => r.fixtureId === fixtureId,
    );
    if (result) {
      await writeFile(resolve(fixtureDir, 'diff.png'), result.diffImage);
    }
  }

  // 生成 HTML 报告
  const html = buildHtmlReport(results, fixtures);
  await writeFile(resolve(REPORTS_DIR, 'align-report.html'), html);

  // 生成 JSON 数据
  const jsonData = results.map((r) => ({
    fixtureId: r.fixtureId,
    baseline: r.baseline,
    candidate: r.candidate,
    similarity: r.similarity,
    diffPixels: r.diffPixels,
    totalPixels: r.totalPixels,
    perceivedEqual: r.perceivedEqual,
    resized: r.resized,
  }));
  await writeFile(
    resolve(REPORTS_DIR, 'align-report.json'),
    JSON.stringify(jsonData, null, 2),
  );

  console.log(`✅ 报告已生成: ${resolve(REPORTS_DIR, 'align-report.html')}`);
}

/** 按特性分组聚合平均相似度 */
function aggregateByFeature(
  results: ComparisonResult[],
  fixtures: Fixture[],
): Map<string, number[]> {
  const featureMap = new Map<string, number[]>();
  for (const result of results) {
    const fixture = fixtures.find((f) => f.id === result.fixtureId);
    if (!fixture) continue;
    for (const feature of fixture.features) {
      const arr = featureMap.get(feature) ?? [];
      arr.push(result.similarity);
      featureMap.set(feature, arr);
    }
  }
  return featureMap;
}

function buildHtmlReport(
  results: ComparisonResult[],
  fixtures: Fixture[],
): string {
  const sorted = [...results].sort((a, b) => a.similarity - b.similarity);

  // 总览条形图数据
  const overviewBars = sorted
    .map((r) => {
      const pct = (r.similarity * 100).toFixed(1);
      const color = r.similarity >= 0.95 ? '#28a745' : r.similarity >= 0.8 ? '#ffc107' : '#dc3545';
      return `
        <div class="bar-row">
          <span class="bar-label">${r.fixtureId}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          <span class="bar-value">${pct}%</span>
        </div>`;
    })
    .join('');

  // 特性分组
  const featureAgg = aggregateByFeature(results, fixtures);
  const featureBars = [...featureAgg.entries()]
    .map(([feature, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const pct = (avg * 100).toFixed(1);
      const color = avg >= 0.95 ? '#28a745' : avg >= 0.8 ? '#ffc107' : '#dc3545';
      return `
        <div class="bar-row">
          <span class="bar-label">${feature}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          <span class="bar-value">${pct}%</span>
        </div>`;
    })
    .sort()
    .join('');

  // 逐项详情
  const details = sorted
    .map((r) => {
      const pct = (r.similarity * 100).toFixed(1);
      const aaTag = r.perceivedEqual !== undefined
        ? `<span class="tag ${r.perceivedEqual ? 'tag-ok' : 'tag-warn'}">AA复核: ${r.perceivedEqual ? '通过' : '仍有差异'}</span>`
        : '';
      const resizeTag = r.resized ? '<span class="tag tag-info">尺寸已对齐</span>' : '';
      return `
        <div class="detail-card">
          <h3>${r.fixtureId} — ${pct}%</h3>
          <p>差异像素: ${r.diffPixels} / ${r.totalPixels} ${aaTag} ${resizeTag}</p>
          <div class="img-grid">
            <div><h4>Baseline (${r.baseline})</h4><img src="screenshots/${r.fixtureId}/baseline.png" /></div>
            <div><h4>Candidate (${r.candidate})</h4><img src="screenshots/${r.fixtureId}/candidate.png" /></div>
            <div><h4>Diff</h4><img src="screenshots/${r.fixtureId}/diff.png" /></div>
          </div>
        </div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>视觉对齐报告</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { margin-top: 40px; }
    .bar-row { display: flex; align-items: center; gap: 10px; margin: 6px 0; }
    .bar-label { width: 200px; text-align: right; font-size: 14px; }
    .bar-track { flex: 1; height: 24px; background: #e9ecef; border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; transition: width 0.3s; }
    .bar-value { width: 60px; font-size: 14px; font-weight: bold; }
    .detail-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .img-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
    .img-grid img { width: 100%; border: 1px solid #dee2e6; border-radius: 4px; }
    .img-grid h4 { margin: 0 0 8px 0; font-size: 13px; color: #666; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 12px; margin-left: 8px; }
    .tag-ok { background: #d4edda; color: #155724; }
    .tag-warn { background: #fff3cd; color: #856404; }
    .tag-info { background: #d1ecf1; color: #0c5460; }
  </style>
</head>
<body>
  <h1>视觉对齐报告</h1>

  <h2>总览</h2>
  ${overviewBars}

  <h2>按特性分组（平均相似度）</h2>
  ${featureBars}

  <h2>逐项详情</h2>
  ${details}
</body>
</html>`;
}
```

- [ ] **Step 2: Commit**

```bash
git add visual-tests/reports/generate-report.ts
git commit -m "feat(visual-tests): HTML 对齐报告生成器"
```

---

## Task 13: Playwright 回归模式配置

**Files:**
- Create: `visual-tests/playwright.config.ts`

- [ ] **Step 1: 创建 `visual-tests/playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

/**
 * 回归模式配置：
 * 启动 rspeedy dev server，用 LynxWebProvider 截图，
 * 与 __screenshots__/ 下已提交的 baseline 做 toHaveScreenshot 对比。
 */
export default defineConfig({
  testDir: '.',
  testMatch: 'regression.spec.ts',

  // 截图 baseline 存放目录
  snapshotPathTemplate: '{snapshotDir}/{testName}/{projectName}.png',
  snapshotDir: '__screenshots__',

  // webServer：自动启动 rspeedy dev
  webServer: {
    command: 'cd ../example && rspeedy dev --port 3000',
    port: 3000,
    cwd: '../',
    reuseExistingServer: true,
    timeout: 120_000,
  },

  use: {
    viewport: { width: 375, height: 812 },
  },

  projects: [
    {
      name: 'lynx-web',
      use: {
        ...devices['Desktop Chrome'],
        // COOP/COEP for web-core SharedArrayBuffer
        launchOptions: {
          args: ['--cross-origin-isolate'],
        },
      },
    },
  ],
});
```

- [ ] **Step 2: Commit**

```bash
git add visual-tests/playwright.config.ts
git commit -m "feat(visual-tests): Playwright 回归模式配置"
```

---

## Task 14: 回归测试用例

**Files:**
- Create: `visual-tests/regression.spec.ts`

- [ ] **Step 1: 创建 `visual-tests/regression.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { fixtures } from './fixtures/index.js';

/**
 * 回归测试：对每个 fixture 截取 Lynx Web Preview 渲染结果，
 * 与已提交的 baseline 截图对比。
 *
 * 更新 baseline：pnpm test:visual:update
 */
const WEB_PREVIEW_BASE = 'http://localhost:3000/__web_preview';

for (const fixture of fixtures) {
  test(`regression: ${fixture.id}`, async ({ page }) => {
    await page.goto(`${WEB_PREVIEW_BASE}?fixture=${fixture.id}`, {
      waitUntil: 'networkidle',
    });

    // 等待 web-core 渲染出元素
    await page.waitForFunction(
      () => {
        const root = document.getElementById('root');
        return root && root.children.length > 0;
      },
      { timeout: 30_000 },
    );

    // 等待渲染稳定
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot(`${fixture.id}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
}
```

- [ ] **Step 2: 首次运行生成 baseline**

Run:
```bash
pnpm test:visual:update
```
Expected: 所有测试通过，生成 `visual-tests/__screenshots__/` 下的 baseline 图。这可能需要较长时间（首次启动 rspeedy dev + web-core wasm 编译）。

如果 rspeedy dev 端口不是 3000 或 Web Preview URL 不对，调整 `playwright.config.ts` 和 `regression.spec.ts` 中的 URL。

- [ ] **Step 3: 验证回归模式通过**

Run:
```bash
pnpm test:visual
```
Expected: 所有测试通过（刚生成的 baseline 对比自己应该完全匹配）。

- [ ] **Step 4: Commit baseline + 测试文件**

```bash
git add visual-tests/regression.spec.ts visual-tests/__screenshots__/
git commit -m "feat(visual-tests): 回归测试用例 + 初始 baseline"
```

---

## Task 15: 对齐评估模式入口脚本

**Files:**
- Create: `visual-tests/run-align.ts`

- [ ] **Step 1: 创建 `visual-tests/run-align.ts`**

```typescript
/**
 * 对齐评估模式入口。
 *
 * 流程：
 * 1. 启动所有 available provider
 * 2. 逐 fixture 截取所有 provider 的截图
 * 3. 以 chromium 为 baseline，对每个 candidate 做 pixelmatch + looks-same 对比
 * 4. 生成 HTML 对齐报告
 *
 * 用法：pnpm test:visual:align
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixtures } from './fixtures/index.js';
import { createProviders } from './providers/index.js';
import type { Screenshot } from './providers/types.js';
import { compareImages } from './compare/compare-images.js';
import { generateReport } from './reports/generate-report.js';
import type { ComparisonResult } from './compare/types.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TEMP_DIR = resolve(__dirname, '.tmp-screenshots');

const VIEWPORT = { width: 375, height: 812 };
const LYNX_WEB_BASE = 'http://localhost:3000/__web_preview';

async function main() {
  console.log('🎨 视觉对齐评估启动\n');

  const providers = createProviders(LYNX_WEB_BASE);
  const available = providers.filter((p) => p.available);

  console.log(`活跃 providers: ${available.map((p) => p.name).join(', ')}`);
  console.log(`fixtures: ${fixtures.length} 个\n`);

  // 初始化所有 provider
  for (const provider of available) {
    console.log(`[setup] ${provider.name}...`);
    await provider.setup();
  }

  await mkdir(TEMP_DIR, { recursive: true });

  const results: ComparisonResult[] = [];
  const screenshotPaths = new Map<string, { baseline?: string; candidate?: string }>();

  try {
    for (const fixture of fixtures) {
      console.log(`\n📸 截图: ${fixture.id} (${fixture.description})`);

      // 收集所有 provider 的截图
      const screenshots = new Map<string, Screenshot>();
      for (const provider of available) {
        process.stdout.write(`  [capture] ${provider.name}...`);
        const shot = await provider.capture(fixture, VIEWPORT);
        screenshots.set(provider.name, shot);

        // 保存临时文件
        const filePath = resolve(TEMP_DIR, `${fixture.id}-${provider.name}.png`);
        await writeFile(filePath, shot.buffer);

        // 记录路径（chromium 为 baseline，其余为 candidate）
        const entry = screenshotPaths.get(fixture.id) ?? {};
        if (provider.name === 'chromium') {
          entry.baseline = filePath;
        } else {
          entry.candidate = filePath;
        }
        screenshotPaths.set(fixture.id, entry);

        console.log(' done');
      }

      // 对比：chromium vs 每个 candidate
      const baseline = screenshots.get('chromium');
      if (!baseline) {
        console.log(`  ⚠️ 无 chromium 截图，跳过对比`);
        continue;
      }

      for (const [candidateName, candidate] of screenshots) {
        if (candidateName === 'chromium') continue;

        process.stdout.write(`  [compare] chromium vs ${candidateName}...`);
        const result = await compareImages(
          baseline.buffer,
          candidate.buffer,
          fixture.id,
          'chromium',
          candidateName,
        );
        results.push(result);

        const pct = (result.similarity * 100).toFixed(1);
        const aa = result.perceivedEqual !== undefined
          ? ` (AA: ${result.perceivedEqual ? '通过' : '仍有差异'})`
          : '';
        console.log(` ${pct}%${aa}`);
      }
    }
  } finally {
    // 清理 provider
    for (const provider of available) {
      await provider.teardown();
    }
  }

  // 生成报告
  console.log('\n📊 生成报告...');
  await generateReport(results, fixtures, screenshotPaths);

  // 汇总
  const avgSim = results.reduce((a, r) => a + r.similarity, 0) / results.length;
  console.log(`\n✅ 完成！平均相似度: ${(avgSim * 100).toFixed(1)}%`);
  console.log(`   报告: pnpm test:visual:report`);
}

main().catch((err) => {
  console.error('❌ 对齐评估失败:', err);
  process.exit(1);
});
```

- [ ] **Step 2: 验证脚本语法**

Run:
```bash
pnpm exec tsc --noEmit --moduleResolution bundler --target ES2022 --module ES2022 \
  --skipLibCheck visual-tests/run-align.ts 2>&1 | head -10
```
Expected: 无严重错误

- [ ] **Step 3: Commit**

```bash
git add visual-tests/run-align.ts
git commit -m "feat(visual-tests): 对齐评估模式入口脚本"
```

---

## Task 16: TypeScript 配置 + .gitignore 收尾

**Files:**
- Create: `visual-tests/tsconfig.json`
- Modify: `visual-tests/.gitignore`

- [ ] **Step 1: 创建 `visual-tests/tsconfig.json`（独立配置，不干扰根 tsconfig）**

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "module": "ES2022",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "types": ["node"],
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["./*.ts", "./**/*.ts"],
  "exclude": ["../node_modules"]
}
```

- [ ] **Step 2: 更新 `visual-tests/.gitignore`，添加临时截图目录**

```
reports/*
!reports/.gitkeep
__screenshots__/
.tmp-screenshots/
```

- [ ] **Step 3: 创建 `visual-tests/reports/.gitkeep`**

Run:
```bash
touch visual-tests/reports/.gitkeep
```

- [ ] **Step 4: 验证 visual-tests 的类型检查通过**

Run:
```bash
cd visual-tests && pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | head -20
```
Expected: 无错误（或仅有 @lynx-js 类型解析相关的非阻塞性提示）

如果有错误，逐个修复。常见问题：
- `Cannot find module 'looks-same'`：确认 `pnpm add -D looks-same` 已执行
- `Cannot find module 'pixelmatch'`：确认 `pnpm add -D pixelmatch @types/pixelmatch` 已执行
- `.js` 扩展名导入问题：确保 `moduleResolution: bundler`

- [ ] **Step 5: Commit**

```bash
git add visual-tests/tsconfig.json visual-tests/.gitignore visual-tests/reports/.gitkeep
git commit -m "chore(visual-tests): TypeScript 配置 + .gitignore 收尾"
```

---

## Task 17: 首次端到端验证

**Files:** 无新文件

此任务验证完整流程跑通，不写代码。

- [ ] **Step 1: 确认 rspeedy dev 可以手动启动并访问 Web Preview**

Run:
```bash
cd example && rspeedy dev --port 3000 &
sleep 15
curl -s http://localhost:3000/__web_preview | head -5
kill %1 2>/dev/null
```
Expected: 返回 HTML 内容（包含 `<div id="root">` 等）。如果端口不对，检查 rspeedy 输出的实际 URL。

- [ ] **Step 2: 跑回归测试**

Run:
```bash
pnpm test:visual
```
Expected: 所有 fixture 测试通过（baseline 已在 Task 14 生成）。

如果失败，检查：
- Web Preview URL 是否正确（看 rspeedy dev 控制台输出）
- `?fixture=` 参数是否被 App.tsx 正确读取
- fixture HTML 是否被正确 copy 到 `example/dist/fixtures/` 或 fetch 路径

- [ ] **Step 3: 跑对齐评估**

先手动启动 dev server（run-align.ts 不会自动启动 rspeedy）：

Run:
```bash
cd example && rspeedy dev --port 3000 &
sleep 15
cd ..
pnpm test:visual:align
kill %1 2>/dev/null
```
Expected: 输出每个 fixture 的相似度百分比，生成 `visual-tests/reports/align-report.html`。

- [ ] **Step 4: 打开报告检查**

Run:
```bash
pnpm test:visual:report
```
检查报告内容：总览条形图、逐项详情、diff 图是否正常显示。

- [ ] **Step 5: 记录初始对齐数据**

在对齐评估输出中记录每个 fixture 的相似度，作为后续优化的基线参考。如果整体相似度很低（<50%），检查是 fixture HTML 全量渲染的噪声问题还是真实的渲染差异。

- [ ] **Step 6: 如果一切正常，更新 baseline 并提交**

Run:
```bash
pnpm test:visual:update
git add visual-tests/__screenshots__/
git commit -m "chore(visual-tests): 端到端验证通过，更新 baseline"
```

- [ ] **Step 7: 最终验证——跑现有 Vitest 测试确保无回归**

Run:
```bash
pnpm test && pnpm check && pnpm typecheck
```
Expected: 全部通过（715 tests passed, Biome check OK, typecheck OK）。

---

## Self-Review

### 1. Spec coverage

| Spec 要求 | 对应 Task |
|---|---|
| 独立 visual-tests 目录 | Task 2 |
| 采集层 provider 接口 | Task 5 |
| Chromium provider | Task 6 |
| Lynx Web Preview provider | Task 8 |
| iOS/Android 预留 | Task 9 |
| Provider 注册表 | Task 9 |
| Fixture 类型 + 注册表 | Task 3 |
| readability 精选样本 | Task 4 |
| 改造 example App 支持 fixture 注入 | Task 7 |
| 对比层 ComparisonResult 类型 | Task 10 |
| 对比层阈值配置 | Task 10 |
| pixelmatch 主对比 | Task 11 |
| looks-same AA 复核 | Task 11 |
| 尺寸不一致处理 | Task 11 |
| HTML 对齐报告（总览 + 详情 + 特性分组） | Task 12 |
| 回归模式（toHaveScreenshot + baseline） | Task 13, 14 |
| 对齐评估模式（采集→对比→报告流水线） | Task 15 |
| npm scripts | Task 1 |
| 依赖安装 | Task 1 |
| YAGNI（不配 CI、不实现 iOS/Android、不裁剪、不用前端框架） | — |

全部覆盖，无遗漏。

### 2. Placeholder scan

- Task 4 的 fixture 选择依赖实际 readability case 内容检查结果，Step 2 给出了具体的检查命令和替代方案——不是占位符，是合理的探索性步骤。
- Task 7 的 `VISUAL_FIXTURES` 列表需与 Task 4 的 `fixtures/index.ts` 一致——已在 Task 7 Step 5 中明确标注。
- 所有代码步骤都有完整代码，无 "TODO" / "TBD" / "类似 Task N"。

### 3. Type consistency

- `ScreenshotProvider` 接口在 Task 5 定义，Task 6/8/9 所有 provider 实现的 `name`/`available`/`setup`/`teardown`/`capture` 签名一致。
- `Fixture` 在 Task 3 定义，Task 5/6/8 引用一致。
- `ComparisonResult` 在 Task 10 定义，Task 11/12/15 引用一致。
- `compareConfig` + `shouldReviewAA` 在 Task 10 定义，Task 11 引用一致。
- `Viewport`/`Screenshot` 在 Task 5 定义，Task 6/8 引用一致。
