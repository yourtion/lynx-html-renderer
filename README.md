# Lynx HTML Renderer

> 一个将 **HTML 渲染到 Lynx 原生组件** 的轻量、可扩展渲染引擎。
>
> A lightweight and extensible renderer that render HTML string on Lynx.

---

## ✨ 项目简介 | Introduction

**HTML → Lynx Renderer** 通过解析 HTML 并转换为一棵中间语义树（LynxNode），最终渲染为 Lynx 原生组件。

该项目并非浏览器实现，而是一个 **面向原生的 HTML 安全集渲染方案**，适用于：

- 内容页 / 详情页
- 富文本展示
- 配置化页面


**HTML → Lynx Renderer** parses HTML into a semantic intermediate representation (LynxNode), then renders it into Lynx native components.

It is **not a browser**, but a **native-oriented, safe HTML rendering solution**, suitable for:

- Content & detail pages
- Rich text rendering
- Configuration-driven pages

---

## 🎯 设计目标 | Design Goals

- ✅ 渲染大部分真实业务中的 HTML 页面
- ✅ 支持文本、图片、Flex 布局、基础表格
- ✅ 支持用户自定义标签与渲染组件
- ✅ 架构可扩展、可长期维护

---

## 🚀 快速开始 | Quick Start

### 安装 | Installation

```bash
npm install lynx-html-renderer
# 或
pnpm install lynx-html-renderer
```

### 基本使用 | Basic Usage

```tsx
import { HTMLRenderer } from 'lynx-html-renderer';

function App() {
  const html = '<div>Hello <strong>world</strong></div>';

  return <HTMLRenderer html={html} />;
}
```

### 转换选项 | Transform Options

`HTMLRenderer` 组件支持以下可选属性来控制 HTML 转换行为：

```tsx
import { HTMLRenderer } from 'lynx-html-renderer';

function App() {
  const html = '<div class="container" style="color: red;">Hello</div>';

  return (
    <HTMLRenderer
      html={html}
      removeAllClass={true}  // 删除所有 HTML 的 class 属性（默认：true）
      removeAllStyle={false} // 删除所有 HTML 的 style 属性（默认：false）
    />
  );
}
```

**选项说明：**

- `removeAllClass?: boolean` - 是否删除所有 HTML 的 class 属性，默认为 `true`
  - 设置为 `false` 可保留 HTML 中的 class 属性
- `removeAllStyle?: boolean` - 是否删除所有 HTML 的 style 属性，默认为 `false`
  - 设置为 `true` 可移除所有内联样式

### CSS 类模式 | CSS Class Mode

除了默认的内联样式模式，`HTMLRenderer` 还支持 **CSS 类模式**，通过预定义的 CSS 类来应用默认样式：

```tsx
import { HTMLRenderer } from 'lynx-html-renderer';
import 'lynx-html-renderer/dist/styles.css';

function App() {
  const html = '<h1>Title</h1><p>Content</p>';

  return <HTMLRenderer html={html} styleMode="css-class" />;
}
```

**CSS 类模式的优势：**

- 🎨 **样式可定制** - 通过覆盖 CSS 类来定制默认样式
- 🚀 **性能优化** - 减少重复的内联样式定义
- 🔄 **样式复用** - 多个实例共享同一份 CSS
- 📦 **主题切换** - 支持动态主题切换

**使用方式：**

```tsx
// 方式1：使用预生成 CSS（推荐）
import { HTMLRenderer } from 'lynx-html-renderer';
import 'lynx-html-renderer/dist/styles.css';

<HTMLRenderer html={html} styleMode="css-class" />

// 方式2：动态生成 CSS
import { HTMLRenderer, generateCSS } from 'lynx-html-renderer';

const css = generateCSS('my-root-class');
<style>{css}</style>
<HTMLRenderer html={html} styleMode="css-class" rootClassName="my-root-class" />
```

**样式优先级（从高到低）：**

1. HTML 的 `style` 属性（内联样式）
2. HTML 的 `class` 属性
3. TAG_MAP 的 `defaultStyle`（通过 `.lhr-{tag}` 类应用）

详细的 CSS 类模式文档请参考：[CSS 类模式指南](./docs/css-class-mode.md)

## 🚫 非目标 | Non-goals

- ❌ 不实现完整 HTML/CSS 规范
- ❌ 不执行 JavaScript（`script` / inline events）
- ❌ 不追求浏览器级像素一致
- ❌ 不做 DOM diff 或 hydration

---

## 🧠 核心思想 | Core Concepts

参考 [Architecture](./docs/architecture.md)

## 📦 功能特性 | Features

- ✅ HTML 标签 → Lynx 组件映射
- ✅ CSS style 安全集解析（白名单）
- ✅ 文本语义（strong / em / code）
- ✅ 基础表格支持（table / tr / td）
- ✅ 用户自定义渲染组件
- ✅ 插件化 Transform 机制（可选）

---

## 🧩 插件机制 | Plugin System

Transform 阶段支持插件，用于：

- 覆盖某些 HTML 标签的解析方式
- 插入自定义语义节点
- 扩展样式或结构处理逻辑

插件以 **pipeline** 形式执行，不影响核心逻辑的稳定性。

## 📖 API 文档 | API Reference

### HTMLRenderer Component

主渲染组件，用于将 HTML 字符串渲染为 Lynx 组件。

```tsx
interface HTMLRendererProps {
  html: string;                    // 要渲染的 HTML 字符串（必填）
  removeAllClass?: boolean;         // 是否删除所有 class 属性（默认：true）
  removeAllStyle?: boolean;         // 是否删除所有 style 属性（默认：false）
  styleMode?: 'inline' | 'css-class';  // 样式模式（默认：'inline'）
  rootClassName?: string;           // CSS类模式下的根容器类名（默认：'lynx-html-renderer'）
}
```

**样式模式说明：**

- `'inline'`（默认）- 所有样式作为内联样式应用
- `'css-class'` - TAG_MAP 的 defaultStyle 通过 CSS 类应用，HTML 的 style 属性仍为内联样式

### TransformOptions

HTML 转换选项，用于控制转换行为。

```tsx
interface TransformOptions {
  removeAllClass?: boolean;   // 是否删除所有 HTML 的 class 属性，默认为 true
  removeAllStyle?: boolean;   // 是否删除所有 HTML 的 style 属性，默认为 false
  styleMode?: 'inline' | 'css-class';  // 样式模式
  rootClassName?: string;     // CSS类模式下的根容器类名
}
```

### CSS 工具函数

#### generateCSS

生成完整的 CSS 字符串。

```tsx
import { generateCSS } from 'lynx-html-renderer';

// 使用默认根类名
const css = generateCSS();

// 使用自定义根类名
const customCSS = generateCSS('my-app');
```

#### getClassNameForTag

获取 HTML 标签对应的 CSS 类名。

```tsx
import { getClassNameForTag } from 'lynx-html-renderer';

getClassNameForTag('p');    // => 'lhr-p'
getClassNameForTag('h1');   // => 'lhr-h1'
getClassNameForTag('div');  // => 'lhr-div'
getClassNameForTag('img');  // => null (无默认样式)
```

---

## 🛠 使用场景 | Use Cases

- 内容管理系统（CMS）页面渲染
- 富文本展示（不依赖 WebView）
- 多端统一内容渲染

---

## 🙌 贡献 | Contributing

欢迎 issue、讨论与 PR。

本项目更关注 **架构正确性与可维护性**，而非一次性功能堆叠。

Contributions, issues, and discussions are welcome.

---

> This project is designed as a **long-term maintainable HTML-to-Native rendering pipeline**, not a one-off rich text solution.

