# 视觉对齐验证套件设计

> 日期：2026-07-10
> 状态：待实现

## 背景与动机

lynx-html-renderer 是一个 HTML→Lynx 节点的渲染器库。当前有 715 个 Vitest 测试，但全部是**结构化断言**（`toEqual` 比较 LynxNode 树、文本 snapshot、`getAttribute('style')` 子串匹配）。`@lynx-js/react/testing-library` 基于 jsdom，**没有布局引擎**，`getBoundingClientRect` 返回 0——无法验证渲染器的视觉效果是否正确。

架构文档明确写了「不追求浏览器级像素一致」，因为 Lynx 只有 flexbox、没有 block/inline flow。但这意味着我们**完全不知道**当前渲染器和浏览器渲染差多远，改代码时也**无法自动捕捉**布局回归。

本设计要解决三个问题：

1. **回归测试**——改代码时自动捕捉布局回归（baseline 快照机制）
2. **验收评估**——生成报告，评估渲染器在各种 HTML 特性上与浏览器的接近程度
3. **持续找 diff 修 bug**——通过对齐评估暴露差异，逐个定位修复

## 关键技术前提（已调研确认）

### Lynx 截图方案

- `rspeedy dev` 自带 **Web Preview**（`/__web_preview` 路径），用 `@lynx-js/web-core`（wasm + Worker）把 Lynx 组件渲染成浏览器 DOM。
- 官方自己的 web-core e2e 测试就是用 Playwright 连这个 Web Preview 截图的。
- **iOS/Android 原生渲染与 Web 平台有像素级差异**，官方明确表示不打算对齐像素化管线。但 Web 平台是唯一能在 CI/headless 跑的平台。
- `@lynx-js/react/testing-library`（现有测试用的）只有结构没有布局，不能用于视觉回归。

### 图像对比库

- **pixelmatch**（周下载 829 万，纯 JS 零依赖，Playwright 同款算法）——主对比引擎，YIQ 色差 + AA 检测，输出差异像素数 + diff 图。
- **looks-same**（周下载 13.9 万，v10 起 WASM 无原生编译）——AA 复核引擎，CIEDE2000 色差 + `ignoreAntialiasing`，是所有库里抗锯齿处理最成熟的。
- SSIM 库普遍废弃；odiff 有 npm 版本断层风险；resemble.js 低维护 + 原生依赖。均不采用。

## 整体架构

独立目录 `visual-tests/`，与现有 `tests/`（Vitest 结构测试）和 `example/`（rspeedy 应用）并列，互不干扰。

```
lynx-html-renderer/
├── src/              # 库源码（不动）
├── tests/            # 现有 715 个 Vitest 结构测试（不动）
├── example/          # rspeedy 应用（改造：加 fixture 注入）
├── visual-tests/     # ← 新增：视觉对齐验证套件
│   ├── fixtures/         # readability 精选 HTML 样本
│   ├── providers/        # 截图采集层（可插拔）
│   ├── compare/          # 对比引擎（pixelmatch + looks-same）
│   ├── reports/          # HTML 报告生成
│   ├── playwright.config.ts
│   ├── run-align.ts      # 对齐评估模式入口
│   └── README.md
```

### 三个解耦层

| 层 | 职责 | 变化频率 |
|---|---|---|
| **采集层** (`providers/`) | 给定 fixture HTML，返回一张截图。每个平台一个 provider，统一接口 | 低（加平台才动） |
| **对比层** (`compare/`) | 给定多张截图，算相似度分数 + 生成 diff 图。完全平台无关 | 极低 |
| **报告层** (`reports/`) | 把分数 + diff 图渲染成 HTML 报告 | 低 |

### 两个运行模式

| 模式 | 命令 | 采集 | 对比 | 输出 | 场景 |
|---|---|---|---|---|---|
| **回归模式** | `pnpm test:visual` | 只截 lynx-web | Playwright `toHaveScreenshot()` vs 仓库 baseline | pass/fail | CI / 日常 |
| **对齐评估模式** | `pnpm test:visual:align` | 截所有 available provider | pixelmatch + looks-same 两两对比 | HTML 报告 | 手动评估 |

## 采集层（providers）

### Provider 接口

```typescript
interface ScreenshotProvider {
  /** 平台标识，用于报告分组和文件命名 */
  readonly name: 'chromium' | 'lynx-web' | 'lynx-ios' | 'lynx-android'

  /** 初始化（启动 dev server / 模拟器 / 连真机），globalSetup 调一次 */
  setup(): Promise<void>

  /** 关闭资源，全局 teardown 调一次 */
  teardown(): Promise<void>

  /** 给定一个 fixture，返回截图 Buffer */
  capture(fixture: Fixture, viewport: Viewport): Promise<Screenshot>

  /** 声明此 provider 当前是否可用（iOS/Android 未实现时返回 false） */
  readonly available: boolean
}
```

其中 `Fixture` 是样本元信息（id、HTML 文件路径、来源标记、特性标签、描述），`Screenshot` 包含图片 Buffer + 元数据（实际尺寸、provider 名），`Viewport` 统一所有平台的截图尺寸（375×812，模拟移动端）。

### 初始实现的两个 provider

**1. `chromium-provider` —— 浏览器基准**

- 给定 fixture HTML，用 Playwright `page.setContent(html)`，等 `load` 事件 + 字体渲染稳定延迟，`page.screenshot({ fullPage: true })`。
- 无常驻 server，每个 fixture 独立 page，互不污染。
- 这是「用户眼中的正确渲染」，对齐评估的基准线。

**2. `lynx-web-provider` —— Lynx Web Preview**

- `setup()` 阶段启动 `rspeedy dev`（通过 Playwright 的 `webServer` 配置），拿到 `http://localhost:<port>/__web_preview`。
- 每个 fixture 一个 page，`goto('/__web_preview?fixture=<fixture-id>')` → 等 `#root` 下自定义元素渲染稳定（`page.waitForFunction` 检测 DOM 稳定，web-core 是 wasm 异步加载）→ 截图。

**改造 example 应用**：`example/src/App.tsx` 加 query param 分支——有 `?fixture=xxx` 时从预注册映射取 HTML 喂给 `<HTMLRenderer>`，否则保持现有 showcase 行为。对现有 example 零影响，且测试路径与 demo 路径一致。

### 预留但暂不实现的 provider

**3. `lynx-ios-provider`**（接口预留）

- `available: false`，`setup()` 抛 `ProviderNotImplementedError`
- 未来接入路径：Xcode 模拟器 `xcrun simctl io booted screenshot`（macOS）/ 云真机服务 / LynxExplorer + WebDriverAgent

**4. `lynx-android-provider`**（接口预留）

- `available: false`
- 未来接入路径：Android 模拟器 `adb exec-out screencap -p` / 云真机服务 / LynxExplorer + UIAutomator

### Provider 注册

```typescript
// visual-tests/providers/index.ts
export const providers: ScreenshotProvider[] = [
  new ChromiumProvider(),
  new LynxWebProvider(),
  new LynxIOSProvider(),     // available: false，对齐评估时自动跳过
  new LynxAndroidProvider(), // available: false
]
```

对齐评估模式下，只有 `available === true` 的 provider 参与采集和对比。回归模式只用 `lynx-web`。将来实现 iOS/Android 时，把 `available` 改成 `true` 即可，其余代码零改动。

## 样本管理（fixtures）

### 来源

从 mozilla/readability `test/test-pages/` 的 130 个 case 里，按 HTML 特性覆盖精选 10–15 篇，只取 `source.html`（原始文章 HTML）。选取标准按以下维度覆盖，每个维度至少 1–2 篇：

| 维度 | 对应 readability case 示例 |
|---|---|
| 标题 + 多级段落 | `basic-tags-cleaning`、`001` |
| 列表（ul/ol） | `keep-tabular-data` |
| 引用（blockquote） | `meta-fragment`、`wiki` |
| 图片 + figure | `image-interpretation`、`img-suffix` |
| 嵌套 div 结构 | `base-url` |
| 表格 | `keep-tabular-data` |
| 内联格式（strong/em/code/a 混合） | `ars-1`、`bbc-1` |
| 深层标题层级（h1-h4） | `aclu`、`nyt` |

最终清单在实现阶段确定（需实际过一遍 readability 的 case 确认每个文件含什么特性）。

### Fixture 结构

```typescript
interface Fixture {
  readonly id: string                    // e.g. 'basic-tags'
  readonly source: 'readability' | 'custom'
  readonly file: string                  // e.g. 'fixtures/basic-tags.html'
  readonly features: string[]            // e.g. ['heading', 'paragraph', 'list']
  readonly description: string
}
```

### 目录组织

```
visual-tests/fixtures/
├── types.ts
├── index.ts              # fixture 注册表（导出 fixtures: Fixture[]）
├── basic-tags.html
├── keep-tabular.html
├── ...
└── README.md             # 每个 fixture 来源 URL + 许可证标注
```

### 渲染策略

全量渲染原始 HTML，不做正文裁剪。不支持的 CSS 自然降级（flexbox 模型兜底），diff 报告里呈现真实的渲染器能力边界——这本身就是有价值的验收信号。若实际噪声大到无法使用，再考虑裁剪（作为后续优化方向）。

### 版权处理

- readability 许可证 Apache-2.0，整体可用
- 部分 case 原始内容 CC BY-SA 3.0——在 `fixtures/README.md` 逐个标注来源 URL 和许可证
- fixture 只作为测试输入数据，不重新分发为产品内容

### 后续扩展

`source: 'custom'` 字段预留——将来加专门测某个 bug 的最小复现 HTML，直接丢文件、注册即可。

## 对比层（compare）

平台无关，吃两张截图，输出相似度分数 + diff 图。

### 对比结果结构

```typescript
interface ComparisonResult {
  fixtureId: string
  baseline: string        // e.g. 'chromium'
  candidate: string       // e.g. 'lynx-web'
  similarity: number      // 0–1
  diffPixels: number
  totalPixels: number
  diffImage: Buffer       // 差异标红叠加图
  perceivedEqual?: boolean // looks-same 复核结论（仅灰色区间触发）
  resized: boolean        // 尺寸是否经过缩放对齐
}
```

### 两段式对比策略

**第一段：pixelmatch 主对比（每个 fixture 都跑）**

- `sharp` 把两张截图解码为 RGBA buffer（尺寸不一致时缩放对齐，结果标记 `resized: true`）
- `pixelmatch(img1, img2, diff, w, h, { threshold: 0.1, includeAA: false })`
- 自算相似度：`1 - diffPixels / totalPixels`
- 生成 diff 图（差异像素标红）

**第二段：looks-same AA 复核（条件触发）**

- 仅当 pixelmatch 相似度落在 `[0.80, 0.95]` 灰色区间时触发
- `looksSame(img1, img2, { ignoreAntialiasing: true, antialiasingTolerance: 3, tolerance: 2.5 })`
- 记录 `perceivedEqual`，取 `getDiffClusters()` 差异区域坐标供报告高亮
- 目的：区分「渲染引擎亚像素噪声」（非 bug）和「真实布局差异」（bug）。低于 0.80 大概率真实差异不需复核；高于 0.95 视为通过。

### 阈值配置

```typescript
const compareConfig = {
  pixelmatch: {
    threshold: 0.1,        // 单像素 YIQ 色差容忍
    includeAA: false,
  },
  aaReviewRange: [0.80, 0.95],  // 触发 looks-same 复核的区间
}
```

阈值不写死，放配置文件。初始值均为占位，实现后根据实际跑出的数据调整。

**注意**：回归模式**不使用** `compareConfig`——它走 Playwright `toHaveScreenshot()` 原生 baseline 机制（Playwright 内部用 pixelmatch 但有独立的 `threshold`/`maxDiffPixels`/`maxDiffPixelRatio` 参数，在 `playwright.config.ts` 里配置）。`compareConfig` 仅用于对齐评估模式。

### 尺寸不一致处理

- 以 baseline（chromium）尺寸为基准
- candidate 尺寸不一致时 `sharp.resize()` 对齐
- 结果标记 `resized: true`，报告提示「尺寸已对齐，分数含缩放误差」

## 报告层 + 运行流程

### 报告层

对齐评估报告输出到 `visual-tests/reports/`：

```
visual-tests/reports/
├── align-report.html        # 入口，打开即看
├── screenshots/             # 所有原始截图
│   ├── basic-tags/
│   │   ├── chromium.png
│   │   ├── lynx-web.png
│   │   └── diff.png
│   └── ...
└── align-report.json        # 机器可读的结构化数据
```

报告 HTML 内容：

- **总览**：所有 fixture 相似度分数横向条形图，按分数排序
- **逐项详情**：每个 fixture 三张图并排（baseline / candidate / diff 标红图）+ 分数、差异像素数、AA 复核结论、尺寸标记
- **特性分组**：按 fixture 的 `features` 标签聚合平均分（「表格类 0.72」「列表类 0.88」）
- **provider 矩阵**：将来 iOS/Android 接上后，报告变成 fixture × provider 对的分数矩阵

报告模板用模板字符串生成，不引入前端框架。`reports/` 内容加入 `.gitignore`。

### 回归模式流程（`pnpm test:visual`）

```
globalSetup
  └─ 启动 rspeedy dev（webServer）
test（每个 fixture 一个）
  └─ lynx-web-provider.capture(fixture)
  └─ Playwright expect(screenshot).toHaveScreenshot(`baseline/${fixture}.png`)
      ├─ 匹配 → pass
      └─ 不匹配 → fail（带 diff 图）
globalTeardown
  └─ 关闭 dev server
```

- baseline 图提交在 `visual-tests/__screenshots__/`，走 Playwright 原生机制
- `pnpm test:visual:update` 更新 baseline（手动确认渲染无误后）
- CI 可跑（只需 Chromium + 已提交 baseline）

### 对齐评估模式流程（`pnpm test:visual:align`）

```
阶段一：采集（所有 available provider × 所有 fixture）
  ├─ chromium-provider:  capture(每个 fixture)
  └─ lynx-web-provider:  capture(每个 fixture)
     （将来: lynx-ios, lynx-android 同理）

阶段二：对比（每个 fixture，chromium 对每个 candidate）
  └─ pixelmatch(chromium, lynx-web) → ComparisonResult
      └─ 分数落在 [0.80, 0.95]? → looks-same 复核

阶段三：报告
  └─ 汇总所有 ComparisonResult → align-report.html + align-report.json
```

不用 Playwright test runner 断言，而是 Node 脚本编排采集→对比→报告流水线（用 Playwright 的 `chromium.launch()` 能力，但不跑 test）。

### npm scripts

```json
{
  "test:visual": "playwright test --config visual-tests/playwright.config.ts",
  "test:visual:update": "playwright test --config visual-tests/playwright.config.ts --update-snapshots",
  "test:visual:align": "tsx visual-tests/run-align.ts",
  "test:visual:report": "open visual-tests/reports/align-report.html"
}
```

与现有 `pnpm test`（Vitest）完全隔离，互不影响。

## 不做的事（YAGNI）

- **首版不配 CI**——先本地跑通，CI 集成是后续优化
- **不实现 iOS/Android provider**——只预留接口，待需要时接入
- **不做正文裁剪**——全量渲染，先看真实效果
- **不引入前端框架做报告**——模板字符串够用
- **不追求 SSIM**——pixelmatch + looks-same 组合已覆盖需求

## 依赖新增

| 依赖 | 用途 | 类型 |
|---|---|---|
| `@playwright/test` | 回归模式 test runner + Chromium 控制 | devDependencies |
| `pixelmatch` | 主对比引擎 | devDependencies |
| `looks-same` | AA 复核引擎 | devDependencies |
| `sharp` | 图像解码/缩放 | devDependencies |

现有运行时依赖 `htmlparser2` 不受影响。所有新增依赖均为 devDependencies。
